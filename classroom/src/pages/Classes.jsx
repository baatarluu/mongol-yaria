import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { FullLoader, Modal, EmptyState, Alert, Spinner } from '../components/ui.jsx';

const COLORS = ['#3477ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

export default function Classes() {
  const [classes, setClasses] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | classObj
  const [confirmDel, setConfirmDel] = useState(null);

  async function refresh() {
    try {
      const { classes } = await api.listClasses();
      setClasses(classes);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (error && !classes) return <Alert>{error}</Alert>;
  if (!classes) return <FullLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ангиуд</h1>
          <p className="text-sm text-slate-500">{classes.length} анги</p>
        </div>
        <button className="btn-primary" onClick={() => setEditing('new')}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Анги үүсгэх
        </button>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon="🏫"
          title="Анги алга байна"
          subtitle="Эхний ангиа үүсгэнэ үү."
          action={
            <button className="btn-primary" onClick={() => setEditing('new')}>
              Анги үүсгэх
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div key={c.id} className="card group relative overflow-hidden p-5 transition hover:shadow-md">
              <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: c.color || '#3477ff' }} />
              <Link to={`/classes/${c.id}`} className="block">
                <div className="text-lg font-semibold text-slate-800 group-hover:text-brand-700">{c.name}</div>
                <div className="text-sm text-slate-400">{c.subject || 'Хичээл оруулаагүй'}</div>
                <div className="mt-4 flex gap-5 text-sm text-slate-600">
                  <span>👨‍🎓 {c.studentCount} сурагч</span>
                  <span>📝 {c.examCount} шалгалт</span>
                </div>
              </Link>
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                <button className="btn-ghost flex-1 py-1.5 text-xs" onClick={() => setEditing(c)}>
                  ✏️ Засах
                </button>
                <button className="btn-ghost flex-1 py-1.5 text-xs text-rose-600 hover:bg-rose-50" onClick={() => setConfirmDel(c)}>
                  🗑️ Устгах
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClassFormModal
        editing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />

      <DeleteClassModal
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

function ClassFormModal({ editing, onClose, onSaved }) {
  const isNew = editing === 'new';
  const cls = isNew ? null : editing;
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing && editing !== 'new') {
      setName(editing.name || '');
      setSubject(editing.subject || '');
      setColor(editing.color || COLORS[0]);
    } else {
      setName('');
      setSubject('');
      setColor(COLORS[0]);
    }
    setError('');
  }, [editing]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isNew) await api.createClass({ name, subject, color });
      else await api.updateClass(cls.id, { name, subject, color });
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
      title={isNew ? 'Шинэ анги' : 'Анги засах'}
      footer={
        <>
          <button className="btn-outline" onClick={onClose} type="button">
            Цуцлах
          </button>
          <button className="btn-primary" form="class-form" disabled={busy}>
            {busy ? <Spinner className="h-5 w-5 text-white" /> : isNew ? 'Үүсгэх' : 'Хадгалах'}
          </button>
        </>
      }
    >
      <form id="class-form" onSubmit={onSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label">Ангийн нэр *</label>
          <input className="input" autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Жишээ: 10А анги" />
        </div>
        <div>
          <label className="label">Хичээл (заавал биш)</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Жишээ: Математик" />
        </div>
        <div>
          <label className="label">Өнгө</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${color === c ? 'ring-slate-400' : 'ring-transparent'}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}

function DeleteClassModal({ target, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onDelete() {
    setBusy(true);
    setError('');
    try {
      await api.deleteClass(target.id);
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
      title="Анги устгах"
      footer={
        <>
          <button className="btn-outline" onClick={onClose} type="button">
            Цуцлах
          </button>
          <button className="btn-danger" onClick={onDelete} disabled={busy}>
            {busy ? <Spinner className="h-5 w-5 text-white" /> : 'Устгах'}
          </button>
        </>
      }
    >
      <Alert>{error}</Alert>
      <p className="text-sm text-slate-600">
        <strong>{target?.name}</strong> ангийг устгахдаа итгэлтэй байна уу? Энэ ангийн{' '}
        <strong>{target?.studentCount} сурагч</strong> болон холбоотой шалгалтууд бүгд устах болно. Энэ үйлдлийг буцаах боломжгүй.
      </p>
    </Modal>
  );
}
