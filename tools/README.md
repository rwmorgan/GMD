# tools/

## `verify_answers.py` — independent answer-key verifier

Recomputes the correct answer for every *computed* quiz question from its stored
parameters, using formulas that live in the verifier itself (not in the question
bank), and asserts the stored answer key matches. A self-marking quiz with a wrong
key actively teaches the wrong answer, so no computed key ships unverified.

```bash
python tools/verify_answers.py            # verify js/data/gen2/**/*.json
python tools/verify_answers.py FILE ...   # verify specific bank files
python tools/verify_answers.py --selftest # prove the verifier catches errors
```

Exit code is non-zero if any checkable question fails or errors — wire it into the
per-topic checkpoint before committing a bank.

### Making a question checkable

Add `check` (a recipe name) and `params` (its inputs) to the question:

```json
{
  "id": "GMQ-CA-3", "qtype": "numeric", "points": 1,
  "prompt": "$1000 at 5% p.a. compounded annually for 5 years — final amount?",
  "options": { "unit": "$" },
  "answer": { "value": 1276.28, "tolerance": 5 },
  "check": "compound_interest", "expect": "amount",
  "params": { "P": 1000, "r": 0.05, "n": 5 },
  "verify_tol": 0.005
}
```

- `expect` picks one output when a recipe returns several (e.g. `amount` vs `interest`).
- `verify_tol` is the **key-integrity** tolerance (default `1e-6`). Set it to half a
  unit in the last place when the key is stored rounded (`0.005` for 2 dp). It is
  deliberately separate from `answer.tolerance` (the generous student-input tolerance)
  so a loose student tolerance can never hide a wrong key.
- `matrix` questions compare the recompute against `answer.cells`; `numeric` against
  `answer.value`. Questions with no `check` are reported MANUAL and never block
  (conceptual MC, definitions, teacher-judged items).

Recipes currently implemented: consumer arithmetic (`simple_interest`,
`compound_interest`, `percent_change`, `percent_of`, `apply_percent`, `unit_cost`,
`gst_add`, `gst_extract`, `currency_convert`), linear (`gradient`, `line_eval`,
`intersection`), data (`mean`, `median`, `stdev`, `quartiles`), measurement
(`circle`, `rectangle`, `triangle_area`, `cylinder`, `cone`, `sphere`, `rect_prism`,
`scale`), trigonometry (`pythagoras`, `pythagoras_leg`, `trig_side`, `trig_angle`,
`triangle_area_sas`), algebra/matrices (`evaluate`, `matrix_add`, `matrix_sub`,
`matrix_scalar`, `matrix_mult`, `matrix_power`). Add topic-specific recipes to
`RECIPES` as Phase 3 needs them.
