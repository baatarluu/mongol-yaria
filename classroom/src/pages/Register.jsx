import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Alert, Spinner } from '../components/ui.jsx';
import { AuthShell } from './Login.jsx';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Багшаар бүртгүүлэх" subtitle="Шинэ бүртгэл үүсгэнэ үү">
      <form onSubmit={onSubmit} className="space-y-4">
        <Alert>{error}</Alert>
        <div>
          <label className="label">Нэр</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Б. Бат" />
        </div>
        <div>
          <label className="label">И-мэйл</label>
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="bagsh@example.com" />
        </div>
        <div>
          <label className="label">Нууц үг</label>
          <input className="input" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Доод тал нь 6 тэмдэгт" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <Spinner className="h-5 w-5 text-white" /> : 'Бүртгүүлэх'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        Бүртгэлтэй юу?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Нэвтрэх
        </Link>
      </p>
    </AuthShell>
  );
}
