# Example: token-estimator autoresearch run

A small, fully self-contained demonstration of the **autoresearch-loop** skill.
МN: `autoresearch-loop` skill-ийн жижиг, бие даасан ажиллагч жишээ.

## What it shows
The agent autonomously improved a cheap token-count estimator from
**MAE 7.93 → 0.87 (−89%)** over 5 experiments, keeping wins, discarding a
regression, and stopping at the noise floor — all scores measured by `eval.js`.

## Files
| File | Role |
|------|------|
| `prepare.js` | FIXED data + opaque reference tokenizer (read-only) |
| `eval.js`    | FIXED scorer — prints `MAE=<value>` (read-only) |
| `estimator.js` | system under test — the agent edits ONLY this (currently the best variant) |
| `program.md` | objective, metric, constraints, ideas backlog |
| `LOG.md`     | append-only journal of the real run |

## Reproduce
```bash
cd .claude/skills/autoresearch-loop/examples/token-estimator
node eval.js        # -> MAE=0.8667  (current best estimator)
```
To watch the loop from scratch, revert `estimator.js` to `Math.round(text.length/4)`
and re-run the steps in `LOG.md`.
