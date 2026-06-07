import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { FullLoader, Modal, EmptyState, Alert, Spinner } from '../components/ui.jsx';
import ImportStudents from '../components/ImportStudents.jsx';
import { studentsToCSV } from '../utils/csv.js';

export default function ClassDetail() {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('students');

  useEffect(() => {
    api
      .getClass(id)
      .then(({ class: c }) => setCls(c))
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Alert>{error}</Alert>;
  if (!cls) return <FullLoader />;

  return (
    <div className="space-y-5">
      <div>
        <Link to="/classes" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          ← Ангиуд
        </Link>
        <div className="flex items-center gap-3">
          <span className="h-9 w-1.5 rounded-full" style={{ backgroundColor: cls.color || '#3477ff' }} />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{cls.name}</h1>
            {cls.subject && <p className="text-sm text-slate-500">{cls.subject}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        <TabButton active={tab === 'students'} onClick={() => setTab('students')}>
          👨‍🎓 Сурагчид
        </TabButton>
        <TabButton active={tab === 'exams'} onClick={() => setTab('exams')}>
          📝 Шалгалт
        </TabButton>
      </div>

      {tab === 'students' ? <StudentsTab classId={id} /> : <ExamsTab classId={id} />}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition ${
        active ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

// ─────────────── Сурагчдын таб ───────────────

function StudentsTab({ classId }) {
  const [students, setStudents] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | studentObj
  const [confirmDel, setConfirmDel] = useState(null);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(
    async (q = query) => {
      try {
        const { students } = await api.listStudents(classId, q);
        setStudents(students);
      } catch (e) {
        setError(e.message);
      }
    },
    [classId, query]
  );

  // Хайлтыг бичих үед хойшлуулж (debounce) дуудна.
  useEffect(() => {
    const t = setTimeout(() => refresh(query), 200);
    return () => clearTimeout(t);
  }, [query, classId]); // eslint-disable-line react-hooks/exhaustive-deps

  function exportCSV() {
    const csv = studentsToCSV(students || []);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'surakhchid.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error && !students) return <Alert>{error}</Alert>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="M21 21l-4-4" />
          </svg>
          <input
            className="input pl-9"
            placeholder="Нэр эсвэл ID-аар хайх…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setImporting(true)}>
            📥 Импорт
          </button>
          <button className="btn-outline" onClick={exportCSV} disabled={!students?.length}>
            📤 Экспорт
          </button>
          <button className="btn-primary" onClick={() => setEditing('new')}>
            + Сурагч
          </button>
        </div>
      </div>

      {!students ? (
        <FullLoader />
      ) : students.length === 0 ? (
        <EmptyState
          icon="👨‍🎓"
          title={query ? 'Хайлтад тохирох сурагч алга' : 'Сурагч алга байна'}
          subtitle={query ? 'Өөр түлхүүр үгээр хайж үзнэ үү.' : 'Сурагч нэмэх эсвэл CSV/Excel файлаас импортлоно уу.'}
          action={
            !query && (
              <div className="flex gap-2">
                <button className="btn-primary" onClick={() => setEditing('new')}>
                  Сурагч нэмэх
                </button>
                <button className="btn-outline" onClick={() => setImporting(true)}>
                  Импортлох
                </button>
              </div>
            )
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-2 text-xs font-medium text-slate-400">
            {students.length} сурагч
          </div>
          <ul className="divide-y divide-slate-100">
            {students.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {(s.firstName?.[0] || s.lastName?.[0] || '?').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-800">
                    {[s.lastName, s.firstName].filter(Boolean).join(' ') || '(нэргүй)'}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {s.studentNumber && <span className="mr-2">ID: {s.studentNumber}</span>}
                    {s.email}
                  </div>
                </div>
                <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setEditing(s)}>
                  ✏️
                </button>
                <button className="btn-ghost px-2 py-1 text-xs text-rose-600 hover:bg-rose-50" onClick={() => setConfirmDel(s)}>
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <StudentFormModal
        classId={classId}
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />

      <ImportStudents
        open={importing}
        classId={classId}
        onClose={() => setImporting(false)}
        onImported={() => {
          setImporting(false);
          refresh();
        }}
      />

      <DeleteStudentModal
        target={confirmDel}
        onClose={() => setConfirmDel(null)}
        onDeleted={() => {
          setConfirmDel(null);
          refresh();
        }}
      />
    </div>
  );
}

function StudentFormModal({ classId, editing, onClose, onSaved }) {
  const isNew = editing === 'new';
  const [form, setForm] = useState({ studentNumber: '', firstName: '', lastName: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing && editing !== 'new') {
      setForm({
        studentNumber: editing.studentNumber || '',
        firstName: editing.firstName || '',
        lastName: editing.lastName || '',
        email: editing.email || '',
      });
    } else {
      setForm({ studentNumber: '', firstName: '', lastName: '', email: '' });
    }
    setError('');
  }, [editing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isNew) await api.addStudent(classId, form);
      else await api.updateStudent(editing.id, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!editing}
      onClose={onClose}
      title={isNew ? 'Сурагч нэмэх' : 'Сурагч засах'}
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose}>
            Цуцлах
          </button>
          <button className="btn-primary" form="student-form" disabled={busy}>
            {busy ? <Spinner className="h-5 w-5 text-white" /> : isNew ? 'Нэмэх' : 'Хадгалах'}
          </button>
        </>
      }
    >
      <form id="student-form" onSubmit={onSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Овог</label>
            <input className="input" value={form.lastName} onChange={set('lastName')} placeholder="Болд" />
          </div>
          <div>
            <label className="label">Нэр</label>
            <input className="input" autoFocus value={form.firstName} onChange={set('firstName')} placeholder="Бат" />
          </div>
        </div>
        <div>
          <label className="label">Сурагчийн ID / дугаар</label>
          <input className="input" value={form.studentNumber} onChange={set('studentNumber')} placeholder="001" />
        </div>
        <div>
          <label className="label">И-мэйл (заавал биш)</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="bat@example.com" />
        </div>
      </form>
    </Modal>
  );
}

function DeleteStudentModal({ target, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function onDelete() {
    setBusy(true);
    setError('');
    try {
      await api.deleteStudent(target.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Сурагч хасах"
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose}>
            Цуцлах
          </button>
          <button className="btn-danger" onClick={onDelete} disabled={busy}>
            {busy ? <Spinner className="h-5 w-5 text-white" /> : 'Хасах'}
          </button>
        </>
      }
    >
      <Alert>{error}</Alert>
      <p className="text-sm text-slate-600">
        <strong>{[target?.lastName, target?.firstName].filter(Boolean).join(' ')}</strong>-г энэ ангиас хасахдаа итгэлтэй байна уу?
      </p>
    </Modal>
  );
}

// ─────────────── Шалгалтын таб ───────────────

function ExamsTab({ classId }) {
  const [exams, setExams] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { exams } = await api.listExams(classId);
      setExams(exams);
    } catch (e) {
      setError(e.message);
    }
  }, [classId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (error && !exams) return <Alert>{error}</Alert>;
  if (!exams) return <FullLoader />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setAdding(true)}>
          + Шалгалт нэмэх
        </button>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Шалгалт алга байна"
          subtitle="Энэ ангид холбогдох шалгалт үүсгэнэ үү."
          action={
            <button className="btn-primary" onClick={() => setAdding(true)}>
              Шалгалт нэмэх
            </button>
          }
        />
      ) : (
        <div className="card divide-y divide-slate-100">
          {exams.map((e) => (
            <Link
              key={e.id}
              to={`/classes/${classId}/exams/${e.id}`}
              className="flex items-center justify-between px-4 py-3 transition hover:bg-slate-50"
            >
              <div>
                <div className="font-medium text-slate-800">{e.name}</div>
                <div className="text-xs text-slate-400">{e.date}</div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>{e.totalQuestions} асуулт</span>
                <span className="text-slate-300">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ExamFormModal
        open={adding}
        classId={classId}
        onClose={() => setAdding(false)}
        onSaved={() => {
          setAdding(false);
          refresh();
        }}
      />
    </div>
  );
}

function ExamFormModal({ open, classId, onClose, onSaved }) {
  const blank = { name: '', date: new Date().toISOString().slice(0, 10), totalQuestions: 20, choices: 4 };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(blank);
      setError('');
    }
  }, [open]); // eslint-disable-line

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.addExam(classId, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Шалгалт нэмэх"
      footer={
        <>
          <button className="btn-outline" type="button" onClick={onClose}>
            Цуцлах
          </button>
          <button className="btn-primary" form="exam-form" disabled={busy}>
            {busy ? <Spinner className="h-5 w-5 text-white" /> : 'Нэмэх'}
          </button>
        </>
      }
    >
      <form id="exam-form" onSubmit={onSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label">Шалгалтын нэр *</label>
          <input className="input" autoFocus required value={form.name} onChange={set('name')} placeholder="Жишээ: I улирлын шалгалт" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Огноо</label>
            <input className="input" type="date" value={form.date} onChange={set('date')} />
          </div>
          <div>
            <label className="label">Асуулт</label>
            <input className="input" type="number" min="1" max="100" value={form.totalQuestions} onChange={set('totalQuestions')} />
          </div>
          <div>
            <label className="label">Сонголт</label>
            <input className="input" type="number" min="2" max="6" value={form.choices} onChange={set('choices')} />
          </div>
        </div>
        <p className="text-xs text-slate-400">Дараа нь хариултын түлхүүр оруулж, хуудас хэвлэн уншуулна.</p>
      </form>
    </Modal>
  );
}
