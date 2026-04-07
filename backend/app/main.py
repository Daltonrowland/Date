import os
import asyncio
import json
import time
from pathlib import Path
from collections import defaultdict
from fastapi import FastAPI, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from .config import get_settings
from .routers import auth, quiz, matches, profiles, sanctuary
from .auth import get_current_user, decode_token
from .models import User

settings = get_settings()

app = FastAPI(
    title="Relationship Scores API",
    description="Premium compatibility scoring for modern relationships",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://frontend-production-ff3f.up.railway.app",
        "https://date-production-5ca0.up.railway.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(matches.router)
app.include_router(profiles.router)
app.include_router(sanctuary.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "relationship-scores-api"}


# ── Real-time match notifications via SSE ─────────────────────────────────────
# In-memory notification store: {user_id: [{"match_name": ..., "score": ..., "time": ...}]}
_match_notifications: dict[int, list[dict]] = defaultdict(list)


def notify_new_match(user_id: int, match_name: str, score: float, tier: str):
    """Called from quiz router when new matches are computed."""
    _match_notifications[user_id].append({
        "match_name": match_name,
        "score": score,
        "tier": tier,
        "time": time.time(),
    })


@app.get("/events/matches")
async def match_events(token: str = Query(...)):
    """SSE endpoint — frontend connects with ?token=JWT to get live match updates."""
    user_id = decode_token(token)
    if user_id is None:
        return StreamingResponse(iter([]), status_code=401)

    async def event_stream():
        last_check = time.time()
        yield f"data: {json.dumps({'type': 'connected', 'user_id': user_id})}\n\n"
        while True:
            await asyncio.sleep(3)
            notifications = _match_notifications.get(user_id, [])
            new = [n for n in notifications if n["time"] > last_check]
            if new:
                for n in new:
                    yield f"data: {json.dumps({'type': 'new_match', **n})}\n\n"
                last_check = time.time()

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# Serve frontend SPA — static assets + fallback to index.html
STATIC_DIR = Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    # Serve JS/CSS/images from /assets
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    # Serve favicon
    @app.get("/favicon.svg")
    async def favicon():
        return FileResponse(str(STATIC_DIR / "favicon.svg"))

    # Catch-all: serve index.html for any non-API route (SPA client routing)
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Don't intercept API docs
        if full_path in ("docs", "redoc", "openapi.json"):
            return None
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
