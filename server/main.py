import os
import time
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

from services.logger import get_logger
from services.azure_search import AzureSearchService
from services.azure_openai import AzureOpenAIService
from services.workflow_engine import WorkflowEngine
from services.rate_limiter import workflow_limiter, verification_limiter, general_limiter

# Load Environment Variables
load_dotenv()

logger = get_logger("main")

# DNS Fix for SRV resolution issues (same logic as JS server)
try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8']
    logger.info("Successfully configured custom DNS server (8.8.8.8) for database connection.")
except Exception as dns_err:
    logger.warning(f"Could not configure custom DNS server: {dns_err}")

# Initialize Database
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    logger.error("MONGODB_URI environment variable is missing!")
    raise RuntimeError("Missing MONGODB_URI config")

db_client = AsyncIOMotorClient(MONGODB_URI)
try:
    db = db_client.get_default_database()
    if db is None:
        db = db_client["lifeflow"]
except Exception:
    db = db_client["lifeflow"]

# Initialize OO Services
search_service = AzureSearchService()
ai_service = AzureOpenAIService()
engine = WorkflowEngine(ai_service=ai_service, search_service=search_service)

# Initialize FastAPI App
app = FastAPI(title="LifeFlow API", description="FastAPI microservice for LifeFlow")

# CORS Middleware Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware for request/response JSON logging (Observability)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    path = request.url.path
    method = request.method
    
    logger.info(f"Incoming request: {method} {path}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(
            f"Completed request: {method} {path} - Status: {response.status_code} in {process_time:.2f}s",
            extra={"latency_sec": process_time, "status_code": response.status_code}
        )
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.exception(
            f"Request failed: {method} {path} - Error: {str(e)} in {process_time:.2f}s",
            extra={"latency_sec": process_time}
        )
        raise e

# --- REQUEST/RESPONSE SCHEMAS ---

class GenerateWorkflowRequest(BaseModel):
    goal: str
    language: Optional[str] = "English"
    guestId: str

class VerifyStepRequest(BaseModel):
    stepTitle: str
    stepDescription: Optional[str] = ""
    userProof: str

class GamificationUpdateRequest(BaseModel):
    guestId: str
    points: int
    level: int
    badges: List[dict]

# --- ROUTES ---

@app.get("/")
async def root():
    return {"message": "LifeFlow API is running"}

@app.get("/api/v1/health")
async def health_check():
    health_status = {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "services": {}}
    
    # 1. MongoDB Health Check
    try:
        await db.command("ping")
        health_status["services"]["mongodb"] = "healthy"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["services"]["mongodb"] = f"unhealthy: {str(e)}"
        
    # 2. Azure Search Health Check
    if os.getenv("AZURE_SEARCH_ENDPOINT") and os.getenv("AZURE_SEARCH_KEY"):
        health_status["services"]["azure_search"] = "configured"
    else:
        health_status["services"]["azure_search"] = "not configured (running in Bing / AI fallback)"

    # 3. AI Services Health Check
    if os.getenv("AZURE_OPENAI_ENDPOINT") and os.getenv("AZURE_OPENAI_API_KEY"):
        health_status["services"]["azure_openai"] = "configured"
    elif os.getenv("OPENROUTER_API_KEY"):
        health_status["services"]["openrouter"] = "configured"
    else:
        health_status["services"]["ai_services"] = "no keys configured (mock mode)"
        
    return health_status

@app.post("/api/v1/generate-workflow")
async def api_generate_workflow(req: GenerateWorkflowRequest, request: Request):
    client_ip = request.client.host
    if not workflow_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for IP {client_ip} on /generate-workflow")
        raise HTTPException(status_code=429, detail="Too many workflow generations. Please wait a minute.")
    try:
        logger.info(f"Received workflow generation request for goal: '{req.goal}'")
        
        # 1. Generate via OO engine
        workflow = await engine.generate_workflow(req.goal, req.language)
        
        # 2. Asynchronously save to Database (mirroring Node.js behaviour)
        if workflow and workflow.get("steps"):
            try:
                workflow_doc = {
                    "goal": workflow.get("goal") or req.goal,
                    "steps": workflow["steps"],
                    "locationContext": workflow.get("locationContext"),
                    "confidenceScore": workflow.get("confidenceScore"),
                    "language": req.language,
                    "guestId": req.guestId,
                    "createdAt": datetime.utcnow()
                }
                result = await db["workflows"].insert_one(workflow_doc)
                logger.info(f"💾 Workflow successfully saved to MongoDB with ID: {result.inserted_id}")
            except Exception as save_err:
                logger.error(f"❌ Failed to save workflow to database: {save_err}")
                
        return workflow
    except Exception as e:
        logger.exception(f"Failed to generate workflow: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate workflow")

@app.get("/api/v1/history")
async def api_get_history(request: Request, guestId: Optional[str] = None):
    client_ip = request.client.host
    if not general_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a minute.")
    try:
        query = {"guestId": guestId} if guestId else {}
        history = []
        cursor = db["workflows"].find(query).sort("createdAt", -1).limit(20)
        async for doc in cursor:
            # Format ObjectId and datetime for client-side JSON serialization
            doc["_id"] = str(doc["_id"])
            if "createdAt" in doc and isinstance(doc["createdAt"], datetime):
                doc["createdAt"] = doc["createdAt"].isoformat()
            history.append(doc)
        return history
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

@app.delete("/api/v1/history/{id}")
async def api_delete_workflow(id: str, request: Request):
    client_ip = request.client.host
    if not general_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a minute.")
    try:
        if not ObjectId.is_valid(id):
            raise HTTPException(status_code=400, detail="Invalid ObjectId format")
            
        result = await db["workflows"].delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Workflow not found")
            
        return {"message": "Workflow deleted successfully"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        logger.error(f"Error deleting workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete workflow")

@app.post("/api/v1/verify-step")
async def api_verify_step(req: VerifyStepRequest, request: Request):
    client_ip = request.client.host
    if not verification_limiter.is_allowed(client_ip):
        logger.warning(f"Rate limit exceeded for IP {client_ip} on /verify-step")
        raise HTTPException(status_code=429, detail="Too many verification requests. Please wait a minute.")
    try:
        verification = await engine.verify_step(req.stepTitle, req.stepDescription, req.userProof)
        return verification
    except Exception as e:
        logger.exception(f"Failed to verify step: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify step")

@app.get("/api/v1/gamification/{guestId}")
async def api_get_gamification(guestId: str, request: Request):
    client_ip = request.client.host
    if not general_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a minute.")
    try:
        profile = await db["guestprofiles"].find_one({"guestId": guestId})
        if not profile:
            profile = {
                "guestId": guestId,
                "points": 0,
                "level": 1,
                "badges": [],
                "lastActive": datetime.utcnow()
            }
            result = await db["guestprofiles"].insert_one(profile)
            profile["_id"] = str(result.inserted_id)
            logger.info(f"✨ New Guest Profile created for: {guestId}")
        else:
            profile["_id"] = str(profile["_id"])
            
        if "lastActive" in profile and isinstance(profile["lastActive"], datetime):
            profile["lastActive"] = profile["lastActive"].isoformat()
        for badge in profile.get("badges", []):
            if "date" in badge and isinstance(badge["date"], datetime):
                badge["date"] = badge["date"].isoformat()
                
        return profile
    except Exception as e:
        logger.error(f"Error fetching gamification profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@app.post("/api/v1/gamification/update")
async def api_update_gamification(req: GamificationUpdateRequest, request: Request):
    client_ip = request.client.host
    if not general_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait a minute.")
    try:
        # Parse badge ISO datetimes if present in JSON request
        badges_to_save = []
        for badge in req.badges:
            badge_date = badge.get("date")
            if badge_date:
                try:
                    # Convert string date back to datetime
                    parsed_date = datetime.fromisoformat(badge_date.replace("Z", "+00:00"))
                except ValueError:
                    parsed_date = datetime.utcnow()
            else:
                parsed_date = datetime.utcnow()
                
            badges_to_save.append({
                "id": badge.get("id"),
                "date": parsed_date
            })

        await db["guestprofiles"].find_one_and_update(
            {"guestId": req.guestId},
            {
                "$set": {
                    "points": req.points,
                    "level": req.level,
                    "badges": badges_to_save,
                    "lastActive": datetime.utcnow()
                }
            },
            upsert=True
        )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error updating gamification profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
