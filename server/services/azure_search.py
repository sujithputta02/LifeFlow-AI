import os
import httpx
from typing import List, Dict, Any
from azure.search.documents.aio import SearchClient as AsyncSearchClient
from azure.core.credentials import AzureKeyCredential
from .logger import get_logger

logger = get_logger("azure_search")

class ServiceRateLimiter:
    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        self.timestamps = []

    def allow_request(self) -> bool:
        now = time.time()
        self.timestamps = [t for t in self.timestamps if now - t < self.window]
        if len(self.timestamps) >= self.limit:
            return False
        self.timestamps.append(now)
        return True

# Define limiters for external paid services
tavily_api_limiter = ServiceRateLimiter(limit=5, window=60)
bing_api_limiter = ServiceRateLimiter(limit=5, window=60)

class SearchService:
    async def search(self, query: str) -> List[Dict[str, Any]]:
        raise NotImplementedError("Search method must be implemented by subclasses")

class AzureSearchService(SearchService):
    def __init__(self):
        self.endpoint = os.getenv("AZURE_SEARCH_ENDPOINT", "https://placeholder.search.windows.net")
        self.api_key = os.getenv("AZURE_SEARCH_KEY", "placeholder_key")
        self.index_name = os.getenv("AZURE_SEARCH_INDEX", "lifeflow-index")
        self.bing_key = os.getenv("BING_SEARCH_API_KEY")
        self.tavily_key = os.getenv("TAVILY_API_KEY")
        self.use_mock = os.getenv("USE_MOCK_DATA", "false").lower() == "true"

    async def search_tavily(self, query: str) -> List[Dict[str, Any]]:
        if not self.tavily_key:
            logger.info("No TAVILY_API_KEY found. Skipping Tavily search.")
            return []

        if not tavily_api_limiter.allow_request():
            logger.warning("Global rate limit reached for Tavily Search API. Conserving credits, skipping...")
            return []

        try:
            logger.info(f"🔍 Primary RAG Search: Querying Tavily for '{query}'...")
            url = "https://api.tavily.com/search"
            headers = {"Content-Type": "application/json"}
            payload = {
                "api_key": self.tavily_key,
                "query": query,
                "search_depth": "basic",
                "include_answer": False,
                "max_results": 2
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                if response.status_code != 200:
                    logger.error(f"Tavily API returned status code {response.status_code}: {response.text}")
                    return []
                
                data = response.json()
                tavily_results = data.get("results", [])
                
                results = []
                for page in tavily_results:
                    results.append({
                        "title": page.get("title") or "Tavily Source",
                        "content": page.get("content") or "",
                        "url": page.get("url") or "",
                        "sourceType": "Tavily RAG Search (Primary)"
                    })
                logger.info(f"Tavily Search returned {len(results)} results.")
                return results
        except Exception as e:
            logger.exception("Tavily Search failed", extra={"error": str(e)})
            return []

    async def search_bing(self, query: str) -> List[Dict[str, Any]]:
        if not self.bing_key:
            logger.info("No BING_SEARCH_API_KEY found. Skipping Bing search fallback.")
            return []

        if not bing_api_limiter.allow_request():
            logger.warning("Global rate limit reached for Bing Search API. Conserving credits, skipping...")
            return []

        try:
            logger.info(f"🌐 Fallback: Searching Bing for '{query}'...")
            url = "https://api.bing.microsoft.com/v7.0/search"
            headers = {"Ocp-Apim-Subscription-Key": self.bing_key}
            params = {"q": query, "count": 2, "responseFilter": "Webpages"}
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers, params=params)
                if response.status_code != 200:
                    logger.error(f"Bing API returned status code {response.status_code}")
                    return []
                
                data = response.json()
                web_pages = data.get("webPages", {}).get("value", [])
                
                results = []
                for page in web_pages:
                    results.append({
                        "title": page.get("name", "Web Page"),
                        "content": page.get("snippet", ""),
                        "url": page.get("url", ""),
                        "sourceType": "Bing Web Search (High Confidence)"
                    })
                return results
        except Exception as e:
            logger.exception("Bing Search failed", extra={"error": str(e)})
            return []

    async def search(self, query: str) -> List[Dict[str, Any]]:
        if self.use_mock:
            logger.info("Using mock Azure Search data")
            return [
                {"title": "Hospital Admission Guide", "url": "https://hospital.gov.in/guide", "content": "Official guidelines...", "sourceType": "Mock Search"},
                {"title": "Insurance Policies", "url": "https://insurance.gov.in/policies", "content": "Details on claiming...", "sourceType": "Mock Search"}
            ]

        # 1. Try Tavily Search (Primary)
        if self.tavily_key:
            tavily_results = await self.search_tavily(query)
            if tavily_results:
                return tavily_results
            logger.info("Tavily Search returned no results. Falling back to Azure AI Search...")

        # 2. Fall back to Azure AI Search
        azure_results = []
        if os.getenv("AZURE_SEARCH_KEY") and os.getenv("AZURE_SEARCH_ENDPOINT"):
            try:
                logger.info(f"Querying Azure AI Search Index: {self.index_name}...")
                async with AsyncSearchClient(self.endpoint, self.index_name, AzureKeyCredential(self.api_key)) as client:
                    results = await client.search(search_text=query, top=2)
                    async for result in results:
                        azure_results.append({
                            "title": result.get("title") or result.get("name") or "Document",
                            "content": result.get("content") or result.get("description") or "",
                            "url": result.get("url") or "",
                            "sourceType": "Azure AI Search (Private)"
                        })
                logger.info(f"Azure Search returned {len(azure_results)} results.")
            except Exception as e:
                logger.warning(f"Azure Search Query Failed (or Index missing): {str(e)}")

        # 3. Fall back to Bing Search
        if not azure_results:
            logger.info("Azure Search Confidence: LOW (No results). Switching to Bing...")
            bing_results = await self.search_bing(query)
            if bing_results:
                return bing_results

        return azure_results
