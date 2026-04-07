"""Simple in-memory rate limiter for auth endpoints."""
import time
from collections import defaultdict
from fastapi import Request, HTTPException

# {ip: [(timestamp, ...)] }
_requests: dict[str, list[float]] = defaultdict(list)

# Config
WINDOW_SECONDS = 60
MAX_REQUESTS = 10  # 10 attempts per minute per IP


def check_rate_limit(request: Request):
    """Dependency that raises 429 if rate limit exceeded."""
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    cutoff = now - WINDOW_SECONDS

    # Prune old entries
    _requests[ip] = [t for t in _requests[ip] if t > cutoff]

    if len(_requests[ip]) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Limit: {MAX_REQUESTS} per {WINDOW_SECONDS}s. Try again later."
        )

    _requests[ip].append(now)
