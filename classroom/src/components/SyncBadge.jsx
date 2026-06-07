import { useSync } from '../sync/useSync.js';
import { Spinner } from './ui.jsx';

// Толгой дахь синк/холболтын төлвийн заагч.
//  • Demo горимд харагдахгүй (бүх дата локалд).
//  • Офлайн эсвэл хүлээгдэж буй дүн байвал тодорно.
export default function SyncBadge({ compact = false }) {
  const { online, pending, syncing, demo, syncNow } = useSync();
  if (demo) return null;

  if (online && pending === 0) {
    // Бүх зүйл синк хийгдсэн — намуухан заагч.
    return (
      <span className="hidden items-center gap-1 text-xs text-emerald-600 sm:inline-flex" title="Синк хийгдсэн">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Синк OK
      </span>
    );
  }

  return (
    <button
      onClick={() => online && syncNow()}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
        online ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-slate-300 bg-slate-100 text-slate-500'
      }`}
      title={online ? 'Хүлээгдэж буй дүнг синк хийх' : 'Офлайн — холбогдоход автоматаар синк хийнэ'}
    >
      {syncing ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : (
        <span className={`h-2 w-2 rounded-full ${online ? 'bg-amber-500' : 'bg-slate-400'}`} />
      )}
      {online ? (compact ? pending : `Синк (${pending})`) : 'Офлайн'}
      {!online && pending > 0 && <span className="ml-0.5">· {pending}</span>}
    </button>
  );
}
