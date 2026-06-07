// prepare.js — FIXED data + reference tokenizer (READ-ONLY during the loop)
// МN: Тогтмол дата + жинхэнэ (reference) tokenizer. Давталтын үед ХӨДӨЛГӨХГҮЙ.
//
// The reference tokenizer stands in for an EXPENSIVE, opaque ground-truth
// tokenizer (think: the real Gemini/BPE tokenizer we don't want to call on
// every keystroke). The agent only sees the resulting counts via eval.js — its
// job is to make a CHEAP estimator approximate them. The reference is
// deliberately irregular (script-dependent ratios + an unpredictable per-word
// merge), so a perfect MAE of 0 is NOT achievable — there is a real noise floor.

const PUNCT = /[.,!?;:()«»""''\-—/]/g;

// Deterministic per-word "jitter": real tokenizers merge/split irregularly.
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function refTokens(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let t = 0;
  for (const w of words) {
    const puncts = (w.match(PUNCT) || []).length;
    const core = w.replace(PUNCT, '');
    t += puncts;
    if (core.length > 0) {
      const cyr = (core.match(/[Ѐ-ӿ]/g) || []).length; // Cyrillic
      const other = core.length - cyr;                            // Latin/digits/etc
      t += Math.ceil(cyr / 3) + Math.ceil(other / 4);            // script-dependent ratio
      if (hashStr(core) % 3 === 0) t += 1;                        // irregular merge (~1/3 of words)
    }
  }
  return t;
}

// Fixed evaluation set: mixed Mongolian Cyrillic / English / numbers / punctuation.
const TEXTS = [
  'Сайн байна уу, өнөөдөр цаг агаар сайхан байна.',
  'Монгол хэл дээр ярьсан яриаг текст болгон хөрвүүлнэ.',
  'The quick brown fox jumps over the lazy dog.',
  'Уулзалт 2026 оны 6-р сарын 7-нд болно, тийм үү?',
  'AI туслах нь засвар, хураангуй, орчуулга хийнэ (Англи/Япон/Хятад).',
  'Энэ бол жишээ өгүүлбэр — токен тоог тооцоолох туршилт.',
  'Hello world! Энэ нь mixed хэлтэй текст, 123 тоотой.',
  'Браузерын Web Speech API ашиглан бодит цагийн яриа таних.',
  'Нэг, хоёр, гурав, дөрөв, тав, зургаа, долоо, найм.',
  'Та микрофоны зөвшөөрөл өгнө үү? Chrome дээр хамгийн сайн ажиллана.',
  'Tokenization is hard; punctuation, numbers (42), and mixed scripts маттер.',
  'Өглөө сэрэхэд туршилтуудын лог болон илүү сайн загвар бэлэн байна.',
  'short',
  'Маш урт өгүүлбэр нь олон үг, олон тэмдэгт агуулдаг тул токен ч их болно.',
  'API key: GEMINI_API_KEY-г Environment Variables дээр нэмнэ үү!',
];

const DATA = TEXTS.map((text) => ({ text, ref: refTokens(text) }));

module.exports = { DATA };
