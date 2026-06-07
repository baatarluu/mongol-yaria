// ─────────────────────────────────────────────────────────────
//  Дүгнэх туслахууд (цэвэр функц — браузераас хамаарахгүй).
//  answers / key нь сонголтын индекс (0=A,1=B,...) эсвэл null (хоосон).
// ─────────────────────────────────────────────────────────────

export function gradeAnswers(answers, key) {
  const total = key.length;
  let score = 0;
  const perQuestion = [];
  for (let i = 0; i < total; i++) {
    const marked = answers[i] ?? null;
    const correct = key[i] ?? null;
    const isRight = correct !== null && marked === correct;
    if (isRight) score++;
    perQuestion.push({ q: i, marked, correct, isRight });
  }
  const percent = total ? Math.round((score / total) * 100) : 0;
  return { score, total, percent, perQuestion };
}

// Индекс ↔ үсэг хооронд хөрвүүлэх.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
export function idxToLetter(i) {
  return i == null ? '–' : LETTERS[i] ?? '?';
}
export function letterToIdx(l) {
  if (l == null) return null;
  const i = LETTERS.indexOf(String(l).trim().toUpperCase());
  return i < 0 ? null : i;
}
