import { useRef, useState } from 'react';
import { Modal, Alert, Spinner } from './ui.jsx';
import { parseCSV } from '../utils/csv.js';
import { api } from '../api/client.js';

// CSV/Excel(.csv) файл эсвэл хуулсан текстээс сурагчдыг импортлох цонх.
export default function ImportStudents({ open, classId, onClose, onImported }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null); // parseCSV-ийн үр дүн
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  function reset() {
    setText('');
    setPreview(null);
    setError('');
  }

  function handleText(value) {
    setText(value);
    setError('');
    if (value.trim()) {
      try {
        setPreview(parseCSV(value));
      } catch {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleText(String(reader.result || ''));
    reader.readAsText(file, 'utf-8');
  }

  async function onImport() {
    if (!preview || !preview.rows.length) {
      setError('Импортлох сурагч олдсонгүй.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { imported } = await api.importStudents(classId, preview.rows);
      onImported(imported);
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="CSV / Excel-ээс импортлох"
      maxWidth="max-w-lg"
      footer={
        <>
          <button
            className="btn-outline"
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Цуцлах
          </button>
          <button className="btn-primary" onClick={onImport} disabled={busy || !preview?.rows.length}>
            {busy ? <Spinner className="h-5 w-5 text-white" /> : `Импортлох${preview?.rows.length ? ` (${preview.rows.length})` : ''}`}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert>{error}</Alert>

        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-semibold text-slate-600">Формат:</p>
          <p className="mt-1">Excel-ээс <strong>.csv</strong> болгон хадгалаад файлаа сонгоно, эсвэл доорх нүдэнд хуулна.</p>
          <p className="mt-1">Багана: <code>дугаар, нэр, овог, и-мэйл</code> (толгойн мөр байж болно, байхгүй ч болно).</p>
        </div>

        <div>
          <button className="btn-outline w-full" type="button" onClick={() => fileRef.current?.click()}>
            📁 Файл сонгох (.csv)
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={onFile} />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> эсвэл текст хуулах <span className="h-px flex-1 bg-slate-200" />
        </div>

        <textarea
          className="input h-28 font-mono text-xs"
          placeholder={'дугаар,нэр,овог,и-мэйл\n001,Бат,Болд,bat@example.com\n002,Сараа,Дорж,saraa@example.com'}
          value={text}
          onChange={(e) => handleText(e.target.value)}
        />

        {preview && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>Урьдчилан харах: <strong>{preview.rows.length}</strong> сурагч</span>
              {preview.hasHeader && <span className="text-emerald-600">✓ толгойн мөр танигдсан</span>}
            </div>
            <div className="max-h-44 overflow-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5">Дугаар</th>
                    <th className="px-2 py-1.5">Нэр</th>
                    <th className="px-2 py-1.5">Овог</th>
                    <th className="px-2 py-1.5">И-мэйл</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5 text-slate-500">{r.studentNumber}</td>
                      <td className="px-2 py-1.5">{r.firstName}</td>
                      <td className="px-2 py-1.5">{r.lastName}</td>
                      <td className="px-2 py-1.5 text-slate-500">{r.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 50 && <p className="mt-1 text-xs text-slate-400">…болон бусад {preview.rows.length - 50} мөр</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
