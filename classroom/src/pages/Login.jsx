import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Spinner } from '../components/ui.jsx';
import InstallButton from '../components/InstallButton.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Тавтай морил 👋" subtitle="Багшийн самбарт нэвтэрнэ үү">
      <form onSubmit={onSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label">И-мэйл</label>
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="bagsh@example.com" />
        </div>
        <div>
          <label className="label">Нууц үг</label>
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <Spinner className="h-5 w-5 text-white" /> : 'Нэвтрэх'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        Бүртгэлгүй юу?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline">
          Шинээр бүртгүүлэх
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-2xl text-white shadow-lg shadow-brand-600/30">🎓</div>
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="card p-6">{children}</div>
        <div className="mt-4 flex justify-center">
          <InstallButton className="btn-ghost text-xs text-slate-500" />
        </div>
      </div>
    </div>
  );
}
