from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(matches.router)
app.include_router(profiles.router)
app.include_router(sanctuary.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "relationship-scores-api"}


@app.get("/")
def root():
    return {"message": "Relationship Scores API", "docs": "/docs"}
