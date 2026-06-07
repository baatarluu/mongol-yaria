import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { IS_DEMO } from '../api/client.js';

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-lg px-3 py-2 text-sm font-medium transition ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { teacher, logout } = useAuth();
  const initials = (teacher?.name || teacher?.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">🎓</span>
            <span className="text-base font-bold text-slate-800">Багшийн самбар</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <NavItem to="/">Хяналт</NavItem>
            <NavItem to="/classes">Анги</NavItem>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-700">{teacher?.name}</div>
              <div className="text-xs text-slate-400">{teacher?.email}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {initials}
            </div>
            <button onClick={logout} className="btn-ghost px-2" title="Гарах">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4M13 5h6a2 2 0 012 2v10a2 2 0 01-2 2h-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Гар утасны навигаци */}
        <nav className="flex items-center gap-1 border-t border-slate-100 px-4 py-2 sm:hidden">
          <NavItem to="/">Хяналт</NavItem>
          <NavItem to="/classes">Анги</NavItem>
        </nav>
      </header>

      {IS_DEMO && (
        <div className="bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800">
          ⚠️ Demo горим — өгөгдөл зөвхөн энэ төхөөрөмжид (localStorage) хадгалагдана. Google Sheets холбохын тулд README-г үзнэ үү.
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
