// estimator.js — SYSTEM UNDER TEST (the agent edits ONLY this file)
// МN: Туршигдах систем. Агент ЗӨВХӨН энэ файлыг өөрчилнө.
//
// Baseline: the classic "~4 characters per token" rule of thumb.

function estimate(text) {
  // Exp 002: count punctuation as its own tokens; ceil(core/4) per word.
  const words = text.trim().split(/\s+/).filter(Boolean);
  const PUNCT = /[.,!?;:()«»""''\-—/]/g;
  let t = 0;
  for (const w of words) {
    const puncts = (w.match(PUNCT) || []).length;
    const core = w.replace(PUNCT, '');
    t += puncts;
    if (core.length > 0) {
      // Exp 003: script-aware — Cyrillic packs ~3 chars/token, others ~4.
      const cyr = (core.match(/[Ѐ-ӿ]/g) || []).length;
      const other = core.length - cyr;
      t += Math.ceil(cyr / 3) + Math.ceil(other / 4);
    }
  }
  // Exp 004: average correction for the irregular per-word merge (~1/3 get +1).
  t += Math.round(words.length / 3);
  return t;
}

module.exports = { estimate };
