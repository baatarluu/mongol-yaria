// ─────────────────────────────────────────────────────────────
//  Синк хөдөлгүүр — outbox дахь хүлээгдэж буй бичилтийг онлайн болоход
//  серверт илгээнэ. Офлайн scan-ийг алдалгүй Google Sheets рүү синк хийнэ.
// ─────────────────────────────────────────────────────────────

import { api, IS_DEMO } from '../api/client.js';
import * as outbox from './outbox.js';

let syncing = false;
const statusSubs = new Set();

function online() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function status() {
  return { online: online(), pending: outbox.count(), syncing, demo: IS_DEMO };
}

function emit() {
  const s = status();
  statusSubs.forEach((fn) => fn(s));
}

export function subscribeStatus(fn) {
  statusSubs.add(fn);
  fn(status());
  return () => statusSubs.delete(fn);
}

// Дараалал дахь бичилтүүдийг илгээнэ.
export async function flush() {
  if (syncing || IS_DEMO || !online()) return status();
  if (outbox.count() === 0) return status();
  syncing = true;
  emit();
  try {
    for (const op of outbox.all()) {
      try {
        if (op.kind === 'result') await api.addResult(op.examId, op.payload);
        outbox.remove(op.id);
      } catch (e) {
        if (e.offline) break; // сүлжээ дахин тасарсан — дараа үргэлжлүүлнэ
        // Сервер татгалзсан (жишээ: эрх дууссан) — дахин оролдох утгагүй тул хасна.
        outbox.remove(op.id);
      }
    }
  } finally {
    syncing = false;
    emit();
  }
  return status();
}

// Дүнг илгээх: онлайн бол шууд, эс бөгөөс дараалалд хийнэ (офлайн-эхэлсэн).
export async function submitResult(examId, payload) {
  if (IS_DEMO) {
    const r = await api.addResult(examId, payload);
    return { synced: true, result: r.result };
  }
  if (online()) {
    try {
      const r = await api.addResult(examId, payload);
      emit();
      return { synced: true, result: r.result };
    } catch (e) {
      if (!e.offline) throw e; // жинхэнэ серверийн алдаа — дээш дамжуулна
    }
  }
  const queued = outbox.enqueue({ kind: 'result', examId, payload });
  emit();
  return { synced: false, queued };
}

let started = false;
export function startSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => {
    emit();
    flush();
  });
  window.addEventListener('offline', emit);
  outbox.subscribe(emit);
  // Эхлэхэд болон тогтмол (30 сек тутам) синк оролдоно.
  setTimeout(flush, 1500);
  setInterval(() => {
    if (online() && outbox.count() > 0) flush();
  }, 30000);
}
