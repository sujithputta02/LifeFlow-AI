import time
from typing import Dict, Any, List
from .logger import get_logger
from .azure_search import SearchService
from .azure_openai import AIService

logger = get_logger("workflow_engine")

class WorkflowEngine:
    def __init__(self, ai_service: AIService, search_service: SearchService):
        self.ai_service = ai_service
        self.search_service = search_service
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 86400  # 24 hours Cache TTL

    def _get_cache_key(self, goal: str, language: str) -> str:
        return f"{goal.strip().lower()}_{language.strip().lower()}"

    async def generate_workflow(self, goal: str, language: str = 'English') -> Dict[str, Any]:
        cache_key = self._get_cache_key(goal, language)
        now = time.time()

        # Cache Lookup
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            if now - entry["timestamp"] < self.cache_ttl:
                logger.info(f"🚀 Performance Optimization: Cache HIT for '{goal}' ({language})")
                return entry["workflow"]
            else:
                logger.info(f"⏳ Cache expired for '{goal}' ({language})")
                del self.cache[cache_key]

        start_time = time.time()
        logger.info(f"⚙️ Generating workflow pipeline for: '{goal}'")

        # 1. Fetch Search Sources
        sources = await self.search_service.search(goal)

        # 2. Run LLM Generation
        workflow = await self.ai_service.generate_workflow(goal, language, sources)

        # Cache Save
        if workflow and "steps" in workflow and len(workflow["steps"]) > 0:
            self.cache[cache_key] = {
                "workflow": workflow,
                "timestamp": now
            }

        elapsed = time.time() - start_time
        logger.info(f"⚙️ Workflow Pipeline Completed in {elapsed:.2f}s", extra={"latency_sec": elapsed})
        return workflow

    async def verify_step(self, step_title: str, step_description: str, user_proof: str) -> Dict[str, Any]:
        start_time = time.time()
        logger.info(f"🔍 Verifying step completion: '{step_title}'")
        
        result = await self.ai_service.verify_step(step_title, step_description, user_proof)
        
        elapsed = time.time() - start_time
        logger.info(f"🔍 Verification finished in {elapsed:.2f}s", extra={"latency_sec": elapsed})
        return result
