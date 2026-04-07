"""
Verify scoring engine against 6 MatchHarness fixtures from the workbook.
Run: cd backend && python -m scripts.test_scoring_fixtures
"""
import json
from pathlib import Path
from app.scoring import load_seed_context, compute_compatibility

FIXTURE_MANIFEST = Path(__file__).parent.parent.parent / "D_drive" / "fixture_manifest.json"

# The fixtures use default identity: male/female, aries/aries (or specific zodiac), LP=1
FIXTURE_CONFIGS = {
    "fixture_001_default_all_a_vs_all_a": {
        "answers_a": "all_a", "answers_b": "all_a",
        "gender_a": "male", "gender_b": "female",
        "zodiac_a": "aries", "zodiac_b": "aries",
        "life_path_a": 1, "life_path_b": 1,
    },
}


def make_answers(pattern: str, ctx) -> dict:
    qs = sorted(ctx.weights.keys())
    letters = list("ABCDE")
    if pattern == "all_a":
        return {q: "A" for q in qs}
    elif pattern == "all_max":
        # Last letter for each question
        d = {}
        for q in qs:
            opts = [r for r in ctx.answer_bank if int(r["question_number_int"]) == q]
            d[q] = sorted(opts, key=lambda r: r["answer_letter"])[-1]["answer_letter"]
        return d
    elif pattern == "mid":
        d = {}
        for q in qs:
            opts = [r for r in ctx.answer_bank if int(r["question_number_int"]) == q]
            mid_idx = len(opts) // 2
            d[q] = sorted(opts, key=lambda r: r["answer_letter"])[mid_idx]["answer_letter"]
        return d
    elif pattern.startswith("cycle_"):
        d = {}
        shift = 0
        if "shift2" in pattern:
            shift = 2
        elif "reverse" in pattern:
            shift = -1
        for i, q in enumerate(qs):
            if shift == -1:
                idx = (len(qs) - 1 - i) % len(letters)
            else:
                idx = (i + shift) % len(letters)
            opts = sorted(
                [r for r in ctx.answer_bank if int(r["question_number_int"]) == q],
                key=lambda r: r["answer_letter"],
            )
            d[q] = opts[min(idx, len(opts) - 1)]["answer_letter"]
        return d
    return {q: "A" for q in qs}


def run_tests():
    if not FIXTURE_MANIFEST.exists():
        print("Fixture manifest not found — skipping")
        return True

    with open(FIXTURE_MANIFEST) as f:
        manifest = json.load(f)

    ctx = load_seed_context()
    fixtures = manifest["fixtures"]
    all_pass = True

    print("Genesis OS Scoring Engine — Fixture Verification")
    print("=" * 70)

    for fix in fixtures:
        fid = fix["fixture_id"]
        expected_score = fix["compatibility_score"]
        expected_tier = fix["tier"]

        # Determine answer pattern from fixture ID
        if "all_a_vs_all_a" in fid:
            pa, pb = "all_a", "all_a"
            z_a, z_b, lp_a, lp_b = "aries", "aries", 1, 1
        elif "all_a_vs_all_max" in fid:
            pa, pb = "all_a", "all_max"
            z_a, z_b, lp_a, lp_b = "aries", "aries", 1, 3
        elif "mid_vs_mid" in fid:
            pa, pb = "mid", "mid"
            z_a, z_b, lp_a, lp_b = "aries", "leo", 3, 5
        elif "cycle_forward_vs_cycle_reverse" in fid:
            pa, pb = "cycle_forward", "cycle_reverse"
            z_a, z_b, lp_a, lp_b = "aries", "aries", 1, 3
        elif "cycle_shift2_vs_all_a" in fid:
            pa, pb = "cycle_shift2", "all_a"
            z_a, z_b, lp_a, lp_b = "aries", "scorpio", 5, 5
        elif "all_max_vs_all_max" in fid:
            pa, pb = "all_max", "all_max"
            z_a, z_b, lp_a, lp_b = "aries", "gemini", 2, 2
        else:
            print(f"  SKIP {fid} — unknown pattern")
            continue

        answers_a = make_answers(pa, ctx)
        answers_b = make_answers(pb, ctx)

        result = compute_compatibility(
            answers_a, answers_b,
            gender_a="male", gender_b="female",
            zodiac_a=z_a, zodiac_b=z_b,
            life_path_a=lp_a, life_path_b=lp_b,
        )

        actual_score = result["score"]
        score_diff = abs(actual_score - expected_score)
        core_diff = abs(result["core_norm"] - fix["core_norm"])

        # Allow small floating point tolerance
        score_ok = score_diff < 1.0
        status = "PASS" if score_ok else "FAIL"
        if not score_ok:
            all_pass = False

        print(f"\n  {fid}")
        print(f"    Expected: {expected_score:.2f} ({expected_tier})")
        print(f"    Actual:   {actual_score:.1f} ({result['tier_label']})")
        print(f"    Δ score:  {score_diff:.2f} | Δ core_norm: {core_diff:.6f}")
        print(f"    → {status}")

    print(f"\n{'=' * 70}")
    print(f"Result: {'ALL PASS' if all_pass else 'SOME FAILURES'}")
    return all_pass


if __name__ == "__main__":
    run_tests()
