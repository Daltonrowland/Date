import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .config import get_settings
from .routers import auth, quiz, matches, profiles, sanctuary

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
