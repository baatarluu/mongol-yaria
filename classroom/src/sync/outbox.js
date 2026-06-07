// ─────────────────────────────────────────────────────────────
//  Офлайн дараалал (outbox) — холбогдоход серверт илгээх хүлээгдэж буй
//  бичилтүүдийг localStorage-д тогтвортой хадгална. Гол хэрэглээ: интернэтгүй
//  орчинд scan хийсэн дүнг алдалгүй хадгалж, онлайн болоход синк хийх.
// ─────────────────────────────────────────────────────────────

const KEY = 'classroom.outbox';
const subs = new Set();

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}
function write(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
  subs.forEach((fn) => fn(arr));
}

export function enqueue(op) {
  const arr = read();
  const item = {
    id: 'ob_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    createdAt: new Date().toISOString(),
    ...op,
  };
  arr.push(item);
  write(arr);
  return item;
}

export function all() {
  return read();
}

// Тухайн шалгалтын хүлээгдэж буй дүнгүүд (UI-д харуулахад).
export function forExam(examId) {
  return read().filter((o) => o.kind === 'result' && o.examId === examId);
}

export function remove(id) {
  write(read().filter((o) => o.id !== id));
}

export function count() {
  return read().length;
}

export function subscribe(fn) {
  subs.add(fn);
  fn(read());
  return () => subs.delete(fn);
}
