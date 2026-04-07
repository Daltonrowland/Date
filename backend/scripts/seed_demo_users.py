"""
Seed 20 realistic demo users with varied archetypes, shadows, zodiac signs,
life paths, completed quizzes, and pre-computed compatibility scores
against ALL existing real users (so they show up on everyone's dashboard).
"""
import random
import string
import secrets
from datetime import datetime

DEMO_USERS = [
    {"name": "Jessica Martinez", "age": 27, "gender": "Woman", "looking_for": "Men", "sun_sign": "aries", "dob": "1999-04-02", "bio": "Spontaneous, passionate, and always planning the next adventure. I need someone who can keep up."},
    {"name": "Marcus Johnson", "age": 31, "gender": "Man", "looking_for": "Women", "sun_sign": "taurus", "dob": "1995-05-14", "bio": "Steady hands, warm heart. I cook better than most restaurants."},
    {"name": "Priya Patel", "age": 26, "gender": "Woman", "looking_for": "Men", "sun_sign": "gemini", "dob": "2000-06-07", "bio": "Data scientist by day, stargazer by night. I believe in patterns and chemistry."},
    {"name": "Darius Thompson", "age": 34, "gender": "Man", "looking_for": "Women", "sun_sign": "cancer", "dob": "1992-07-19", "bio": "Family-oriented with a soft heart and a strong back. Loyalty is everything."},
    {"name": "Sofia Reyes", "age": 29, "gender": "Woman", "looking_for": "Everyone", "sun_sign": "leo", "dob": "1997-08-08", "bio": "Life of the party but secretly an introvert recharging at home with my cat."},
    {"name": "Kai Nakamura", "age": 28, "gender": "Non-binary", "looking_for": "Everyone", "sun_sign": "virgo", "dob": "1998-09-12", "bio": "Perfectionist healing from perfectionism. Art, tea, and honest conversations."},
    {"name": "Isabella Torres", "age": 30, "gender": "Woman", "looking_for": "Men", "sun_sign": "libra", "dob": "1996-10-23", "bio": "Diplomat by nature, romantic by choice. Balance is my love language."},
    {"name": "Elijah Carter", "age": 33, "gender": "Man", "looking_for": "Women", "sun_sign": "scorpio", "dob": "1993-11-15", "bio": "Intense but loyal. If I let you in, you're in for life. No half-measures."},
    {"name": "Zara Williams", "age": 24, "gender": "Woman", "looking_for": "Men", "sun_sign": "sagittarius", "dob": "2002-12-03", "bio": "Wanderlust in human form. I'll try anything once and most things twice."},
    {"name": "Liam O'Brien", "age": 32, "gender": "Man", "looking_for": "Women", "sun_sign": "capricorn", "dob": "1994-01-09", "bio": "Building something real — career, home, relationship. Ambition meets warmth."},
    {"name": "Mia Johansson", "age": 25, "gender": "Woman", "looking_for": "Everyone", "sun_sign": "aquarius", "dob": "2001-02-14", "bio": "Free spirit with a scientific mind. I contain multitudes and contradictions."},
    {"name": "Noah Kim", "age": 35, "gender": "Man", "looking_for": "Women", "sun_sign": "pisces", "dob": "1991-03-05", "bio": "Dreamer, musician, hopeless romantic. If you quote Rumi I'll probably propose."},
    {"name": "Jade Mitchell", "age": 27, "gender": "Woman", "looking_for": "Men", "sun_sign": "aries", "dob": "1999-04-18", "bio": "Fiery, direct, no games. I know what I want and I'm not afraid to say it."},
    {"name": "Roman Vasquez", "age": 36, "gender": "Man", "looking_for": "Women", "sun_sign": "taurus", "dob": "1990-05-01", "bio": "Old soul in a modern world. Looking for depth, not drama. Quality over everything."},
    {"name": "Aaliyah Brooks", "age": 28, "gender": "Woman", "looking_for": "Men", "sun_sign": "gemini", "dob": "1998-06-21", "bio": "Writer, overthinker, and the best person to bring to a dinner party."},
    {"name": "Xavier Lewis", "age": 29, "gender": "Man", "looking_for": "Everyone", "sun_sign": "cancer", "dob": "1997-07-04", "bio": "Emotional intelligence is my superpower. Also I make incredible pasta."},
    {"name": "Aisha Okonkwo", "age": 31, "gender": "Woman", "looking_for": "Men", "sun_sign": "leo", "dob": "1995-08-22", "bio": "Confident, compassionate, and done settling. Show up or step aside."},
    {"name": "Theo Anderson", "age": 23, "gender": "Man", "looking_for": "Women", "sun_sign": "virgo", "dob": "2003-09-09", "bio": "Young but emotionally literate. Clarity is the most attractive quality."},
    {"name": "Camille Dubois", "age": 33, "gender": "Woman", "looking_for": "Men", "sun_sign": "libra", "dob": "1993-10-16", "bio": "Half French, fully romantic. I believe in love and healthy boundaries equally."},
    {"name": "Jayden Walker", "age": 40, "gender": "Man", "looking_for": "Women", "sun_sign": "scorpio", "dob": "1986-11-28", "bio": "Divorced, healed, and wide open. The best chapters are unwritten."},
]

ARCHETYPES = ["Analyzer", "Fixer", "Icebox", "Performer", "Phantom Seeker",
              "Quiet Exit", "Regulated Grown-Up", "Romantic Idealist", "Survivor", "Translator"]
SHADOWS = ["Chameleon", "Love Bomber", "Manipulator", "Scorekeeper", "Self-Saboteur", "Stonewaller"]

DEMO_EMAIL_DOMAIN = "@demo.relationshipscores.app"


def seed_demo_data(db_session, scoring_fn, life_path_fn, hash_fn):
    """
    Wipe existing demo users, create 20 fresh demo users,
    and compute compatibility scores against ALL real users.
    """
    from app.models import User, QuizResponse, CompatibilityScore, Message, Knock

    # ── Step 1: Delete existing demo data ─────────────────────────────────
    demo_ids = [u.id for u in db_session.query(User.id).filter(User.email.like(f"%{DEMO_EMAIL_DOMAIN}")).all()]
    if demo_ids:
        db_session.query(CompatibilityScore).filter(
            (CompatibilityScore.user_a_id.in_(demo_ids)) | (CompatibilityScore.user_b_id.in_(demo_ids))
        ).delete(synchronize_session=False)
        db_session.query(Message).filter(
            (Message.sender_id.in_(demo_ids)) | (Message.recipient_id.in_(demo_ids))
        ).delete(synchronize_session=False)
        db_session.query(Knock).filter(
            (Knock.sender_id.in_(demo_ids)) | (Knock.recipient_id.in_(demo_ids))
        ).delete(synchronize_session=False)
        db_session.query(QuizResponse).filter(QuizResponse.user_id.in_(demo_ids)).delete(synchronize_session=False)
        db_session.query(User).filter(User.id.in_(demo_ids)).delete(synchronize_session=False)
        db_session.commit()

    # ── Step 2: Create 20 demo users ──────────────────────────────────────
    q_ids = list(range(1, 51)) + list(range(100, 110))
    hashed_pw = hash_fn("DemoPass123!")
    demo_users = []

    for i, u in enumerate(DEMO_USERS):
        rs_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
        while db_session.query(User).filter(User.rs_code == rs_code).first():
            rs_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))

        lp = life_path_fn(u["dob"])
        user = User(
            rs_code=rs_code,
            email=f"demo{i+1}{DEMO_EMAIL_DOMAIN}",
            hashed_password=hashed_pw,
            name=u["name"],
            age=u["age"],
            gender=u["gender"],
            looking_for=u["looking_for"],
            sun_sign=u["sun_sign"],
            date_of_birth=datetime.strptime(u["dob"], "%Y-%m-%d").date(),
            life_path_number=lp,
            bio=u["bio"],
            photo_url=f"https://i.pravatar.cc/400?img={i + 1}",
            profile_photo=f"https://i.pravatar.cc/400?img={i + 1}",
            email_verified=True,
            is_verified=True,
            quiz_completed=True,
            archetype=ARCHETYPES[i % len(ARCHETYPES)],
            archetype_secondary=ARCHETYPES[(i + 3) % len(ARCHETYPES)],
            shadow_type=SHADOWS[i % len(SHADOWS)],
            archetype_score=round(random.uniform(30, 90), 1),
            shadow_score=round(random.uniform(30, 90), 1),
            readiness_score=round(random.uniform(35, 90), 1),
            readiness_forecast=random.choice(["Strong outlook", "Stable outlook", "Mixed outlook", "Guarded outlook"]),
        )
        db_session.add(user)
        db_session.flush()

        answers = {str(q): random.choice(["A", "B", "C", "D", "E"]) for q in q_ids}
        db_session.add(QuizResponse(user_id=user.id, answers=answers, scoring_version="phase1.v1"))
        demo_users.append(user)

    db_session.commit()

    # ── Step 3: Find ALL real users with completed quizzes ────────────────
    real_users = db_session.query(User).filter(
        User.quiz_completed == True,
        ~User.email.like(f"%{DEMO_EMAIL_DOMAIN}"),
    ).all()

    # ── Step 4: Compute compatibility between demo users AND all real users ─
    all_scorable = demo_users + real_users

    for i, user_a in enumerate(all_scorable):
        for j, user_b in enumerate(all_scorable):
            if user_a.id == user_b.id:
                continue
            # Only compute if at least one is a demo user (avoid re-scoring real×real)
            if user_a.email and DEMO_EMAIL_DOMAIN not in user_a.email and \
               user_b.email and DEMO_EMAIL_DOMAIN not in user_b.email:
                continue

            # Skip if already exists
            existing = db_session.query(CompatibilityScore).filter(
                CompatibilityScore.user_a_id == user_a.id,
                CompatibilityScore.user_b_id == user_b.id,
            ).first()
            if existing:
                continue

            qr_a = db_session.query(QuizResponse).filter(QuizResponse.user_id == user_a.id).first()
            qr_b = db_session.query(QuizResponse).filter(QuizResponse.user_id == user_b.id).first()
            if not qr_a or not qr_b:
                continue

            a_ans = {int(k): v for k, v in qr_a.answers.items()}
            b_ans = {int(k): v for k, v in qr_b.answers.items()}

            try:
                result = scoring_fn(
                    a_ans, b_ans,
                    gender_a=user_a.gender or "other",
                    gender_b=user_b.gender or "other",
                    zodiac_a=user_a.sun_sign or "aries",
                    zodiac_b=user_b.sun_sign or "aries",
                    life_path_a=user_a.life_path_number or 1,
                    life_path_b=user_b.life_path_number or 1,
                )
            except Exception:
                continue

            db_session.add(CompatibilityScore(
                user_a_id=user_a.id, user_b_id=user_b.id,
                score=result["score"], tier=result["tier"], tier_label=result["tier_label"],
                final_norm=result.get("final_norm"),
                core_norm=result.get("core_norm"),
                behavioral_avg=result.get("behavioral_avg"),
                stability_avg=result.get("stability_avg"),
                chemistry_avg=result.get("chemistry_avg"),
                zodiac_norm=result.get("zodiac_norm"),
                numerology_norm=result.get("numerology_norm"),
                cosmic_overlay=result.get("cosmic_overlay"),
                breakdown=result.get("breakdown"),
                top_positive_drivers=result.get("top_positive_drivers"),
                top_friction_drivers=result.get("top_friction_drivers"),
                scoring_version="phase1.v1",
            ))

    db_session.commit()

    return {
        "demo_users_created": len(demo_users),
        "real_users_found": len(real_users),
        "scores_direction": "demo↔demo + demo↔real (both directions)",
    }
