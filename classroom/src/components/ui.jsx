import { useEffect } from 'react';

// Дугуй spinner.
export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg className={`animate-spin text-brand-600 ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// Дэлгэц дүүргэх ачааллын төлөв.
export function FullLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

// Modal цонх.
export function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={`card w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-b-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Хаах">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

// Хоосон төлөвийн дэлгэц.
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <p className="text-base font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Алдааны мэдэгдэл.
export function Alert({ children, kind = 'error' }) {
  const styles = {
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
  };
  if (!children) return null;
  return <div className={`rounded-lg border px-3 py-2 text-sm ${styles[kind]}`}>{children}</div>;
}
