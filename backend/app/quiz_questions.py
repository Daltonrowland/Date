"""
Genesis OS — Real quiz questions loaded from workbook seed data.

60 questions across dimensions:
  - CommunicationHealth (Q1-8)
  - ConflictRepair (Q9-16)
  - EmotionalRegulation (Q17-24)
  - ValuesLifestyle (Q25-32)
  - CommitmentPace (Q33-40)
  - EmotionalNeeds (Q41-50)
  - ShadowPattern (Q100-109)

Each question has 5 answer options (A-E) with real answer text from the
workbook. Answers carry archetype assignments, scoring norms, and risk
profiles used by the Genesis OS compatibility engine.
"""
from __future__ import annotations
import csv
from pathlib import Path
from functools import lru_cache
from typing import List, Dict, Any

SEED_DIR = Path(__file__).parent / "seed_data" / "csv"

# Question text — derived from dimensions and answer context
QUESTION_TEXTS: Dict[int, str] = {
    1:  "When something feels off between you and someone you care about, what's your most natural first response?",
    2:  "When someone you're close to suddenly goes quiet or pulls back, what do you typically feel?",
    3:  "When you sense tension in a relationship but nothing has been said, what do you usually do?",
    4:  "When someone you like seems inconsistent — warm one day, distant the next — how do you respond?",
    5:  "How much do you expect emotionally from the people close to you?",
    6:  "When someone is unpredictable with their energy or attention, what's your instinct?",
    7:  "When someone is quiet or seems withdrawn, what's your first move?",
    8:  "When a pattern you've seen before starts showing up again in a relationship, what happens inside you?",
    9:  "When you're the one who's been giving more energy in a relationship, how do you respond?",
    10: "When you realize you've been the emotional safe place more than feels fair, what do you do?",
    11: "After a disagreement, how do you usually handle the space between conflict and resolution?",
    12: "When something shifts in a relationship — the energy changes but no one says why — how do you handle it?",
    13: "When you need to clarify something before you can fully open up, how do you handle that?",
    14: "When someone gives you minimal effort, how do you tend to respond?",
    15: "When something new and exciting starts with someone, what's going on underneath your enthusiasm?",
    16: "When someone's interest in you is unpredictable, what do you do?",
    17: "When you're upset, what's your process for deciding whether to bring it up?",
    18: "When someone you care about pulls back, what happens to your energy toward them?",
    19: "When someone seems emotionally unavailable, how do you interpret that?",
    20: "When you sense that someone isn't quite where you are emotionally, how do you handle it?",
    21: "When someone's affection or attention is inconsistent, what's your default response?",
    22: "When a relationship starts feeling one-sided, what's your first instinct?",
    23: "When you realize you've been over-functioning in a dynamic, what do you do?",
    24: "When someone doesn't show up in the way you needed, how do you file that away?",
    25: "When you share something personal and it lands flat or gets ignored, what happens next?",
    26: "When you extend effort toward someone and it goes unacknowledged, how do you respond?",
    27: "When someone reacts to your vulnerability in a way that doesn't feel safe, what do you do?",
    28: "When you suspect someone isn't being fully honest with you, what's your move?",
    29: "When someone's effort toward you starts dropping off, how do you match it?",
    30: "When you put yourself out there and it doesn't land the way you hoped, how do you recover?",
    31: "When a moment of emotional honesty passes without acknowledgment, how do you handle it?",
    32: "When you feel your energy going somewhere it isn't matched, how quickly do you adjust?",
    33: "When a relationship starts to feel like it's not going anywhere, what do you do?",
    34: "When someone prioritizes someone else over you in a way that stings, how do you respond?",
    35: "When someone says something that catches you off guard emotionally, what's your immediate reaction?",
    36: "When someone chooses someone else over you, what does your inner dialogue sound like?",
    37: "When you're feeling hurt, how much do you trust your own emotional read of the situation?",
    38: "When someone's behavior toward you changes and they don't explain it, what do you do internally?",
    39: "When someone gets emotionally intense with you, what happens in your body?",
    40: "When you think about why you pursue connection, what's the most honest driver?",
    41: "What kind of person tends to pull your attention and fascination most strongly?",
    42: "How fully do you let people into the parts of you that feel the most vulnerable?",
    43: "What's your deepest fear when someone starts to truly know you?",
    44: "When you're struggling emotionally, what stops you from being fully honest about it?",
    45: "When you need to feel pulled back in and reassured, what does that look like from the other person?",
    46: "When you're emotionally overwhelmed, what do you need most?",
    47: "When someone does something genuinely kind for you with no strings attached, how does it land?",
    48: "When does closeness start to feel like too much?",
    49: "What part of a past relationship do you find yourself missing the most?",
    50: "What's your deepest fear when something good is finally happening in a relationship?",
    100: "When someone finds something out about you that you weren't ready to share, what's your first instinct?",
    101: "When you're caught off guard in an argument and feel cornered, what do you tend to do?",
    102: "When someone makes you feel guilty — even if you were partly wrong — how do you usually respond?",
    103: "When you feel ignored or deprioritized, what's your instinct to get their attention back?",
    104: "When someone tries to emotionally challenge you in a conversation, how do you respond?",
    105: "When you want someone to feel the impact of something they did, how do you communicate that?",
    106: "When a connection starts feeling distant and you want to re-engage it, what's your move?",
    107: "When you've hurt someone and you're apologizing, what does that usually look like?",
    108: "When you're genuinely angry at someone, how does that come out?",
    109: "When you want someone to choose you or commit more clearly, how do you tend to communicate that?",
}

# Dimension labels
DIMENSION_LABELS = {
    "CommunicationHealth": "Communication & Emotional Needs",
    "ConflictRepair": "Conflict & Repair",
    "EmotionalRegulation": "Emotional Regulation",
    "ValuesLifestyle": "Values & Lifestyle",
    "CommitmentPace": "Commitment & Pacing",
    "EmotionalNeeds": "Emotional Needs & Attachment",
    "ShadowPattern": "Shadow Patterns",
}

CATEGORIES = list(DIMENSION_LABELS.values())


@lru_cache(maxsize=1)
def load_questions() -> List[Dict[str, Any]]:
    """Load all 60 questions with real answer text from seed data."""
    questions_csv = list(csv.DictReader(
        (SEED_DIR / "questions.csv").open("r", encoding="utf-8", newline="")
    ))
    answer_bank = list(csv.DictReader(
        (SEED_DIR / "answer_bank.csv").open("r", encoding="utf-8", newline="")
    ))

    questions = []
    for q_row in questions_csv:
        q_num = int(q_row["question_number_int"])
        dim = q_row["dimension_primary"]

        # Get answer options for this question
        options = sorted(
            [row for row in answer_bank if int(row["question_number_int"]) == q_num],
            key=lambda r: r["answer_letter"],
        )

        # Map dimension to category index
        cat_index = list(DIMENSION_LABELS.keys()).index(dim) if dim in DIMENSION_LABELS else 0

        questions.append({
            "id": q_num,
            "question_id": q_row["question_id"],
            "category": cat_index,
            "dimension": dim,
            "phase": q_row["phase"],
            "weight": float(q_row["question_weight_v3"]),
            "text": QUESTION_TEXTS.get(q_num, f"Question {q_num}"),
            "options": [opt["answer_text"] for opt in options],
            "answer_letters": [opt["answer_letter"] for opt in options],
            "archetypes": [opt.get("archetype", "") for opt in options],
        })

    return sorted(questions, key=lambda x: (0 if x["id"] < 100 else 1, x["id"]))


# Legacy compat — QUESTIONS and CATEGORIES used by quiz router
QUESTIONS = []  # populated on first access


def _ensure_loaded():
    global QUESTIONS
    if not QUESTIONS:
        QUESTIONS.extend(load_questions())


def get_questions():
    _ensure_loaded()
    return QUESTIONS
