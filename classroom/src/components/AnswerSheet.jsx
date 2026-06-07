import { buildLayout, LETTERS } from '../omr/layout.js';

// Хариултын хуудсыг SVG-ээр зурна (хэвлэхэд тод). layout-ийн ИЖИЛ
// геометрийг ашигладаг тул scanner яг тааруулж уншина.
export default function AnswerSheet({ exam, className = '' }) {
  const layout = buildLayout({
    questions: exam.totalQuestions || 20,
    choices: exam.choices || 4,
    idDigits: exam.idDigits ?? 5,
  });
  const { W, H } = layout;

  return (
    <svg
      id="answer-sheet-svg"
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      style={{ width: '100%', height: 'auto', background: '#fff', display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Хүрээ */}
      <rect x="2" y="2" width={W - 4} height={H - 4} fill="#fff" stroke="#e2e8f0" strokeWidth="2" />

      {/* Булангийн тэмдгүүд (fiducials) — заавал хэвээр үлдээ */}
      {layout.fiducials.map((f, i) => (
        <rect key={i} x={f.cx - f.size / 2} y={f.cy - f.size / 2} width={f.size} height={f.size} fill="#000" />
      ))}

      {/* Толгой */}
      <text x={W / 2} y={70} textAnchor="middle" fontSize="34" fontWeight="700" fill="#0f172a">
        {exam.name || 'Шалгалт'}
      </text>
      <text x={W / 2} y={104} textAnchor="middle" fontSize="20" fill="#475569">
        {exam.date || ''} · {layout.questions} асуулт · A–{LETTERS[layout.choices - 1]}
      </text>
      <text x={130} y={170} fontSize="22" fill="#0f172a">Нэр: ______________________________</text>
      <text x={130} y={210} fontSize="16" fill="#94a3b8">
        Зөвхөн нэг хариултыг бүрэн будна ●. Булангийн ■ тэмдгүүдийг бүү бохирдуул.
      </text>

      {/* Сурагчийн ID блок */}
      {layout.idBlock && (
        <>
          <text x={layout.idBlock.startX - layout.idBlock.colStep / 2} y={layout.idBlock.labelY} fontSize="20" fontWeight="600" fill="#0f172a">
            Сурагчийн ID
          </text>
          {Array.from({ length: layout.idDigits }).map((_, c) => (
            <text
              key={`idh${c}`}
              x={layout.idBlock.startX + c * layout.idBlock.colStep}
              y={layout.idBlock.topY - 14}
              textAnchor="middle"
              fontSize="14"
              fill="#94a3b8"
            >
              {c + 1}
            </text>
          ))}
          {layout.idBubbles.map((b, i) => (
            <g key={`id${i}`}>
              <circle cx={b.cx} cy={b.cy} r={b.r} fill="none" stroke="#94a3b8" strokeWidth="1.5" />
              <text x={b.cx} y={b.cy + 4} textAnchor="middle" fontSize="11" fill="#94a3b8">
                {b.digit}
              </text>
            </g>
          ))}
        </>
      )}

      {/* Хариултын блок */}
      {layout.answerBubbles.map((b, i) => (
        <circle key={`a${i}`} cx={b.cx} cy={b.cy} r={b.r} fill="none" stroke="#334155" strokeWidth="1.6" />
      ))}
      {/* Бөмбөлгийн доторх үсэг ба асуултын дугаар */}
      {layout.answerBubbles.map((b, i) => (
        <text key={`al${i}`} x={b.cx} y={b.cy + 4} textAnchor="middle" fontSize="11" fill="#64748b">
          {LETTERS[b.choice]}
        </text>
      ))}
      {Array.from({ length: layout.questions }).map((_, q) => {
        const col = Math.floor(q / layout.rowsPerCol);
        const rIdx = q % layout.rowsPerCol;
        const cm = layout.colMeta[col];
        const cy = cm.top + rIdx * cm.rowStep + cm.rowStep / 2;
        return (
          <text key={`qn${q}`} x={cm.x0 + 6} y={cy + 5} fontSize="16" fontWeight="600" fill="#0f172a">
            {q + 1}.
          </text>
        );
      })}
    </svg>
  );
}

// Хуудсыг шинэ цонхонд нээж хэвлэнэ.
export function printAnswerSheet(exam) {
  const win = window.open('', '_blank');
  if (!win) return;
  // Одоо DOM дээр render хийгдсэн (далд) хуудасны SVG-г хуулж шинэ цонхонд хэвлэнэ.
  const svg = document.getElementById('answer-sheet-svg');
  const svgHTML = svg ? svg.outerHTML : '';
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${exam.name || 'Хариултын хуудас'}</title>
    <style>@page{size:A4;margin:8mm} body{margin:0} svg{width:100%;height:auto}</style>
    </head><body>${svgHTML}<script>window.onload=()=>{window.print()}<\/script></body></html>`);
  win.document.close();
}
