# program.md — Token-estimator autoresearch (example)

> Жишээ: "хямдхан токен тоолуур"-ыг autoresearch давталтаар сайжруулна.

## Objective / Зорилго
Make a CHEAP token estimator (`estimator.js`) approximate the EXPENSIVE
reference tokenizer (hidden inside `prepare.js`) as closely as possible, for
the mixed Mongolian/English text this app handles.

## Metric / Метрик
- Name: MAE (mean absolute error vs reference token count)
- Direction: lower-is-better
- Measured by: `node eval.js` → prints `MAE=<value>`

## Evaluation (read-only) / Үнэлгээ
- Command: `node eval.js`
- Fixed data: 15 fixed sample texts in `prepare.js` (`DATA`). Reference
  tokenizer is irregular on purpose → a perfect 0 is NOT reachable.

## Per-experiment budget / Туршилт бүрийн төсөв
- One `node eval.js` run (sub-second). One variable changed per experiment.

## Run budget & stop / Нийт төсөв ба зогсох
- Stop on plateau (no improvement that beats the noise floor) or ~10 experiments.

## Hard constraints / Хатуу хязгаарлалт
- Edit ONLY `estimator.js`. Never touch `prepare.js` or `eval.js`.
- The estimator must stay cheap (no calling a real tokenizer / network).

## Ideas backlog / Санаанууд
- [x] per-word ceil(len/4) instead of global chars/4   (Exp 001)
- [x] count punctuation as its own tokens               (Exp 002)
- [x] script-aware ratio (Cyrillic /3, Latin /4)        (Exp 003)
- [x] average correction for irregular per-word merges  (Exp 004)
- [x] round() vs ceil() for core split                  (Exp 005 — discarded)
- [ ] per-script jitter correction
- [ ] special-case pure-digit tokens
