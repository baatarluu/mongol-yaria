import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { FullLoader, Alert, EmptyState } from '../components/ui.jsx';

function StatCard({ label, value, icon, accent }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`grid h-12 w-12 place-items-center rounded-xl text-xl ${accent}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { teacher } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .dashboard()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <FullLoader />;

  const { stats, perClass } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Сайн байна уу, {teacher?.name} 👋</h1>
        <p className="text-sm text-slate-500">Таны ангиудын ерөнхий тойм</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Анги" value={stats.classes} icon="🏫" accent="bg-brand-50 text-brand-600" />
        <StatCard label="Сурагч" value={stats.students} icon="👨‍🎓" accent="bg-emerald-50 text-emerald-600" />
        <StatCard label="Шалгалт" value={stats.exams} icon="📝" accent="bg-amber-50 text-amber-600" />
        <StatCard label="Уншсан дүн" value={stats.results ?? 0} icon="✅" accent="bg-violet-50 text-violet-600" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Ангиуд</h2>
          <Link to="/classes" className="text-sm font-semibold text-brand-600 hover:underline">
            Бүгдийг харах →
          </Link>
        </div>

        {perClass.length === 0 ? (
          <EmptyState
            icon="🏫"
            title="Анги алга байна"
            subtitle="Эхний ангиа үүсгээд сурагчдаа нэмж эхэлнэ үү."
            action={
              <Link to="/classes" className="btn-primary">
                Анги үүсгэх
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {perClass.map((c) => (
              <Link key={c.id} to={`/classes/${c.id}`} className="card group flex items-center gap-4 p-4 transition hover:shadow-md">
                <span className="h-10 w-1.5 rounded-full" style={{ backgroundColor: c.color || '#3477ff' }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-800 group-hover:text-brand-700">{c.name}</div>
                  {c.subject && <div className="truncate text-xs text-slate-400">{c.subject}</div>}
                </div>
                <div className="flex shrink-0 gap-4 text-center">
                  <div>
                    <div className="text-sm font-bold text-slate-700">{c.studentCount}</div>
                    <div className="text-[11px] text-slate-400">сурагч</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-700">{c.examCount}</div>
                    <div className="text-[11px] text-slate-400">шалгалт</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
