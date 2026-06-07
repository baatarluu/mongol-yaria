# Autoresearch LOG — token estimator (REAL run)

Metric: MAE (lower-is-better) — measured by `node eval.js`.
Baseline score: 7.9333
Final best:     0.8667  (−89%, from Exp 004)

All numbers below were produced by actually running `node eval.js`.

---

## Exp 000 — Baseline `chars/4`  [BASELINE 📌]
- Change: `Math.round(text.length / 4)`
- Score: MAE=7.9333
- Notes: one global ratio; ignores word boundaries, punctuation, script.

## Exp 001 — Per-word `ceil(len/4)`  [KEPT ✅]
- Hypothesis: tokenizing per word is closer than one global division.
- Change: split on whitespace, sum `ceil(word.length/4)`.
- Score: MAE=6.8667  (best: 6.8667, baseline: 7.9333)
- Notes: helped; punctuation still folded into word length.

## Exp 002 — Punctuation as own tokens  [KEPT ✅]
- Hypothesis: reference counts each punctuation mark separately.
- Change: strip PUNCT, add punct count, `ceil(core/4)`.
- Score: MAE=4.4667  (best: 4.4667)
- Notes: large gain — punctuation was a big error source.

## Exp 003 — Script-aware ratio  [KEPT ✅]
- Hypothesis: Cyrillic packs fewer chars/token than Latin.
- Change: `ceil(cyrillic/3) + ceil(other/4)`.
- Score: MAE=2.3333  (best: 2.3333)
- Notes: Mongolian text was being under-counted; this fixed it.

## Exp 004 — Average jitter correction  [KEPT ✅]
- Hypothesis: ~1/3 of words get an irregular +1 (unpredictable per word, but
  predictable on average), so add `round(words/3)`.
- Change: `t += Math.round(words.length / 3)`.
- Score: MAE=0.8667  (best: 0.8667)
- Notes: best result. Remaining error is the irreducible per-word noise floor.

## Exp 005 — `round()` instead of `ceil()`  [DISCARDED ❌]
- Hypothesis: round() might track the average better than ceil().
- Change: `round(cyr/3) + round(other/4)`.
- Score: MAE=2.0667  (best stays 0.8667)
- Notes: regression — reverted estimator.js to the Exp 004 best.

---

## Summary @ Exp 005
- Working: per-word split, separate punctuation, script-aware ratio, average
  jitter correction. Baseline 7.9333 → best 0.8667 (**−89%**).
- Dead ends: round() in place of ceil() (Exp 005).
- Plateau: remaining MAE is the reference's deliberate per-word irregularity —
  a real noise floor a cheap estimator cannot remove. Loop stopped.
- Top 3 changes that mattered: punctuation (Exp 002), script-awareness
  (Exp 003), jitter correction (Exp 004).
