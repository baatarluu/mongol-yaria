import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { FullLoader, Alert, Modal, Spinner, EmptyState } from '../components/ui.jsx';
import AnswerSheet, { printAnswerSheet } from '../components/AnswerSheet.jsx';
import ScanModal from '../components/ScanModal.jsx';
import { LETTERS } from '../omr/layout.js';

export default function ExamDetail() {
  const { id: classId, examId } = useParams();
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [editingKey, setEditingKey] = useState(false);
  const [editingCfg, setEditingCfg] = useState(false);
  const [scanning, setScanning] = useState(false);

  const loadResults = useCallback(async () => {
    const { results } = await api.listResults(examId);
    setResults(results);
  }, [examId]);

  const loadAll = useCallback(async () => {
    try {
      const [{ exam }, { students }] = await Promise.all([
        api.getExam(examId),
        api.listStudents(classId, ''),
      ]);
      setExam(exam);
      setStudents(students);
      await loadResults();
    } catch (e) {
      setError(e.message);
    }
  }, [examId, classId, loadResults]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (error && !exam) return <Alert>{error}</Alert>;
  if (!exam) return <FullLoader />;

  const keySet = (exam.answerKey || []).filter((k) => k != null).length;
  const avg = results.length
    ? Math.round(results.reduce((s, r) => s + (r.total ? (r.score / r.total) * 100 : 0), 0) / results.length)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <Link to={`/classes/${classId}`} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          ← Ангид буцах
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{exam.name}</h1>
            <p className="text-sm text-slate-500">
              {exam.date} · {exam.totalQuestions} асуулт · A–{LETTERS[(exam.choices || 4) - 1]} · ID {exam.idDigits} орон
            </p>
          </div>
          <button className="btn-ghost text-sm" onClick={() => setEditingCfg(true)}>
            ⚙️ Тохиргоо
          </button>
        </div>
      </div>

      {/* Үйлдлийн товчнууд */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button className="btn-outline" onClick={() => setEditingKey(true)}>
          🔑 Хариултын түлхүүр
        </button>
        <button className="btn-outline" onClick={() => printAnswerSheet(exam)}>
          🖨️ Хуудас хэвлэх
        </button>
        <button className="btn-primary col-span-2 sm:col-span-2" onClick={() => setScanning(true)}>
          📲 Хуудас уншуулах (scan)
        </button>
      </div>

      {/* Тойм */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Түлхүүр" value={`${keySet}/${exam.totalQuestions}`} />
        <Stat label="Уншсан" value={results.length} />
        <Stat label="Дундаж" value={`${avg}%`} />
      </div>

      {/* Дүнгийн жагсаалт */}
      <div>
        <h2 className="mb-2 text-lg font-semibold text-slate-800">Дүнгүүд</h2>
        {results.length === 0 ? (
          <EmptyState
            icon="📄"
            title="Дүн алга"
            subtitle="Хариултын түлхүүрээ тохируулаад хуудсуудыг уншуулна уу."
            action={
              <button className="btn-primary" onClick={() => setScanning(true)}>
                Хуудас уншуулах
              </button>
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2">Сурагч / ID</th>
                  <th className="px-4 py-2 text-center">Оноо</th>
                  <th className="px-4 py-2 text-center">%</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <div className="font-medium text-slate-800">{r.studentName || '(нэр тодорхойгүй)'}</div>
                      <div className="text-xs text-slate-400">ID: {r.studentNumber || '—'}</div>
                    </td>
                    <td className="px-4 py-2 text-center font-semibold">{r.score}/{r.total}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pct(r)}`}>
                        {r.total ? Math.round((r.score / r.total) * 100) : 0}%
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="btn-ghost px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        onClick={async () => {
                          await api.deleteResult(r.id);
                          loadResults();
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Далд: хэвлэх SVG */}
      <div className="sr-only" aria-hidden style={{ position: 'absolute', left: -99999, top: 0, width: 800 }}>
        <AnswerSheet exam={exam} />
      </div>

      {editingKey && (
        <AnswerKeyModal
          exam={exam}
          onClose={() => setEditingKey(false)}
          onSaved={(updated) => {
            setExam(updated);
            setEditingKey(false);
          }}
        />
      )}
      {editingCfg && (
        <ExamConfigModal
          exam={exam}
          onClose={() => setEditingCfg(false)}
          onSaved={(updated) => {
            setExam(updated);
            setEditingCfg(false);
          }}
        />
      )}
      <ScanModal
        open={scanning}
        exam={exam}
        students={students}
        onClose={() => setScanning(false)}
        onSaved={() => {
          setScanning(false);
          loadResults();
        }}
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-3 text-center">
      <div className="text-lg font-bold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function pct(r) {
  const p = r.total ? (r.score / r.total) * 100 : 0;
  if (p >= 80) return 'bg-emerald-100 text-emerald-700';
  if (p >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

// ── Хариултын түлхүүр засварлагч ──
function AnswerKeyModal({ exam, onClose, onSaved }) {
  const n = exam.totalQuestions || 20;
  const choices = exam.choices || 4;
  const [key, setKey] = useState(() => {
    const k = Array.from({ length: n }, (_, i) => exam.answerKey?.[i] ?? null);
    return k;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function setAns(q, ch) {
    setKey((prev) => {
      const next = [...prev];
      next[q] = next[q] === ch ? null : ch;
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const { exam: updated } = await api.updateExam(exam.id, { answerKey: key });
      onSaved(updated);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Хариултын түлхүүр"
      maxWidth="max-w-lg"
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>Цуцлах</button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? <Spinner className="h-5 w-5 text-white" /> : 'Хадгалах'}
          </button>
        </>
      }
    >
      <Alert>{error}</Alert>
      <p className="mb-3 text-sm text-slate-500">Асуулт бүрийн зөв хариултыг сонгоно.</p>
      <div className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-1">
        {key.map((ans, q) => (
          <div key={q} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-right text-sm font-semibold text-slate-500">{q + 1}.</span>
            <div className="flex gap-1.5">
              {Array.from({ length: choices }).map((_, ch) => (
                <button
                  key={ch}
                  onClick={() => setAns(q, ch)}
                  className={`h-9 w-9 rounded-full border text-sm font-semibold transition ${
                    ans === ch
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:border-brand-400'
                  }`}
                >
                  {LETTERS[ch]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ── Шалгалтын тохиргоо ──
function ExamConfigModal({ exam, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: exam.name,
    date: exam.date,
    totalQuestions: exam.totalQuestions,
    choices: exam.choices || 4,
    idDigits: exam.idDigits ?? 5,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    setError('');
    try {
      const { exam: updated } = await api.updateExam(exam.id, {
        name: form.name,
        date: form.date,
        totalQuestions: Number(form.totalQuestions),
        choices: Number(form.choices),
        idDigits: Number(form.idDigits),
      });
      onSaved(updated);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Шалгалтын тохиргоо"
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>Цуцлах</button>
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? <Spinner className="h-5 w-5 text-white" /> : 'Хадгалах'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label">Нэр</label>
          <input className="input" value={form.name} onChange={set('name')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Огноо</label>
            <input className="input" type="date" value={form.date} onChange={set('date')} />
          </div>
          <div>
            <label className="label">Асуултын тоо (1–100)</label>
            <input className="input" type="number" min="1" max="100" value={form.totalQuestions} onChange={set('totalQuestions')} />
          </div>
          <div>
            <label className="label">Сонголт (2–6)</label>
            <input className="input" type="number" min="2" max="6" value={form.choices} onChange={set('choices')} />
          </div>
          <div>
            <label className="label">ID орон (0–8)</label>
            <input className="input" type="number" min="0" max="8" value={form.idDigits} onChange={set('idDigits')} />
          </div>
        </div>
        <p className="text-xs text-slate-400">Тохиргоо өөрчилсний дараа хуудсаа дахин хэвлэнэ үү.</p>
      </div>
    </Modal>
  );
}
