#!/usr/bin/env python3
"""
verify_answers.py — independent answer-key verifier for Gen2 quiz banks.

WHY THIS EXISTS
    A self-marking quiz with a wrong answer key is worse than no self-marking,
    because it actively teaches the wrong answer. So for every question whose
    correct answer is *computed* (interest, trig, mensuration, matrix arithmetic,
    statistics), we do NOT trust the answer key that was written alongside the
    question text. Instead this script recomputes the answer FROM THE QUESTION'S
    STORED PARAMETERS, using formulas that live HERE (not in the bank), and
    asserts the stored key matches. The recompute path is independent of whatever
    generated the key — that independence is the whole point.

BANK FORMAT (JSON, the single source of truth the site also loads)
    A bank file is any JSON containing quiz questions. The verifier walks the
    JSON recursively and inspects every object that has both "qtype" and "answer".
    A question becomes *checkable* by adding two fields:

        "check":  "<recipe name>"     e.g. "compound_interest", "matrix_mult"
        "params": { ... }             inputs the recipe recomputes from

    Optional:
        "expect":     "<output name>" when a recipe returns several outputs
        "verify_tol": <number>        max |computed - stored| for the KEY to pass.
                                      Defaults to 1e-6 (near-exact). If the key is
                                      stored rounded, set this to half a unit in
                                      the last place (0.005 for 2 dp, 0.5 for 0 dp).
                                      NOTE: this is the KEY-integrity tolerance and
                                      is deliberately SEPARATE from answer.tolerance,
                                      which is the (often generous) student-input
                                      tolerance. A generous student tolerance must
                                      never be allowed to hide a wrong key.

    numeric answers compare against answer["value"]; matrix answers against
    answer["cells"] (a list of rows). Questions with no "check" are reported as
    MANUAL (conceptual MC, definitions, teacher-judged) and never block.

USAGE
    python tools/verify_answers.py                 # verify js/data/gen2/**/*.json
    python tools/verify_answers.py path/to/bank.json ...
    python tools/verify_answers.py --selftest      # prove the verifier catches errors

Exit code is non-zero if any checkable question fails or errors.
"""

import argparse
import glob
import json
import math
import os
import sys

# ============================================================
# RECIPES — recompute the correct answer from params.
# Each returns a number, a dict of named numbers, or a matrix
# (list of rows). Keep these formulas authoritative and simple.
# ============================================================

def _n(p, *keys):
    return [float(p[k]) for k in keys]


# ---- Consumer arithmetic ----
def simple_interest(p):
    P, r, t = _n(p, "P", "r", "t")            # r as a decimal per period, t periods
    I = P * r * t
    return {"interest": I, "amount": P + I}


def compound_interest(p):
    # TASC form: A = P(1 + i)^n, i = rate PER PERIOD, n = number of periods.
    # Accept either the periodic form {P, r, n} or the annual form
    # {P, annual_rate, years, compounds_per_year} — the recipe does the
    # per-period conversion itself so verification stays independent.
    P = float(p["P"])
    if "r" in p and "n" in p:
        r, n = float(p["r"]), float(p["n"])
    else:
        annual = float(p["annual_rate"])
        years = float(p["years"])
        m = float(p.get("compounds_per_year", 1))
        r, n = annual / m, years * m
    A = P * (1 + r) ** n
    return {"amount": A, "interest": A - P}


def percent_change(p):
    a, b = _n(p, "start", "end")
    return {"change": b - a, "percent": (b - a) / a * 100.0}


def percent_of(p):
    x, pct = _n(p, "amount", "percent")
    return {"value": x * pct / 100.0}


def apply_percent(p):
    # markup (+) or discount (-): sign carried by "percent"
    base, pct = _n(p, "base", "percent")
    return {"value": base * (1 + pct / 100.0)}


def unit_cost(p):
    price, qty = _n(p, "price", "qty")
    return {"unit": price / qty}


def gst_add(p):
    amount, = _n(p, "amount")
    rate = float(p.get("rate", 10))
    gst = amount * rate / 100.0
    return {"gst": gst, "incl": amount + gst}


def gst_extract(p):
    # GST contained in a GST-inclusive price
    incl, = _n(p, "incl")
    rate = float(p.get("rate", 10))
    gst = incl * rate / (100.0 + rate)
    return {"gst": gst, "excl": incl - gst}


def currency_convert(p):
    amount, rate = _n(p, "amount", "rate")     # 1 unit source = rate units target
    return {"value": amount * rate}


# ---- Linear ----
def gradient(p):
    x1, y1, x2, y2 = _n(p, "x1", "y1", "x2", "y2")
    return {"gradient": (y2 - y1) / (x2 - x1)}


def line_eval(p):
    m, c, x = _n(p, "m", "c", "x")
    return {"y": m * x + c}


def intersection(p):
    # y = m1 x + c1 and y = m2 x + c2
    m1, c1, m2, c2 = _n(p, "m1", "c1", "m2", "c2")
    x = (c2 - c1) / (m1 - m2)
    return {"x": x, "y": m1 * x + c1}


# ---- Univariate data ----
def _data(p):
    return [float(v) for v in p["data"]]


def mean(p):
    d = _data(p)
    return {"mean": sum(d) / len(d)}


def median(p):
    d = sorted(_data(p))
    n = len(d)
    m = (d[n // 2] if n % 2 else (d[n // 2 - 1] + d[n // 2]) / 2)
    return {"median": m}


def stdev(p):
    d = _data(p)
    n = len(d)
    mu = sum(d) / n
    var_pop = sum((x - mu) ** 2 for x in d) / n
    var_smp = sum((x - mu) ** 2 for x in d) / (n - 1) if n > 1 else 0.0
    return {"population": math.sqrt(var_pop), "sample": math.sqrt(var_smp), "mean": mu}


def _median_of(d):
    n = len(d)
    return d[n // 2] if n % 2 else (d[n // 2 - 1] + d[n // 2]) / 2


def quartiles(p):
    # Method: median splits data; lower/upper halves exclude the median for odd n.
    d = sorted(_data(p))
    n = len(d)
    half = n // 2
    lower = d[:half]
    upper = d[half + 1:] if n % 2 else d[half:]
    q1, q3 = _median_of(lower), _median_of(upper)
    return {"q1": q1, "q3": q3, "iqr": q3 - q1, "median": _median_of(d),
            "min": d[0], "max": d[-1], "range": d[-1] - d[0]}


# ---- Measurement (mensuration) ----
def circle(p):
    r, = _n(p, "r")
    return {"area": math.pi * r * r, "circumference": 2 * math.pi * r}


def rectangle(p):
    l, w = _n(p, "l", "w")
    return {"area": l * w, "perimeter": 2 * (l + w)}


def triangle_area(p):
    b, h = _n(p, "b", "h")
    return {"area": 0.5 * b * h}


def cylinder(p):
    r, h = _n(p, "r", "h")
    return {"volume": math.pi * r * r * h,
            "surface": 2 * math.pi * r * (r + h)}


def cone(p):
    r, h = _n(p, "r", "h")
    slant = math.sqrt(r * r + h * h)
    return {"volume": math.pi * r * r * h / 3.0,
            "surface": math.pi * r * (r + slant)}


def sphere(p):
    r, = _n(p, "r")
    return {"volume": 4.0 / 3.0 * math.pi * r ** 3, "surface": 4 * math.pi * r * r}


def rect_prism(p):
    l, w, h = _n(p, "l", "w", "h")
    return {"volume": l * w * h, "surface": 2 * (l * w + l * h + w * h)}


def scale(p):
    # measured length * scale factor (e.g. map 1:sf)
    measured, sf = _n(p, "measured", "sf")
    return {"actual": measured * sf}


# ---- Trigonometry (angles in DEGREES) ----
def pythagoras(p):
    # find the hypotenuse from two legs
    a, b = _n(p, "a", "b")
    return {"hyp": math.hypot(a, b)}


def pythagoras_leg(p):
    hyp, leg = _n(p, "hyp", "leg")
    return {"leg": math.sqrt(hyp * hyp - leg * leg)}


def trig_side(p):
    # solve for an unknown side given an angle (deg) and one known side.
    ang = math.radians(float(p["angle"]))
    ratio = p["ratio"]         # 'sin' | 'cos' | 'tan'
    known = float(p["known"])
    find = p["find"]           # 'opp' | 'adj' | 'hyp'
    if ratio == "sin":         # sin = opp/hyp
        val = {"opp": known * math.sin(ang) if p["known_side"] == "hyp" else known / math.sin(ang),
               "hyp": known / math.sin(ang) if p["known_side"] == "opp" else None}
        return {"value": val[find]}
    if ratio == "cos":         # cos = adj/hyp
        if p["known_side"] == "hyp":
            return {"value": known * math.cos(ang)}
        return {"value": known / math.cos(ang)}
    if ratio == "tan":         # tan = opp/adj
        if p["known_side"] == "adj":
            return {"value": known * math.tan(ang)}
        return {"value": known / math.tan(ang)}
    raise ValueError("bad ratio")


def trig_angle(p):
    # angle (deg) from two sides via inverse ratio
    ratio = p["ratio"]
    a, b = _n(p, "num", "den")   # e.g. opp, hyp for asin
    fn = {"sin": math.asin, "cos": math.acos, "tan": math.atan}[ratio]
    return {"angle": math.degrees(fn(a / b))}


def triangle_area_sas(p):
    # Area = 1/2 * a * b * sin(C), C in degrees
    a, b = _n(p, "a", "b")
    C = math.radians(float(p["C"]))
    return {"area": 0.5 * a * b * math.sin(C)}


# ---- Algebra & matrices ----
def evaluate(p):
    # substitute values into a closed formula. The formula lives in the recipe
    # call as p["expr"] over the other params — used only for straightforward
    # substitution questions. Restricted to math builtins; no names leak in.
    expr = p["expr"]
    env = {k: float(v) for k, v in p.items() if k != "expr"}
    allowed = {"sqrt": math.sqrt, "pi": math.pi, "abs": abs,
               "sin": math.sin, "cos": math.cos, "tan": math.tan}
    return float(eval(expr, {"__builtins__": {}}, {**env, **allowed}))


def _mat(p, key):
    return [[float(x) for x in row] for row in p[key]]


def matrix_add(p):
    A, B = _mat(p, "A"), _mat(p, "B")
    return [[A[i][j] + B[i][j] for j in range(len(A[0]))] for i in range(len(A))]


def matrix_sub(p):
    A, B = _mat(p, "A"), _mat(p, "B")
    return [[A[i][j] - B[i][j] for j in range(len(A[0]))] for i in range(len(A))]


def matrix_scalar(p):
    A = _mat(p, "A")
    k = float(p["k"])
    return [[k * x for x in row] for row in A]


def matrix_mult(p):
    A, B = _mat(p, "A"), _mat(p, "B")
    n, m, q = len(A), len(B), len(B[0])
    if len(A[0]) != m:
        raise ValueError("matrix_mult: incompatible dimensions")
    return [[sum(A[i][k] * B[k][j] for k in range(m)) for j in range(q)] for i in range(n)]


def matrix_power(p):
    A = _mat(p, "A")
    e = int(p["power"])
    n = len(A)
    R = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]  # identity
    base = A
    for _ in range(e):
        R = [[sum(R[i][k] * base[k][j] for k in range(n)) for j in range(n)] for i in range(n)]
    return R


RECIPES = {
    "simple_interest": simple_interest, "compound_interest": compound_interest,
    "percent_change": percent_change, "percent_of": percent_of,
    "apply_percent": apply_percent, "unit_cost": unit_cost,
    "gst_add": gst_add, "gst_extract": gst_extract, "currency_convert": currency_convert,
    "gradient": gradient, "line_eval": line_eval, "intersection": intersection,
    "mean": mean, "median": median, "stdev": stdev, "quartiles": quartiles,
    "circle": circle, "rectangle": rectangle, "triangle_area": triangle_area,
    "cylinder": cylinder, "cone": cone, "sphere": sphere, "rect_prism": rect_prism,
    "scale": scale,
    "pythagoras": pythagoras, "pythagoras_leg": pythagoras_leg,
    "trig_side": trig_side, "trig_angle": trig_angle, "triangle_area_sas": triangle_area_sas,
    "evaluate": evaluate,
    "matrix_add": matrix_add, "matrix_sub": matrix_sub, "matrix_scalar": matrix_scalar,
    "matrix_mult": matrix_mult, "matrix_power": matrix_power,
}

DEFAULT_KEY_TOL = 1e-6


# ============================================================
# WALK + CHECK
# ============================================================

def find_questions(node, out):
    if isinstance(node, dict):
        if "qtype" in node and "answer" in node:
            out.append(node)
        for v in node.values():
            find_questions(v, out)
    elif isinstance(node, list):
        for v in node:
            find_questions(v, out)


def check_question(q):
    """Return (status, detail). status in {'pass','fail','error','manual'}."""
    check = q.get("check")
    if not check:
        return ("manual", "no check recipe (conceptual / teacher-judged)")
    if check not in RECIPES:
        return ("error", f"unknown recipe '{check}'")
    try:
        res = RECIPES[check](q["params"])
    except Exception as e:  # noqa: BLE001 — surface any recompute failure
        return ("error", f"recompute failed: {e}")

    if q.get("expect") is not None and isinstance(res, dict):
        if q["expect"] not in res:
            return ("error", f"recipe '{check}' has no output '{q['expect']}'")
        res = res[q["expect"]]

    tol = float(q.get("verify_tol", DEFAULT_KEY_TOL))
    ans = q["answer"]

    # Matrix result vs answer.cells
    if isinstance(res, list):
        cells = ans.get("cells")
        if cells is None:
            return ("error", "matrix recipe but answer has no 'cells'")
        if len(cells) != len(res) or any(len(cells[i]) != len(res[i]) for i in range(len(res))):
            return ("fail", "matrix shape mismatch between key and recompute")
        for i in range(len(res)):
            for j in range(len(res[i])):
                if abs(float(cells[i][j]) - res[i][j]) > tol:
                    return ("fail", f"cell [{i}][{j}] key={cells[i][j]} computed={res[i][j]:.6g}")
        return ("pass", "matrix ok")

    # Scalar result vs answer.value
    if isinstance(res, dict):
        return ("error", f"recipe '{check}' returned multiple outputs; add \"expect\"")
    val = ans.get("value")
    if val is None:
        return ("error", "numeric recipe but answer has no 'value'")
    if abs(float(val) - float(res)) > tol:
        return ("fail", f"key={val} computed={float(res):.10g} (abs diff > {tol:g})")
    return ("pass", f"ok ({float(res):.10g})")


def verify_files(paths):
    counts = {"pass": 0, "fail": 0, "error": 0, "manual": 0}
    problems = []
    total_q = 0
    for path in paths:
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:  # noqa: BLE001
            problems.append((path, "?", "error", f"could not read/parse: {e}"))
            counts["error"] += 1
            continue
        qs = []
        find_questions(data, qs)
        total_q += len(qs)
        for q in qs:
            status, detail = check_question(q)
            counts[status] += 1
            if status in ("fail", "error"):
                problems.append((path, q.get("id", "?"), status, detail))
    return counts, problems, total_q


def print_report(counts, problems, total_q):
    print(f"\nScanned {total_q} question(s): "
          f"{counts['pass']} verified, {counts['manual']} manual, "
          f"{counts['fail']} FAILED, {counts['error']} ERROR")
    for path, qid, status, detail in problems:
        tag = "FAIL" if status == "fail" else "ERR "
        print(f"  [{tag}] {os.path.relpath(path)}  {qid}: {detail}")


def selftest():
    here = os.path.dirname(os.path.abspath(__file__))
    fixture = os.path.join(here, "fixtures", "verify-selftest.json")
    counts, problems, total_q = verify_files([fixture])
    print_report(counts, problems, total_q)
    # The fixture contains exactly ONE deliberately-wrong key (id ending -BAD).
    bad = [p for p in problems if p[1].endswith("-BAD")]
    other = [p for p in problems if not p[1].endswith("-BAD")]
    ok = (len(bad) == 1 and len(other) == 0 and counts["pass"] >= 3)
    print("\nSelf-test:", "PASS - verifier correctly flagged the planted error"
          if ok else "FAIL - verifier did not behave as expected")
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description="Independent answer-key verifier for Gen2 quiz banks.")
    ap.add_argument("paths", nargs="*", help="Bank JSON files (default: js/data/gen2/**/*.json)")
    ap.add_argument("--selftest", action="store_true", help="Run the verifier's own fixture test.")
    args = ap.parse_args()

    if args.selftest:
        sys.exit(selftest())

    paths = args.paths
    if not paths:
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        paths = glob.glob(os.path.join(root, "js", "data", "gen2", "**", "*.json"), recursive=True)
    if not paths:
        print("No bank files found. (Nothing to verify yet — Phase 3 writes them.)")
        sys.exit(0)

    counts, problems, total_q = verify_files(paths)
    print_report(counts, problems, total_q)
    sys.exit(1 if (counts["fail"] or counts["error"]) else 0)


if __name__ == "__main__":
    main()
