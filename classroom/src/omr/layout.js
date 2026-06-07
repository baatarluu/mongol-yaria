// ─────────────────────────────────────────────────────────────
//  Хариултын хуудасны байршил (layout) — ХЭВЛЭХ ба SCAN хийхэд
//  ИЖИЛ геометрийг ашиглана. Координат нь viewBox px (0..W, 0..H).
//
//  buildLayout({ questions, choices, idDigits }) →
//    { W, H, fiducials:[{cx,cy,size}], answerBubbles:[{q,choice,cx,cy,r}],
//      idBubbles:[{col,digit,cx,cy,r}], columns, rowsPerCol, ... }
//
//  Энэ нь зөвхөн тоон тодорхойлолт — зураг зурахгүй. AnswerSheet.jsx
//  үүгээр SVG зурж, scanner.js үүгээр бөмбөлгүүдийг уншина.
// ─────────────────────────────────────────────────────────────

export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Стандарт темплэйтүүд (хурдан сонгох).
export const TEMPLATES = [
  { id: 'q20c4', name: '20 асуулт · A–D', questions: 20, choices: 4, idDigits: 5 },
  { id: 'q25c5', name: '25 асуулт · A–E', questions: 25, choices: 5, idDigits: 5 },
  { id: 'q50c4', name: '50 асуулт · A–D', questions: 50, choices: 4, idDigits: 6 },
  { id: 'q100c4', name: '100 асуулт · A–D', questions: 100, choices: 4, idDigits: 6 },
];

export function buildLayout({ questions = 20, choices = 4, idDigits = 5 } = {}) {
  questions = Math.max(1, Math.min(100, questions | 0));
  choices = Math.max(2, Math.min(6, choices | 0));
  idDigits = Math.max(0, Math.min(8, idDigits | 0));

  const W = 1000;
  const H = 1414; // A4 portrait харьцаа

  // ── Булангийн тэмдэгүүд (fiducials) ──
  const fs = 46;
  const fm = 44; // margin to center
  const fiducials = [
    { cx: fm, cy: fm, size: fs }, // TL
    { cx: W - fm, cy: fm, size: fs }, // TR
    { cx: fm, cy: H - fm, size: fs }, // BL
    { cx: W - fm, cy: H - fm, size: fs }, // BR
  ];

  // ── Сурагчийн ID блок ──
  const idBubbles = [];
  let idBlock = null;
  if (idDigits > 0) {
    const r = 13;
    const colStep = 56;
    const rowStep = 34;
    const blockW = idDigits * colStep;
    const startX = (W - blockW) / 2 + colStep / 2;
    const topY = 300; // эхний цифрийн төв (0)
    for (let c = 0; c < idDigits; c++) {
      const cx = startX + c * colStep;
      for (let d = 0; d <= 9; d++) {
        idBubbles.push({ col: c, digit: d, cx, cy: topY + d * rowStep, r });
      }
    }
    idBlock = { startX, topY, colStep, rowStep, r, labelY: topY - 38 };
  }

  // ── Хариултын блок ──
  let columns;
  if (questions <= 25) columns = 1;
  else if (questions <= 50) columns = 2;
  else if (questions <= 75) columns = 3;
  else columns = 4;
  const rowsPerCol = Math.ceil(questions / columns);

  const answerTop = idDigits > 0 ? 700 : 320;
  const answerBottom = H - 90;
  const availH = answerBottom - answerTop;
  const rowStep = Math.min(36, availH / rowsPerCol);
  const r = Math.min(13, rowStep / 2.6);

  const blockW = (W - 80) / columns;
  const numW = 44; // дугаарын зай
  const bubbleStep = Math.min(38, (blockW - numW - 24) / choices);

  const answerBubbles = [];
  const colMeta = [];
  for (let c = 0; c < columns; c++) {
    const x0 = 40 + c * blockW + 12;
    const bubbleStartX = x0 + numW + bubbleStep / 2;
    colMeta.push({ x0, bubbleStartX, top: answerTop, rowStep, bubbleStep });
    for (let rIdx = 0; rIdx < rowsPerCol; rIdx++) {
      const q = c * rowsPerCol + rIdx;
      if (q >= questions) break;
      const cy = answerTop + rIdx * rowStep + rowStep / 2;
      for (let ch = 0; ch < choices; ch++) {
        answerBubbles.push({ q, choice: ch, cx: bubbleStartX + ch * bubbleStep, cy, r });
      }
    }
  }

  return {
    W, H, questions, choices, idDigits,
    fiducials, idBubbles, idBlock,
    answerBubbles, columns, rowsPerCol, answerTop, rowStep, bubbleStep, numW,
    colMeta, bubbleR: r,
  };
}
