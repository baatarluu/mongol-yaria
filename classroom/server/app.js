// ─────────────────────────────────────────────────────────────
//  Цөм API router — framework-аас хамааралгүй.
//
//  handleRequest({ method, path, query, body, headers }) →
//      { status, body }
//
//  Үүнийг Vercel, Netlify, локал dev-server бүгд ашиглана.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import {
  ensureTabs,
  readTable,
  appendRow,
  appendRows,
  updateRow,
  deleteRows,
} from './sheets.js';
import { hashPassword, verifyPassword, signToken, verifyToken } from './auth.js';

const json = (status, body) => ({ status, body });
const ok = (body) => json(200, body);
const bad = (msg, status = 400) => json(status, { error: msg });

let _initialized = false;
async function init() {
  if (_initialized) return;
  await ensureTabs();
  _initialized = true;
}

// path-ийг сегментүүдэд хуваана: "/api/classes/123/students" → ["classes","123","students"]
function segments(path) {
  return path.replace(/^\/?api\/?/, '').replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
}

export async function handleRequest({ method, path, query = {}, body = {}, headers = {} }) {
  try {
    await init();
  } catch (e) {
    return bad('Backend тохиргоо дутуу: ' + e.message, 500);
  }

  const seg = segments(path);
  const auth = verifyToken(headers.authorization || headers.Authorization);

  // ─── Нэвтрэлтгүй замууд ───
  if (seg[0] === 'auth') {
    if (seg[1] === 'register' && method === 'POST') return registerTeacher(body);
    if (seg[1] === 'login' && method === 'POST') return loginTeacher(body);
    return bad('Олдсонгүй', 404);
  }

  // ─── Эндээс цааш нэвтрэлт шаардана ───
  if (!auth) return bad('Нэвтрэх шаардлагатай', 401);

  if (seg[0] === 'me' && method === 'GET') {
    return ok({ teacher: auth });
  }

  if (seg[0] === 'dashboard' && method === 'GET') {
    return dashboard(auth);
  }

  if (seg[0] === 'classes') {
    // /classes
    if (seg.length === 1) {
      if (method === 'GET') return listClasses(auth);
      if (method === 'POST') return createClass(auth, body);
    }
    // /classes/:id
    if (seg.length === 2) {
      const id = seg[1];
      if (method === 'PATCH') return updateClass(auth, id, body);
      if (method === 'DELETE') return deleteClass(auth, id);
      if (method === 'GET') return getClass(auth, id);
    }
    // /classes/:id/students
    if (seg.length === 3 && seg[2] === 'students') {
      const classId = seg[1];
      if (method === 'GET') return listStudents(auth, classId, query.q);
      if (method === 'POST') return addStudent(auth, classId, body);
    }
    // /classes/:id/students/import
    if (seg.length === 4 && seg[2] === 'students' && seg[3] === 'import') {
      if (method === 'POST') return importStudents(auth, seg[1], body);
    }
    // /classes/:id/exams
    if (seg.length === 3 && seg[2] === 'exams') {
      const classId = seg[1];
      if (method === 'GET') return listExams(auth, classId);
      if (method === 'POST') return addExam(auth, classId, body);
    }
  }

  if (seg[0] === 'students' && seg.length === 2) {
    const id = seg[1];
    if (method === 'PATCH') return updateStudent(auth, id, body);
    if (method === 'DELETE') return deleteStudent(auth, id);
  }

  return bad('Олдсонгүй: ' + method + ' /' + seg.join('/'), 404);
}

// ─────────────── Auth ───────────────

async function registerTeacher(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = String(body.name || '').trim();
  if (!email || !password) return bad('И-мэйл болон нууц үг шаардлагатай');
  if (password.length < 6) return bad('Нууц үг доод тал нь 6 тэмдэгт байх ёстой');

  const teachers = await readTable('Teachers');
  if (teachers.some((t) => t.email === email)) {
    return bad('Энэ и-мэйл аль хэдийн бүртгэлтэй байна', 409);
  }
  const teacher = {
    id: randomUUID(),
    email,
    passwordHash: await hashPassword(password),
    name: name || email.split('@')[0],
    createdAt: new Date().toISOString(),
  };
  await appendRow('Teachers', teacher);
  const safe = { id: teacher.id, email: teacher.email, name: teacher.name };
  return ok({ token: signToken(safe), teacher: safe });
}

async function loginTeacher(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const teachers = await readTable('Teachers');
  const t = teachers.find((x) => x.email === email);
  if (!t) return bad('И-мэйл эсвэл нууц үг буруу', 401);
  const valid = await verifyPassword(password, t.passwordHash);
  if (!valid) return bad('И-мэйл эсвэл нууц үг буруу', 401);
  const safe = { id: t.id, email: t.email, name: t.name };
  return ok({ token: signToken(safe), teacher: safe });
}

// ─────────────── Classes ───────────────

async function listClasses(auth) {
  const [classes, students, exams] = await Promise.all([
    readTable('Classes'),
    readTable('Students'),
    readTable('Exams'),
  ]);
  const mine = classes.filter((c) => c.teacherId === auth.id && c.archived !== 'true');
  const enriched = mine.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    color: c.color,
    createdAt: c.createdAt,
    studentCount: students.filter((s) => s.classId === c.id).length,
    examCount: exams.filter((e) => e.classId === c.id).length,
  }));
  enriched.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return ok({ classes: enriched });
}

async function getClass(auth, id) {
  const classes = await readTable('Classes');
  const c = classes.find((x) => x.id === id && x.teacherId === auth.id);
  if (!c) return bad('Анги олдсонгүй', 404);
  return ok({ class: { id: c.id, name: c.name, subject: c.subject, color: c.color, createdAt: c.createdAt } });
}

async function createClass(auth, body) {
  const name = String(body.name || '').trim();
  if (!name) return bad('Ангийн нэр шаардлагатай');
  const cls = {
    id: randomUUID(),
    teacherId: auth.id,
    name,
    subject: String(body.subject || '').trim(),
    color: String(body.color || '#3477ff'),
    archived: 'false',
    createdAt: new Date().toISOString(),
  };
  await appendRow('Classes', cls);
  return ok({ class: { ...cls, studentCount: 0, examCount: 0 } });
}

async function updateClass(auth, id, body) {
  const classes = await readTable('Classes');
  const c = classes.find((x) => x.id === id && x.teacherId === auth.id);
  if (!c) return bad('Анги олдсонгүй', 404);
  const updated = {
    id: c.id,
    teacherId: c.teacherId,
    name: body.name !== undefined ? String(body.name).trim() : c.name,
    subject: body.subject !== undefined ? String(body.subject).trim() : c.subject,
    color: body.color !== undefined ? String(body.color) : c.color,
    archived: c.archived || 'false',
    createdAt: c.createdAt,
  };
  await updateRow('Classes', c._row, updated);
  return ok({ class: updated });
}

async function deleteClass(auth, id) {
  const [classes, students, exams] = await Promise.all([
    readTable('Classes'),
    readTable('Students'),
    readTable('Exams'),
  ]);
  const c = classes.find((x) => x.id === id && x.teacherId === auth.id);
  if (!c) return bad('Анги олдсонгүй', 404);
  // Холбоотой сурагч, шалгалтуудыг бас устгана (cascade).
  const studentRows = students.filter((s) => s.classId === id).map((s) => s._row);
  const examRows = exams.filter((e) => e.classId === id).map((e) => e._row);
  await deleteRows('Students', studentRows);
  await deleteRows('Exams', examRows);
  await deleteRows('Classes', [c._row]);
  return ok({ deleted: true });
}

// ─────────────── Students ───────────────

function matchStudent(s, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(needle) ||
    String(s.studentNumber || '').toLowerCase().includes(needle) ||
    String(s.email || '').toLowerCase().includes(needle)
  );
}

async function listStudents(auth, classId, q) {
  const classes = await readTable('Classes');
  const c = classes.find((x) => x.id === classId && x.teacherId === auth.id);
  if (!c) return bad('Анги олдсонгүй', 404);
  const students = await readTable('Students');
  const list = students
    .filter((s) => s.classId === classId && matchStudent(s, q))
    .map(cleanStudent);
  list.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
  return ok({ students: list });
}

function cleanStudent(s) {
  return {
    id: s.id,
    classId: s.classId,
    studentNumber: s.studentNumber,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    createdAt: s.createdAt,
  };
}

async function addStudent(auth, classId, body) {
  const classes = await readTable('Classes');
  const c = classes.find((x) => x.id === classId && x.teacherId === auth.id);
  if (!c) return bad('Анги олдсонгүй', 404);
  const first = String(body.firstName || '').trim();
  const last = String(body.lastName || '').trim();
  if (!first && !last) return bad('Сурагчийн нэр шаардлагатай');
  const student = {
    id: randomUUID(),
    classId,
    teacherId: auth.id,
    studentNumber: String(body.studentNumber || '').trim(),
    firstName: first,
    lastName: last,
    email: String(body.email || '').trim(),
    createdAt: new Date().toISOString(),
  };
  await appendRow('Students', student);
  return ok({ student: cleanStudent(student) });
}

async function importStudents(auth, classId, body) {
  const classes = await readTable('Classes');
  const c = classes.find((x) => x.id === classId && x.teacherId === auth.id);
  if (!c) return bad('Анги олдсонгүй', 404);
  const rows = Array.isArray(body.students) ? body.students : [];
  const now = new Date().toISOString();
  const prepared = rows
    .map((r) => ({
      id: randomUUID(),
      classId,
      teacherId: auth.id,
      studentNumber: String(r.studentNumber || '').trim(),
      firstName: String(r.firstName || '').trim(),
      lastName: String(r.lastName || '').trim(),
      email: String(r.email || '').trim(),
      createdAt: now,
    }))
    .filter((s) => s.firstName || s.lastName || s.studentNumber);
  await appendRows('Students', prepared);
  return ok({ imported: prepared.length, students: prepared.map(cleanStudent) });
}

async function updateStudent(auth, id, body) {
  const students = await readTable('Students');
  const s = students.find((x) => x.id === id && x.teacherId === auth.id);
  if (!s) return bad('Сурагч олдсонгүй', 404);
  const updated = {
    id: s.id,
    classId: s.classId,
    teacherId: s.teacherId,
    studentNumber: body.studentNumber !== undefined ? String(body.studentNumber).trim() : s.studentNumber,
    firstName: body.firstName !== undefined ? String(body.firstName).trim() : s.firstName,
    lastName: body.lastName !== undefined ? String(body.lastName).trim() : s.lastName,
    email: body.email !== undefined ? String(body.email).trim() : s.email,
    createdAt: s.createdAt,
  };
  await updateRow('Students', s._row, updated);
  return ok({ student: cleanStudent(updated) });
}

async function deleteStudent(auth, id) {
  const students = await readTable('Students');
  const s = students.find((x) => x.id === id && x.teacherId === auth.id);
  if (!s) return bad('Сурагч олдсонгүй', 404);
  await deleteRows('Students', [s._row]);
  return ok({ deleted: true });
}

// ─────────────── Exams ───────────────

async function listExams(auth, classId) {
  const classes = await readTable('Classes');
  const c = classes.find((x) => x.id === classId && x.teacherId === auth.id);
  if (!c) return bad('Анги олдсонгүй', 404);
  const exams = await readTable('Exams');
  const list = exams
    .filter((e) => e.classId === classId)
    .map((e) => ({
      id: e.id,
      classId: e.classId,
      name: e.name,
      date: e.date,
      totalQuestions: Number(e.totalQuestions) || 0,
      createdAt: e.createdAt,
    }));
  list.sort((a, b) => (a.date < b.date ? 1 : -1));
  return ok({ exams: list });
}

async function addExam(auth, classId, body) {
  const classes = await readTable('Classes');
  const c = classes.find((x) => x.id === classId && x.teacherId === auth.id);
  if (!c) return bad('Анги олдсонгүй', 404);
  const exam = {
    id: randomUUID(),
    classId,
    teacherId: auth.id,
    name: String(body.name || '').trim() || 'Шалгалт',
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    totalQuestions: String(body.totalQuestions || 0),
    createdAt: new Date().toISOString(),
  };
  await appendRow('Exams', exam);
  return ok({ exam });
}

// ─────────────── Dashboard ───────────────

async function dashboard(auth) {
  const [classes, students, exams] = await Promise.all([
    readTable('Classes'),
    readTable('Students'),
    readTable('Exams'),
  ]);
  const myClasses = classes.filter((c) => c.teacherId === auth.id && c.archived !== 'true');
  const myClassIds = new Set(myClasses.map((c) => c.id));
  const myStudents = students.filter((s) => myClassIds.has(s.classId));
  const myExams = exams.filter((e) => myClassIds.has(e.classId));

  const perClass = myClasses.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    color: c.color,
    studentCount: myStudents.filter((s) => s.classId === c.id).length,
    examCount: myExams.filter((e) => e.classId === c.id).length,
  }));

  return ok({
    stats: {
      classes: myClasses.length,
      students: myStudents.length,
      exams: myExams.length,
    },
    perClass,
  });
}
