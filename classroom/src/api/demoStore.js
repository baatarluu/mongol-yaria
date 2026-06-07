// ─────────────────────────────────────────────────────────────
//  Demo store — backend-гүйгээр localStorage дээр ажиллана.
//  Google Sheets backend-ийн логикийг тольдон давтсан тул UI ижил
//  ажиллана. Тохиргоо хийсний дараа VITE_USE_API=true болгоход
//  ижил интерфэйсээр бодит API руу шилжинэ.
// ─────────────────────────────────────────────────────────────

const KEY = 'classroom.demo.db';
const TOKEN_KEY = 'classroom.token';

function uid() {
  return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function load() {
  try {
    return { ...empty(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return empty();
  }
}
function empty() {
  return { teachers: [], classes: [], students: [], exams: [], results: [] };
}
function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

// Demo горимд токен = teacherId (хялбар). Бодит горимд JWT.
function currentTeacherId() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function requireAuth(db) {
  const id = currentTeacherId();
  const t = db.teachers.find((x) => x.id === id);
  if (!t) {
    const e = new Error('Нэвтрэх шаардлагатай');
    e.status = 401;
    throw e;
  }
  return t;
}

function fail(msg, status = 400) {
  const e = new Error(msg);
  e.status = status;
  throw e;
}

// Хялбар нууц үг хадгалалт (demo — энэ нь аюулгүй биш, зөвхөн локал туршилтад).
async function hash(s) {
  return 'demo$' + btoa(unescape(encodeURIComponent(s)));
}

function delay(v) {
  // Бодит сүлжээ шиг бага зэрэг саатуулна (UX-ийн loading төлвийг шалгахад).
  return new Promise((r) => setTimeout(() => r(v), 120));
}

export const demoApi = {
  async register({ email, password, name }) {
    const db = load();
    email = String(email || '').trim().toLowerCase();
    if (!email || !password) fail('И-мэйл болон нууц үг шаардлагатай');
    if (password.length < 6) fail('Нууц үг доод тал нь 6 тэмдэгт байх ёстой');
    if (db.teachers.some((t) => t.email === email)) fail('Энэ и-мэйл аль хэдийн бүртгэлтэй байна', 409);
    const teacher = {
      id: uid(),
      email,
      passwordHash: await hash(password),
      name: (name || '').trim() || email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    db.teachers.push(teacher);
    save(db);
    const safe = { id: teacher.id, email: teacher.email, name: teacher.name };
    return delay({ token: teacher.id, teacher: safe });
  },

  async login({ email, password }) {
    const db = load();
    email = String(email || '').trim().toLowerCase();
    const t = db.teachers.find((x) => x.email === email);
    if (!t || t.passwordHash !== (await hash(password))) fail('И-мэйл эсвэл нууц үг буруу', 401);
    const safe = { id: t.id, email: t.email, name: t.name };
    return delay({ token: t.id, teacher: safe });
  },

  async me() {
    const db = load();
    const t = requireAuth(db);
    return delay({ teacher: { id: t.id, email: t.email, name: t.name } });
  },

  async dashboard() {
    const db = load();
    const t = requireAuth(db);
    const myClasses = db.classes.filter((c) => c.teacherId === t.id && !c.archived);
    const ids = new Set(myClasses.map((c) => c.id));
    const myStudents = db.students.filter((s) => ids.has(s.classId));
    const myExams = db.exams.filter((e) => ids.has(e.classId));
    const myResults = db.results.filter((r) => r.teacherId === t.id);
    return delay({
      stats: { classes: myClasses.length, students: myStudents.length, exams: myExams.length, results: myResults.length },
      perClass: myClasses.map((c) => ({
        id: c.id,
        name: c.name,
        subject: c.subject,
        color: c.color,
        studentCount: myStudents.filter((s) => s.classId === c.id).length,
        examCount: myExams.filter((e) => e.classId === c.id).length,
      })),
    });
  },

  async listClasses() {
    const db = load();
    const t = requireAuth(db);
    const list = db.classes
      .filter((c) => c.teacherId === t.id && !c.archived)
      .map((c) => ({
        ...c,
        studentCount: db.students.filter((s) => s.classId === c.id).length,
        examCount: db.exams.filter((e) => e.classId === c.id).length,
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return delay({ classes: list });
  },

  async getClass(id) {
    const db = load();
    const t = requireAuth(db);
    const c = db.classes.find((x) => x.id === id && x.teacherId === t.id);
    if (!c) fail('Анги олдсонгүй', 404);
    return delay({ class: c });
  },

  async createClass({ name, subject, color }) {
    const db = load();
    const t = requireAuth(db);
    if (!String(name || '').trim()) fail('Ангийн нэр шаардлагатай');
    const cls = {
      id: uid(),
      teacherId: t.id,
      name: name.trim(),
      subject: (subject || '').trim(),
      color: color || '#3477ff',
      archived: false,
      createdAt: new Date().toISOString(),
    };
    db.classes.push(cls);
    save(db);
    return delay({ class: { ...cls, studentCount: 0, examCount: 0 } });
  },

  async updateClass(id, body) {
    const db = load();
    const t = requireAuth(db);
    const c = db.classes.find((x) => x.id === id && x.teacherId === t.id);
    if (!c) fail('Анги олдсонгүй', 404);
    if (body.name !== undefined) c.name = String(body.name).trim();
    if (body.subject !== undefined) c.subject = String(body.subject).trim();
    if (body.color !== undefined) c.color = body.color;
    save(db);
    return delay({ class: c });
  },

  async deleteClass(id) {
    const db = load();
    const t = requireAuth(db);
    const c = db.classes.find((x) => x.id === id && x.teacherId === t.id);
    if (!c) fail('Анги олдсонгүй', 404);
    db.classes = db.classes.filter((x) => x.id !== id);
    db.students = db.students.filter((s) => s.classId !== id);
    db.exams = db.exams.filter((e) => e.classId !== id);
    save(db);
    return delay({ deleted: true });
  },

  async listStudents(classId, q) {
    const db = load();
    const t = requireAuth(db);
    const c = db.classes.find((x) => x.id === classId && x.teacherId === t.id);
    if (!c) fail('Анги олдсонгүй', 404);
    const needle = (q || '').toLowerCase();
    const list = db.students
      .filter((s) => s.classId === classId)
      .filter(
        (s) =>
          !needle ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(needle) ||
          String(s.studentNumber || '').toLowerCase().includes(needle) ||
          String(s.email || '').toLowerCase().includes(needle)
      )
      .sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
    return delay({ students: list });
  },

  async addStudent(classId, body) {
    const db = load();
    const t = requireAuth(db);
    const c = db.classes.find((x) => x.id === classId && x.teacherId === t.id);
    if (!c) fail('Анги олдсонгүй', 404);
    const first = String(body.firstName || '').trim();
    const last = String(body.lastName || '').trim();
    if (!first && !last) fail('Сурагчийн нэр шаардлагатай');
    const student = {
      id: uid(),
      classId,
      teacherId: t.id,
      studentNumber: String(body.studentNumber || '').trim(),
      firstName: first,
      lastName: last,
      email: String(body.email || '').trim(),
      createdAt: new Date().toISOString(),
    };
    db.students.push(student);
    save(db);
    return delay({ student });
  },

  async importStudents(classId, students) {
    const db = load();
    const t = requireAuth(db);
    const c = db.classes.find((x) => x.id === classId && x.teacherId === t.id);
    if (!c) fail('Анги олдсонгүй', 404);
    const now = new Date().toISOString();
    const prepared = (students || [])
      .map((r) => ({
        id: uid(),
        classId,
        teacherId: t.id,
        studentNumber: String(r.studentNumber || '').trim(),
        firstName: String(r.firstName || '').trim(),
        lastName: String(r.lastName || '').trim(),
        email: String(r.email || '').trim(),
        createdAt: now,
      }))
      .filter((s) => s.firstName || s.lastName || s.studentNumber);
    db.students.push(...prepared);
    save(db);
    return delay({ imported: prepared.length, students: prepared });
  },

  async updateStudent(id, body) {
    const db = load();
    const t = requireAuth(db);
    const s = db.students.find((x) => x.id === id && x.teacherId === t.id);
    if (!s) fail('Сурагч олдсонгүй', 404);
    for (const k of ['studentNumber', 'firstName', 'lastName', 'email']) {
      if (body[k] !== undefined) s[k] = String(body[k]).trim();
    }
    save(db);
    return delay({ student: s });
  },

  async deleteStudent(id) {
    const db = load();
    const t = requireAuth(db);
    const s = db.students.find((x) => x.id === id && x.teacherId === t.id);
    if (!s) fail('Сурагч олдсонгүй', 404);
    db.students = db.students.filter((x) => x.id !== id);
    save(db);
    return delay({ deleted: true });
  },

  async listExams(classId) {
    const db = load();
    const t = requireAuth(db);
    const c = db.classes.find((x) => x.id === classId && x.teacherId === t.id);
    if (!c) fail('Анги олдсонгүй', 404);
    const list = db.exams
      .filter((e) => e.classId === classId)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return delay({ exams: list });
  },

  async addExam(classId, body) {
    const db = load();
    const t = requireAuth(db);
    const c = db.classes.find((x) => x.id === classId && x.teacherId === t.id);
    if (!c) fail('Анги олдсонгүй', 404);
    const exam = {
      id: uid(),
      classId,
      teacherId: t.id,
      name: String(body.name || '').trim() || 'Шалгалт',
      date: String(body.date || new Date().toISOString().slice(0, 10)),
      totalQuestions: Number(body.totalQuestions) || 0,
      choices: Number(body.choices) || 4,
      idDigits: body.idDigits !== undefined ? Number(body.idDigits) : 5,
      answerKey: Array.isArray(body.answerKey) ? body.answerKey : [],
      createdAt: new Date().toISOString(),
    };
    db.exams.push(exam);
    save(db);
    return delay({ exam });
  },

  async getExam(examId) {
    const db = load();
    const t = requireAuth(db);
    const e = db.exams.find((x) => x.id === examId && x.teacherId === t.id);
    if (!e) fail('Шалгалт олдсонгүй', 404);
    return delay({ exam: e });
  },

  async updateExam(examId, body) {
    const db = load();
    const t = requireAuth(db);
    const e = db.exams.find((x) => x.id === examId && x.teacherId === t.id);
    if (!e) fail('Шалгалт олдсонгүй', 404);
    if (body.name !== undefined) e.name = String(body.name).trim();
    if (body.date !== undefined) e.date = String(body.date);
    if (body.totalQuestions !== undefined) e.totalQuestions = Number(body.totalQuestions) || 0;
    if (body.choices !== undefined) e.choices = Number(body.choices) || 4;
    if (body.idDigits !== undefined) e.idDigits = Number(body.idDigits);
    if (body.answerKey !== undefined) e.answerKey = Array.isArray(body.answerKey) ? body.answerKey : [];
    save(db);
    return delay({ exam: e });
  },

  async listResults(examId) {
    const db = load();
    const t = requireAuth(db);
    const list = db.results
      .filter((r) => r.examId === examId && r.teacherId === t.id)
      .sort((a, b) => (a.scannedAt < b.scannedAt ? 1 : -1));
    return delay({ results: list });
  },

  async addResult(examId, body) {
    const db = load();
    const t = requireAuth(db);
    const e = db.exams.find((x) => x.id === examId && x.teacherId === t.id);
    if (!e) fail('Шалгалт олдсонгүй', 404);
    const result = {
      id: uid(),
      examId,
      classId: e.classId,
      teacherId: t.id,
      studentId: body.studentId || '',
      studentNumber: String(body.studentNumber || '').trim(),
      studentName: String(body.studentName || '').trim(),
      score: Number(body.score) || 0,
      total: Number(body.total) || 0,
      answers: Array.isArray(body.answers) ? body.answers : [],
      scannedAt: new Date().toISOString(),
    };
    // Нэг сурагчийн өмнөх дүнг шинэчилнэ (давхардуулахгүй).
    if (result.studentNumber) {
      db.results = db.results.filter(
        (r) => !(r.examId === examId && r.studentNumber === result.studentNumber)
      );
    }
    db.results.push(result);
    save(db);
    return delay({ result });
  },

  async deleteResult(id) {
    const db = load();
    const t = requireAuth(db);
    const r = db.results.find((x) => x.id === id && x.teacherId === t.id);
    if (!r) fail('Дүн олдсонгүй', 404);
    db.results = db.results.filter((x) => x.id !== id);
    save(db);
    return delay({ deleted: true });
  },
};
