// ─────────────────────────────────────────────────────────────
//  API client — нэг интерфэйс, хоёр горим:
//   1) Бодит горим:  VITE_USE_API=true  → serverless /api/* руу fetch
//   2) Demo горим:   тохиргоогүй үед    → localStorage дээр ажиллана
//
//  Хоёулаа ижил методуудтай тул UI код горимоос хамаарахгүй.
// ─────────────────────────────────────────────────────────────

import { demoApi } from './demoStore.js';

const USE_API = import.meta.env.VITE_USE_API === 'true';
const BASE = import.meta.env.VITE_API_BASE || '';

const TOKEN_KEY = 'classroom.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch амжаагүй = сүлжээ алга (офлайн). Дараа дахин оролдоно.
    const err = new Error('Сүлжээ алга байна (офлайн).');
    err.offline = true;
    throw err;
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* хоосон хариу */
  }
  if (!res.ok) {
    const err = new Error(data.error || `Алдаа (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ── GET хүсэлтийн read-through кэш ──
// Амжилттай хариуг localStorage-д хадгалж, офлайн үед сүүлийн утгыг буцаана.
const cacheKey = (path) => 'classroom.cache.' + path;
function writeCache(path, data) {
  try {
    localStorage.setItem(cacheKey(path), JSON.stringify(data));
  } catch {
    /* квот дүүрсэн ч алдаа шиддэггүй */
  }
}
function readCache(path) {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(path)));
  } catch {
    return null;
  }
}
async function cachedGet(path) {
  try {
    const data = await request('GET', path);
    writeCache(path, data);
    return data;
  } catch (e) {
    if (e.offline) {
      const cached = readCache(path);
      if (cached) return { ...cached, _cached: true };
    }
    throw e;
  }
}

// Бодит API руу холбогдох хувилбар (GET-үүд офлайнд кэшнээс уншина).
const realApi = {
  register: (b) => request('POST', '/auth/register', b),
  login: (b) => request('POST', '/auth/login', b),
  me: () => cachedGet('/me'),
  dashboard: () => cachedGet('/dashboard'),

  listClasses: () => cachedGet('/classes'),
  createClass: (b) => request('POST', '/classes', b),
  updateClass: (id, b) => request('PATCH', `/classes/${id}`, b),
  deleteClass: (id) => request('DELETE', `/classes/${id}`),
  getClass: (id) => cachedGet(`/classes/${id}`),

  listStudents: (classId, q) =>
    cachedGet(`/classes/${classId}/students${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  addStudent: (classId, b) => request('POST', `/classes/${classId}/students`, b),
  importStudents: (classId, students) =>
    request('POST', `/classes/${classId}/students/import`, { students }),
  updateStudent: (id, b) => request('PATCH', `/students/${id}`, b),
  deleteStudent: (id) => request('DELETE', `/students/${id}`),

  listExams: (classId) => cachedGet(`/classes/${classId}/exams`),
  addExam: (classId, b) => request('POST', `/classes/${classId}/exams`, b),
  getExam: (examId) => cachedGet(`/exams/${examId}`),
  updateExam: (examId, b) => request('PATCH', `/exams/${examId}`, b),

  listResults: (examId) => cachedGet(`/exams/${examId}/results`),
  addResult: (examId, b) => request('POST', `/exams/${examId}/results`, b),
  deleteResult: (id) => request('DELETE', `/results/${id}`),
};

// Горимыг сонгоно.
export const api = USE_API ? realApi : demoApi;
export const IS_DEMO = !USE_API;
