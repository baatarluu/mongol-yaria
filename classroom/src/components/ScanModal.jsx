import { useEffect, useRef, useState } from 'react';
import { Modal, Alert, Spinner } from './ui.jsx';
import { buildLayout } from '../omr/layout.js';
import { readSheet, imageToGray } from '../omr/scanner.js';
import { gradeAnswers, idxToLetter } from '../omr/grade.js';
import { submitResult } from '../sync/sync.js';

// Хариултын хуудсыг утасны камер эсвэл зургаар уншиж дүгнэнэ.
export default function ScanModal({ open, exam, students, onClose, onSaved }) {
  const [stage, setStage] = useState('capture'); // capture | review
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null); // { answers, idString, grade }
  const [idEdit, setIdEdit] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const layout = buildLayout({
    questions: exam.totalQuestions || 20,
    choices: exam.choices || 4,
    idDigits: exam.idDigits ?? 5,
  });

  useEffect(() => {
    if (!open) {
      stopCamera();
      setStage('capture');
      setReview(null);
      setError('');
      setBusy(false);
    }
  }, [open]); // eslint-disable-line

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  async function startCamera() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      // video элемент дараагийн render-д бэлэн болно
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setError('Камер нээгдсэнгүй. Зөвшөөрлөө шалгах эсвэл зураг оруулна уу.');
    }
  }

  async function processSource(source) {
    setBusy(true);
    setError('');
    try {
      const { gray, width, height } = await imageToGray(source, 1100);
      const res = readSheet(gray, width, height, layout, { fillThreshold: 0.42 });
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      const grade = gradeAnswers(res.answers, exam.answerKey || []);
      setReview({ answers: res.answers, grade });
      setIdEdit(res.idString || '');
      setStage('review');
      stopCamera();
    } catch (e) {
      setError('Зураг боловсруулахад алдаа гарлаа: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  function captureFromCamera() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d').drawImage(v, 0, 0);
    processSource(canvas);
  }

  function onFile(e) {
    const f = e.target.files?.[0];
    if (f) processSource(f);
    e.target.value = '';
  }

  // ID-аар сурагчтай тааруулах.
  const matched = students.find((s) => (s.studentNumber || '').trim() === idEdit.trim());

  async function save() {
    if (!exam.answerKey || exam.answerKey.length === 0) {
      setError('Эхлээд хариултын түлхүүрийг оруулна уу.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await submitResult(exam.id, {
        studentId: matched?.id || '',
        studentNumber: idEdit.trim(),
        studentName: matched ? [matched.lastName, matched.firstName].filter(Boolean).join(' ') : '',
        score: review.grade.score,
        total: review.grade.total,
        answers: review.answers,
      });
      onSaved(res); // { synced } — офлайн бол дараалалд орсон
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const hasKey = exam.answerKey && exam.answerKey.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Хариултын хуудас уншуулах"
      maxWidth="max-w-lg"
      footer={
        stage === 'review' ? (
          <>
            <button className="btn-outline" type="button" onClick={() => setStage('capture')}>
              ← Дахин
            </button>
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy ? <Spinner className="h-5 w-5 text-white" /> : 'Дүн хадгалах'}
            </button>
          </>
        ) : (
          <button className="btn-outline" type="button" onClick={onClose}>
            Хаах
          </button>
        )
      }
    >
      <div className="space-y-4">
        <Alert>{error}</Alert>
        {!hasKey && <Alert kind="warn">⚠️ Хариултын түлхүүр оруулаагүй байна — дүн 0 гарна. Эхлээд түлхүүрээ тохируулна уу.</Alert>}

        {stage === 'capture' && (
          <>
            {cameraOn ? (
              <div className="relative overflow-hidden rounded-xl bg-black">
                <video ref={videoRef} playsInline muted className="w-full" />
                {/* Заагч хүрээ */}
                <div className="pointer-events-none absolute inset-4 rounded-lg border-2 border-white/70" />
                <div className="absolute inset-x-0 bottom-3 flex justify-center">
                  <button className="btn-primary" onClick={captureFromCamera} disabled={busy}>
                    {busy ? <Spinner className="h-5 w-5 text-white" /> : '📸 Зураг авах'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Хуудсыг гэрэлтэй газар, 4 булангийн ■ тэмдэг бүрэн харагдахаар байрлуулна.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button className="btn-outline" onClick={cameraOn ? stopCamera : startCamera}>
                {cameraOn ? 'Камер хаах' : '📷 Камер нээх'}
              </button>
              <button className="btn-outline" onClick={() => fileRef.current?.click()}>
                🖼️ Зураг оруулах
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFile}
              />
            </div>
            {busy && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Spinner className="h-5 w-5" /> Уншиж байна…
              </div>
            )}
          </>
        )}

        {stage === 'review' && review && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
              <div>
                <div className="text-xs text-slate-500">Оноо</div>
                <div className="text-2xl font-bold text-brand-700">
                  {review.grade.score}/{review.grade.total}
                </div>
              </div>
              <div className="text-3xl font-bold text-brand-600">{review.grade.percent}%</div>
            </div>

            <div>
              <label className="label">Сурагчийн ID (уншсан — засаж болно)</label>
              <input className="input" value={idEdit} onChange={(e) => setIdEdit(e.target.value)} />
              <p className="mt-1 text-sm">
                {idEdit.trim() === '' ? (
                  <span className="text-slate-400">ID хоосон</span>
                ) : matched ? (
                  <span className="text-emerald-600">
                    ✓ {[matched.lastName, matched.firstName].filter(Boolean).join(' ')}
                  </span>
                ) : (
                  <span className="text-amber-600">⚠️ Тохирох сурагч олдсонгүй (ID-аар хадгална)</span>
                )}
              </p>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium text-slate-400">Хариултууд (✓ зөв, ✗ буруу)</div>
              <div className="grid max-h-48 grid-cols-5 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 text-center text-xs sm:grid-cols-10">
                {review.grade.perQuestion.map((p) => (
                  <div
                    key={p.q}
                    className={`rounded py-1 ${
                      p.isRight ? 'bg-emerald-50 text-emerald-700' : p.marked == null ? 'bg-slate-50 text-slate-400' : 'bg-rose-50 text-rose-700'
                    }`}
                    title={`Зөв: ${idxToLetter(p.correct)}`}
                  >
                    <div className="font-semibold">{p.q + 1}</div>
                    <div>{idxToLetter(p.marked)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
