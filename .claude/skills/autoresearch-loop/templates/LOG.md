# Autoresearch LOG / Туршилтын бүртгэл

Append-only. One entry per experiment, including failures.
МN: Зөвхөн нэмж бичнэ. Туршилт бүр (бүтэлгүйтэл ч) нэг бичлэгтэй.

Metric: <name> (<direction>)
Baseline score: <filled at bootstrap>
Current best: <updated as we go>

---

## Exp 000 — Baseline  [BASELINE 📌]
- Change: none (unmodified system)
- Score: <baseline_score>
- Notes: <eval command, environment, seed>

## Exp 001 — <short title>  [KEPT ✅ / DISCARDED ❌ / FAILED 💥]
- Hypothesis: <changing X to Y should improve metric because Z>
- Change: <diff or summary>
- Score: <value>  (best: <best_score>, baseline: <baseline_score>)
- Notes: <observations, next ideas>

<!-- ... continue appending ... -->

---

## Summary @ Exp NNN
- Working: <what helped>
- Dead ends: <what didn't>
- Running best: <score> from Exp <id>
