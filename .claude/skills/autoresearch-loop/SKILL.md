---
name: autoresearch-loop
description: Use this skill when the user wants to run a self-improving experiment loop — autonomously propose a change, run a short experiment, score it against one metric, keep or discard it, log the result, and repeat (often overnight). Based on Andrej Karpathy's "autoresearch" pattern. Works for any tunable system with a measurable objective (ML training, prompt/skill tuning, hyperparameters, algorithm variants, performance optimization).
---

# Autoresearch Loop / Өөрийгөө сайжруулдаг туршилтын давталт

This skill turns you (the agent) into an autonomous researcher. You repeatedly
**propose → run → score → keep-or-discard → log**, so the human can leave it
running and wake up to a log of experiments and a better-performing system.

> **MN:** Энэ skill таныг (агентыг) бие даасан судлаач болгоно. Та **санал
> дэвшүүлэх → ажиллуулах → оноо өгөх → хадгалах/устгах → бүртгэх** давталтыг
> дахин дахин гүйцэтгэнэ. Хүн шөнөжингөө орхиод өглөө нь туршилтуудын лог,
> илүү сайжирсан системтэй сэрнэ.

Pattern source / Эх загвар: Andrej Karpathy — `karpathy/autoresearch`
(`prepare` = fixed data, `train` = agent-edited code, `program.md` = the
lightweight "skill"/objective). This skill generalizes that pattern.

---

## Core invariants — НЭГ удаа тогтоо, дараа нь БҮҮ ӨӨРЧИЛ

These three things MUST be fixed before the loop starts. Changing them mid-run
invalidates all comparisons.

1. **One scalar metric** with a clear direction (lower-is-better OR
   higher-is-better). Example: `val_bpb` (lower better), accuracy (higher
   better), latency ms (lower better). If you have several signals, combine
   them into ONE score (e.g. a weighted sum) before the loop begins.
2. **A fixed evaluation** — same data/seed/budget every run, so two experiments
   are comparable. The "prepare" step (data, fixtures, eval harness) is
   READ-ONLY during the loop.
3. **A fixed per-experiment budget** — wall-clock time (e.g. 5 minutes) or a
   step count. Every experiment gets the SAME budget. This is what makes the
   loop fair and lets you estimate experiments/hour.

> **MN:** Эдгээр 3 зүйлийг давталт эхлэхээс ӨМНӨ тогтоож, дунд нь өөрчилбөл
> бүх харьцуулалт хүчингүй болно: (1) нэг скаляр метрик + чиглэл, (2) тогтмол
> үнэлгээ (адил дата/seed/budget), (3) туршилт тутамд адил хугацаа/алхам.

---

## Required files / Шаардлагатах файлууд

Set these up in a working directory (default `./autoresearch/`):

| File | Role | Edited by |
|------|------|-----------|
| `program.md` | Objective, constraints, ideas backlog, ground rules | **Human** (you read it) |
| the system under test | The code/config you mutate (e.g. `train.py`, prompt, params) | **Agent** |
| the prepare/eval step | Data prep + scoring harness that prints the metric | **Nobody** (read-only) |
| `LOG.md` | Append-only running journal of every experiment | **Agent** (append only) |
| `best/` | Snapshot of the best-scoring variant so far | **Agent** |

Templates are provided in `templates/` — copy and adapt them. If the user
already has a project, map these roles onto their existing files instead of
creating new ones.

> **MN:** `templates/` дотор загвар файлууд бий. Хэрэглэгчид төсөл аль хэдийн
> байгаа бол шинээр үүсгэхгүй, эдгээр үүргийг одоо байгаа файлууд дээр буулга.

---

## The loop / Давталт

Run this cycle until the stop condition (see below). One pass = one experiment.

### 0. Bootstrap (once)
- Read `program.md` in full: objective, the metric + direction, the budget,
  hard constraints, and the ideas backlog.
- Establish the **baseline**: run the eval ONCE on the unmodified system,
  record its score as `best_score`, snapshot it into `best/`, and write the
  first `LOG.md` entry. Никогда compare against a number you didn't measure.

### 1. Propose
- Pick ONE idea — from the backlog in `program.md`, or generate one informed by
  previous LOG entries (do not repeat a change already tried unless you have a
  new reason). Prefer **small, isolated, reversible** changes — one variable at
  a time so you can attribute the result.
- Write a one-line hypothesis: *"Changing X to Y should improve `metric`
  because Z."*

### 2. Run
- Apply the change to the system-under-test ONLY (never touch prepare/eval).
- Run the fixed eval within the fixed budget. Capture stdout/logs.
- If it crashes or doesn't finish in budget → that's a **failed** experiment.
  Discard the change, log it (failures are data), continue.

### 3. Score
- Parse the single scalar metric from the run output. If you can't parse a
  clean number, treat the run as failed — do not guess a score.
- Compare to `best_score` using the declared direction.

### 4. Keep or discard
- **Improved** → it's the new best: update `best_score`, refresh the `best/`
  snapshot, keep the change in the working copy.
- **Not improved / failed** → **revert** the working copy to `best/` so the
  next experiment builds on the current best, not on a dead end.
- (Variance note: if runs are noisy, confirm a "win" with a second eval, or
  require the improvement to exceed the noise floor, before promoting it.)

### 5. Log (ALWAYS, even on failure)
Append one entry to `LOG.md`:
```
## Exp NNN — <short title>  [KEPT ✅ / DISCARDED ❌ / FAILED 💥]
- Hypothesis: ...
- Change: <what you edited; diff or summary>
- Score: <value> (best: <best_score>, baseline: <baseline_score>)
- Notes: <observations, next ideas>
```

### 6. Repeat
Go to step 1. Periodically (every ~10 experiments) write a short summary block
to `LOG.md`: what's working, what's a dead end, and the running best.

> **MN — давталтын мөн чанар:** baseline-аа эхлээд хэмж → нэг таамаг дэвшүүл →
> өөрчлөлт оруул → fixed үнэлгээ ажиллуул → оноог best-тэй харьцуул → дээрдвэл
> best болгож хадга, эс бөгөөс best рүүгээ буцаа → ҮРГЭЛЖ бүртгэ (бүтэлгүйтэл ч
> бас мэдээлэл) → дахин эхэл.

---

## Ground rules / Дүрэм

- **One variable per experiment.** Bundling changes makes results
  un-attributable. (Хэд хэдэн зүйл нэг дор бүү өөрчил.)
- **Never edit the eval to make a number go up.** That's cheating the metric,
  not improving the system. If the metric is wrong, STOP and ask the human.
- **Append, never rewrite `LOG.md`.** The history is the deliverable.
- **Always leave the repo working.** After each experiment the working copy
  equals either a new best or the previous best — never a broken half-state.
- **Use version control** if available: commit each kept experiment so progress
  is recoverable. (Хадгалсан туршилт бүрийг commit хий.)
- **Be honest in the log.** Report the real score, including regressions and
  crashes. A loop that lies to itself optimizes nothing.

---

## Stop conditions / Зогсох нөхцөл

Stop and report to the human when ANY of these hold:
- The human-set budget is exhausted (N experiments, or a wall-clock deadline).
- No improvement for K consecutive experiments (plateau) — report the plateau.
- A constraint in `program.md` would have to be violated to continue.
- The metric or eval looks broken/suspicious — STOP, don't push through it.

On stop, write a final `LOG.md` summary: baseline → best, total experiments,
kept vs discarded count, and the top 3 changes that mattered.

> **MN:** Дээрх нөхцлийн аль нэг биелбэл зогсож, хүнд тайлагна: baseline → best,
> нийт туршилт, хадгалсан/устгасан тоо, хамгийн нөлөөтэй 3 өөрчлөлт.

---

## Quick start for a new project / Шинэ төсөлд хэрхэн эхлэх

1. Ask the human (or read from their request): **what's the metric, what's the
   eval, what's the per-experiment budget, how many experiments / how long?**
2. Copy `templates/program.md` → fill in objective, metric+direction, budget,
   constraints, and seed the ideas backlog.
3. Identify the system-under-test and the read-only prepare/eval step.
4. Run the **baseline**, then start the loop.

If any of metric / eval / budget is missing, ASK before starting — these are
the core invariants and guessing them wastes the whole run.
