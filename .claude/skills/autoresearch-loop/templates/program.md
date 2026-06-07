# program.md — Autoresearch objective / Зорилго

> This is the lightweight "skill" the human edits to steer the agent.
> The agent READS this before every experiment but never edits it.
> МN: Хүн засдаг хөнгөн "skill". Агент туршилт бүрийн өмнө УНШина, ЗАСАХГҮЙ.

## Objective / Зорилго
<!-- One sentence: what are we trying to improve, and on what system? -->
<!-- Жишээ: nanochat single-GPU дээр val_bpb-г бууруулах. -->

## Metric / Метрик  (THE invariant — do not change mid-run)
- Name: <e.g. val_bpb>
- Direction: <lower-is-better | higher-is-better>
- How it's measured: <which command/script prints it, how to parse the number>

## Evaluation (read-only) / Үнэлгээ (зөвхөн унших)
- Command: <e.g. `python prepare.py && python eval.py`>
- Fixed data / seed / fixtures: <what stays constant every run>

## Per-experiment budget / Туршилт бүрийн төсөв
- <e.g. 5 minutes wall-clock> or <e.g. 2000 steps>

## Run budget & stop / Нийт төсөв ба зогсох
- Max experiments: <N> or deadline: <when>
- Stop early if: <plateau after K, constraint hit, etc.>

## Hard constraints / Хатуу хязгаарлалт
<!-- Things the agent must NOT do. -->
- Do not edit the eval/prepare step.
- <e.g. keep param count under X, keep API cost under Y, don't add new deps>

## Ideas backlog / Туршиж үзэх санаанууд
<!-- Seed it; the agent may add more as it learns. One idea per line. -->
- [ ] <idea 1>
- [ ] <idea 2>
- [ ] <idea 3>
