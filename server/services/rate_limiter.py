import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from .logger import get_logger

logger = get_logger("rate_limiter")

class ConnectionRateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        # key: IP address string, value: list of timestamps
        self.requests = defaultdict(list)

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        # Keep only timestamps within the current window
        self.requests[ip] = [t for t in self.requests[ip] if now - t < self.window_seconds]
        
        if len(self.requests[ip]) >= self.requests_limit:
            return False
            
        self.requests[ip].append(now)
        return True

# Define rate limiters for different endpoints
# 3 workflow generations per minute to protect AI / Search API credits
workflow_limiter = ConnectionRateLimiter(requests_limit=3, window_seconds=60)

# 10 step verifications per minute
verification_limiter = ConnectionRateLimiter(requests_limit=10, window_seconds=60)

# General API endpoints (history, profile updates etc.)
general_limiter = ConnectionRateLimiter(requests_limit=40, window_seconds=60)
