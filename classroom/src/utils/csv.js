// ─────────────────────────────────────────────────────────────
//  CSV задлагч ба багана таних туслахууд.
//  Excel-ээс .csv болгон export хийсэн файл, эсвэл хуулсан текстийг
//  дэмжинэ. Толгойн нэрсээс багануудыг автоматаар таних оролдлого хийнэ.
// ─────────────────────────────────────────────────────────────

// Нэг мөрийг таслал/таб/цэг таслалаар салгана (хашилт доторх таслалыг хүндэтгэнэ).
function splitLine(line, delim) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function detectDelimiter(line) {
  if (line.includes('\t')) return '\t';
  if (line.includes(';') && !line.includes(',')) return ';';
  return ',';
}

// Толгойн нэрсээс багана таних.
const FIELD_ALIASES = {
  studentNumber: ['id', 'дугаар', 'код', 'number', 'студент', 'student id', 'studentid', 'нэвтрэх', 'роll', 'roll'],
  firstName: ['нэр', 'first', 'firstname', 'first name', 'given', 'ner'],
  lastName: ['овог', 'last', 'lastname', 'last name', 'family', 'surname', 'ovog'],
  email: ['и-мэйл', 'имэйл', 'мэйл', 'email', 'e-mail', 'mail'],
};

function mapHeader(h) {
  const low = h.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => low === a || low.includes(a))) return field;
  }
  return null;
}

// Текстийг задлаад { headers, rows, hasHeader } буцаана.
// rows нь { studentNumber, firstName, lastName, email } объектуудын массив.
export function parseCSV(text) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length);
  if (!lines.length) return { rows: [], headerMap: [], hasHeader: false };

  const delim = detectDelimiter(lines[0]);
  const firstCols = splitLine(lines[0], delim);

  // Эхний мөр толгой эсэхийг шалгана (танигдах талбар агуулж байвал толгой).
  const mapped = firstCols.map(mapHeader);
  const hasHeader = mapped.some((m) => m !== null);

  let headerMap;
  let dataLines;
  if (hasHeader) {
    headerMap = mapped;
    dataLines = lines.slice(1);
  } else {
    // Толгойгүй бол: 1 багана = нэр, 2 = овог нэр, 3+ = дугаар,нэр,овог,мэйл гэж таамаглана.
    const n = firstCols.length;
    if (n === 1) headerMap = ['firstName'];
    else if (n === 2) headerMap = ['firstName', 'lastName'];
    else if (n === 3) headerMap = ['studentNumber', 'firstName', 'lastName'];
    else headerMap = ['studentNumber', 'firstName', 'lastName', 'email'];
    dataLines = lines;
  }

  const rows = dataLines.map((line) => {
    const cols = splitLine(line, delim);
    const obj = { studentNumber: '', firstName: '', lastName: '', email: '' };
    headerMap.forEach((field, idx) => {
      if (field && cols[idx] !== undefined) obj[field] = cols[idx];
    });
    return obj;
  });

  return { rows: rows.filter((r) => r.firstName || r.lastName || r.studentNumber), headerMap, hasHeader };
}

// Сурагчдыг CSV болгон экспортлох.
export function studentsToCSV(students) {
  const header = ['studentNumber', 'firstName', 'lastName', 'email'];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')];
  for (const s of students) {
    lines.push([s.studentNumber, s.firstName, s.lastName, s.email].map(esc).join(','));
  }
  return lines.join('\n');
}
