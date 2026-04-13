import os
import asyncio
import json
import time
from pathlib import Path
from collections import defaultdict
from fastapi import FastAPI, Request, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from .config import get_settings
from .routers import auth, quiz, matches, profiles, sanctuary, messages, knocks, likes, lookup, notifications, safety, calibration, economy, couples, polarity, subscriptions
from .auth import decode_token
from .database import get_db, SessionLocal
from .models import User as UserModel

settings = get_settings()

app = FastAPI(
    title="Relationship Scores API",
    description="Premium compatibility scoring for modern relationships",
    version="2.0.0",
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
app.include_router(messages.router)
app.include_router(knocks.router)
app.include_router(likes.router)
app.include_router(lookup.router)
app.include_router(notifications.router)
app.include_router(safety.router)
app.include_router(calibration.router)
app.include_router(economy.router)
app.include_router(couples.router)
app.include_router(polarity.router)
app.include_router(subscriptions.router)


# Middleware to update last_active on authenticated requests
@app.middleware("http")
async def update_last_active(request: Request, call_next):
    response = await call_next(request)
    # Update last_active for authenticated users
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        user_id = decode_token(token)
        if user_id:
            try:
                from datetime import datetime
                db = SessionLocal()
                db.query(UserModel).filter(UserModel.id == user_id).update(
                    {"last_active": datetime.utcnow()}, synchronize_session=False
                )
                db.commit()
                db.close()
            except Exception:
                pass
    return response


@app.get("/health")
def health():
    return {"status": "ok", "service": "relationship-scores-api", "version": "2.0.0"}


# ── Admin seed endpoint ───────────────────────────────────────────────────────

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "rs-admin-seed-2026")


@app.post("/admin/seed-demo")
def seed_demo(token: str = Query(...), db: Session = Depends(get_db)):
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    from scripts.seed_demo_users import seed_demo_data
    from .scoring import compute_compatibility, compute_life_path
    from .auth import hash_password
    result = seed_demo_data(db, compute_compatibility, compute_life_path, hash_password)
    return {"status": "ok", **result}


@app.post("/admin/run-imports")
def run_imports(token: str = Query(...), db: Session = Depends(get_db)):
    """Import all workbook seed CSV data into database catalog tables."""
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    from scripts.run_all_imports import import_all
    results = import_all(db)
    return {"status": "ok", **results}


@app.post("/admin/import-v12")
def import_v12(token: str = Query(...), db: Session = Depends(get_db)):
    """Import v12-specific data: question weights, shadow priors, polarity axes."""
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    from scripts.import_v12_data import import_v12 as do_import
    results = do_import(db)
    return {"status": "ok", **results}


@app.post("/admin/recompute-scores")
def recompute_scores(token: str = Query(...), db: Session = Depends(get_db)):
    """Recompute every compatibility_scores row with the current v12 engine."""
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    from .models import CompatibilityScore, QuizResponse, User
    from .scoring import compute_compatibility, build_archetype_vector, load_seed_context

    ctx = load_seed_context()
    # Refresh archetype_vector for all quiz-completed users
    users = db.query(User).filter(User.quiz_completed == True).all()
    qrs = {qr.user_id: qr for qr in db.query(QuizResponse).filter(QuizResponse.user_id.in_([u.id for u in users])).all()}
    for u in users:
        qr = qrs.get(u.id)
        if not qr:
            continue
        try:
            int_ans = {int(k): v for k, v in qr.answers.items()}
            u.archetype_vector = build_archetype_vector(int_ans, ctx)
        except Exception:
            continue
    db.commit()

    scores = db.query(CompatibilityScore).all()
    recomputed = 0
    failed = 0
    for cs in scores:
        qa = qrs.get(cs.user_a_id)
        qb = qrs.get(cs.user_b_id)
        if not qa or not qb:
            continue
        ua = next((u for u in users if u.id == cs.user_a_id), None)
        ub = next((u for u in users if u.id == cs.user_b_id), None)
        if not ua or not ub:
            continue
        try:
            a_ans = {int(k): v for k, v in qa.answers.items()}
            b_ans = {int(k): v for k, v in qb.answers.items()}
            result = compute_compatibility(
                a_ans, b_ans,
                gender_a=ua.gender or "other", gender_b=ub.gender or "other",
                zodiac_a=ua.sun_sign or "aries", zodiac_b=ub.sun_sign or "aries",
                life_path_a=ua.life_path_number or 1, life_path_b=ub.life_path_number or 1,
            )
            cs.score = result["score"]
            cs.tier = result["tier"]
            cs.tier_label = result["tier_label"]
            cs.final_norm = result.get("final_norm")
            cs.core_norm = result.get("core_norm")
            cs.behavioral_avg = result.get("behavioral_avg")
            cs.stability_avg = result.get("stability_avg")
            cs.chemistry_avg = result.get("chemistry_avg")
            cs.breakdown = result.get("breakdown")
            cs.scoring_version = "v12"
            recomputed += 1
        except Exception:
            failed += 1
    db.commit()
    return {"status": "ok", "recomputed": recomputed, "failed": failed, "archetype_vectors": len(users)}


@app.get("/admin/score-diagnostic")
def score_diagnostic(token: str = Query(...), db: Session = Depends(get_db)):
    """Return score distribution across v12 tier bands for validation."""
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    from .models import CompatibilityScore, User
    rows = db.query(CompatibilityScore).all()
    scores = [r.score for r in rows]
    if not scores:
        return {"status": "ok", "total": 0, "buckets": {}, "note": "no scores yet"}

    bands = {
        "bad_match (350-500)": 0,
        "poor_unstable (501-600)": 0,
        "medium_workable (601-700)": 0,
        "good_match (701-750)": 0,
        "excellent_match (751-850)": 0,
    }
    for s in scores:
        if s <= 500: bands["bad_match (350-500)"] += 1
        elif s <= 600: bands["poor_unstable (501-600)"] += 1
        elif s <= 700: bands["medium_workable (601-700)"] += 1
        elif s <= 750: bands["good_match (701-750)"] += 1
        else: bands["excellent_match (751-850)"] += 1

    n = len(scores)
    mean = sum(scores) / n
    var = sum((s - mean) ** 2 for s in scores) / n
    stdev = var ** 0.5
    pct = {k: round(100 * v / n, 2) for k, v in bands.items()}

    sorted_rows = sorted(rows, key=lambda r: r.score)
    def _label(cs):
        ua = db.query(User).filter(User.id == cs.user_a_id).first()
        ub = db.query(User).filter(User.id == cs.user_b_id).first()
        return {
            "score": cs.score, "tier": cs.tier_label,
            "a": f"{ua.name if ua else '?'} ({ua.archetype if ua else '?'})",
            "b": f"{ub.name if ub else '?'} ({ub.archetype if ub else '?'})",
        }
    lowest = [_label(r) for r in sorted_rows[:5]]
    highest = [_label(r) for r in sorted_rows[-5:]]

    return {
        "status": "ok",
        "total": n,
        "min": min(scores), "max": max(scores),
        "mean": round(mean, 1), "stdev": round(stdev, 1),
        "buckets": bands, "pct": pct,
        "lowest_5": lowest, "highest_5": highest,
    }


@app.post("/admin/clear-likes")
def clear_likes(token: str = Query(...), db: Session = Depends(get_db)):
    """Delete ALL likes from the likes table."""
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    from sqlalchemy import text
    count = db.execute(text("SELECT COUNT(*) FROM likes")).scalar()
    db.execute(text("DELETE FROM likes"))
    db.commit()
    return {"status": "ok", "deleted_likes": count}


@app.post("/admin/cleanup-test-users")
def cleanup_test(token: str = Query(...), keep_email: str = Query(""), db: Session = Depends(get_db)):
    """Delete all test/demo users. Optionally keep a specific email."""
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    from .models import User, QuizResponse, CompatibilityScore, Message, Knock, EmailVerificationCode
    from sqlalchemy import or_, text

    # Find all test/demo user IDs
    test_patterns = [
        "%@test.com", "%@demo.relationshipscores.app", "%@relationshipscores.app",
        "%demo%@%", "test%@%",
    ]
    query = db.query(User.id)
    conditions = [User.email.like(p) for p in test_patterns]
    query = query.filter(or_(*conditions))
    if keep_email:
        query = query.filter(User.email != keep_email)
    test_ids = [u.id for u in query.all()]

    if not test_ids:
        return {"status": "ok", "deleted_users": 0}

    # Delete related data in correct FK order
    db.execute(text(f"DELETE FROM compatibility_scores WHERE user_a_id IN ({','.join(str(i) for i in test_ids)}) OR user_b_id IN ({','.join(str(i) for i in test_ids)})"))
    db.execute(text(f"DELETE FROM messages WHERE sender_id IN ({','.join(str(i) for i in test_ids)}) OR recipient_id IN ({','.join(str(i) for i in test_ids)})"))
    db.execute(text(f"DELETE FROM knocks WHERE sender_id IN ({','.join(str(i) for i in test_ids)}) OR recipient_id IN ({','.join(str(i) for i in test_ids)})"))
    db.execute(text(f"DELETE FROM email_verification_codes WHERE user_id IN ({','.join(str(i) for i in test_ids)})"))
    db.execute(text(f"DELETE FROM sanctuaries WHERE user_id IN ({','.join(str(i) for i in test_ids)}) OR partner_id IN ({','.join(str(i) for i in test_ids)})"))
    db.execute(text(f"DELETE FROM quiz_responses WHERE user_id IN ({','.join(str(i) for i in test_ids)})"))
    db.execute(text(f"DELETE FROM users WHERE id IN ({','.join(str(i) for i in test_ids)})"))
    db.commit()

    return {"status": "ok", "deleted_users": len(test_ids)}


# ── Real-time match notifications via SSE ─────────────────────────────────────
_match_notifications: dict[int, list[dict]] = defaultdict(list)


def notify_new_match(user_id: int, match_name: str, score: float, tier: str):
    _match_notifications[user_id].append({
        "match_name": match_name, "score": score, "tier": tier, "time": time.time(),
    })


@app.get("/events/matches")
async def match_events(token: str = Query(...)):
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


# ── Serve frontend SPA ────────────────────────────────────────────────────────
STATIC_DIR = Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="static-assets")

    @app.get("/favicon.svg")
    async def favicon():
        return FileResponse(str(STATIC_DIR / "favicon.svg"))

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path in ("docs", "redoc", "openapi.json"):
            return None
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))
