// ─────────────────────────────────────────────────────────────
//  Google Sheets өгөгдлийн давхарга (Data Access Layer)
//
//  Google Sheet-ийг хүснэгт (table) болгон ашиглана. Tab бүр нэг
//  "хүснэгт", эхний мөр нь баганын нэрс (headers) байна.
//
//  Шаардлагатай env: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY,
//  GOOGLE_SHEET_ID
// ─────────────────────────────────────────────────────────────

import { google } from 'googleapis';

// Tab бүрийн баганын тодорхойлолт (DB Schema).
export const SCHEMA = {
  Teachers: ['id', 'email', 'passwordHash', 'name', 'createdAt'],
  Classes: ['id', 'teacherId', 'name', 'subject', 'color', 'archived', 'createdAt'],
  Students: ['id', 'classId', 'teacherId', 'studentNumber', 'firstName', 'lastName', 'email', 'createdAt'],
  Exams: ['id', 'classId', 'teacherId', 'name', 'date', 'totalQuestions', 'createdAt'],
};

let _sheetsClient = null;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY || '';
  // .env дотор \n гэж бичсэн шинэ мөрийг бодит мөр болгоно.
  key = key.replace(/\\n/g, '\n');
  if (!email || !key) {
    throw new Error('Google service account тохиргоо дутуу байна (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY).');
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getClient() {
  if (_sheetsClient) return _sheetsClient;
  const auth = getAuth();
  await auth.authorize();
  _sheetsClient = google.sheets({ version: 'v4', auth });
  return _sheetsClient;
}

function sheetId() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEET_ID тохируулагдаагүй байна.');
  return id;
}

// Tab-уудыг (хэрэв байхгүй бол) баганын нэрстэйгээр үүсгэнэ.
export async function ensureTabs() {
  const sheets = await getClient();
  const spreadsheetId = sheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set((meta.data.sheets || []).map((s) => s.properties.title));

  const requests = [];
  for (const tab of Object.keys(SCHEMA)) {
    if (!existing.has(tab)) {
      requests.push({ addSheet: { properties: { title: tab } } });
    }
  }
  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  }
  // Баганын толгойг бичнэ (хоосон tab-уудад).
  for (const [tab, headers] of Object.entries(SCHEMA)) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!1:1`,
    });
    const row = (res.data.values && res.data.values[0]) || [];
    if (row.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tab}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }
  }
}

// Бүх мөрийг объект болгон уншина. Дотроос нь _row (sheet дэх мөрийн дугаар) нэмж өгнө.
export async function readTable(tab) {
  const sheets = await getClient();
  const headers = SCHEMA[tab];
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId(),
    range: `${tab}!A2:Z`,
  });
  const rows = res.data.values || [];
  return rows
    .map((r, i) => {
      const obj = { _row: i + 2 };
      headers.forEach((h, idx) => {
        obj[h] = r[idx] !== undefined ? r[idx] : '';
      });
      return obj;
    })
    .filter((o) => o.id); // хоосон мөрийг алгасна
}

export async function appendRow(tab, obj) {
  const sheets = await getClient();
  const headers = SCHEMA[tab];
  const values = [headers.map((h) => (obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : ''))];
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: `${tab}!A:Z`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
  return obj;
}

// Олон мөрийг нэг дуудлагаар нэмнэ (импортод хэрэгтэй).
export async function appendRows(tab, objs) {
  if (!objs.length) return [];
  const sheets = await getClient();
  const headers = SCHEMA[tab];
  const values = objs.map((obj) =>
    headers.map((h) => (obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : ''))
  );
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId(),
    range: `${tab}!A:Z`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
  return objs;
}

export async function updateRow(tab, rowNumber, obj) {
  const sheets = await getClient();
  const headers = SCHEMA[tab];
  const values = [headers.map((h) => (obj[h] !== undefined && obj[h] !== null ? String(obj[h]) : ''))];
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId(),
    range: `${tab}!A${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
  return obj;
}

// Мөрийг устгахын оронд бүх багануудыг хоослоно (мөрийн дугаар тогтвортой байлгахын тулд).
// Олон мөр устгахад мөрийн дугаар шилждэг тул жинхэнэ устгалыг batchUpdate-аар хийнэ.
export async function deleteRows(tab, rowNumbers) {
  if (!rowNumbers.length) return;
  const sheets = await getClient();
  const spreadsheetId = sheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetMeta = (meta.data.sheets || []).find((s) => s.properties.title === tab);
  if (!sheetMeta) return;
  const gid = sheetMeta.properties.sheetId;
  // Доороос дээш устгаж индекс шилжихээс сэргийлнэ.
  const sorted = [...rowNumbers].sort((a, b) => b - a);
  const requests = sorted.map((rowNumber) => ({
    deleteDimension: {
      range: {
        sheetId: gid,
        dimension: 'ROWS',
        startIndex: rowNumber - 1, // 0-based, мөн толгойн мөр оролцоно
        endIndex: rowNumber,
      },
    },
  }));
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
}
