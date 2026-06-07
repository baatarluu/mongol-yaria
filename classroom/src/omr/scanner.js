// ─────────────────────────────────────────────────────────────
//  OMR scanner — хариултын хуудасны зургаас тэмдэглэгээг уншина.
//
//  Цөм нь саарал өнгийн Uint8Array (1 байт/пиксел) дээр ажилладаг тул
//  браузергүйгээр (node) тестлэх боломжтой. Браузерт imageToGray()
//  нь canvas-аар зургийг саарал болгож өгнө.
//
//  Алхамууд:
//   1) Otsu босго → хоёртын зураг
//   2) 4 булангийн тэмдэг (fiducial)-ийг олох
//   3) Темплэйт → зураг руу homography (хэтийн зураг засвар)
//   4) Бөмбөлөг бүрийн харанхуйг хэмжиж тэмдэглэгээг тайлах
// ─────────────────────────────────────────────────────────────

// ── Otsu босго ──
export function otsuThreshold(gray) {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, max = 0, thr = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > max) {
      max = between;
      thr = t;
    }
  }
  return thr;
}

// ── Холбоост бүрэлдэхүүн (flood fill) хайх — өгсөн цонхон дотор ──
function findComponents(gray, w, h, thr, x0, y0, x1, y1) {
  const seen = new Uint8Array(w * h);
  const comps = [];
  const stack = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const idx = y * w + x;
      if (seen[idx] || gray[idx] > thr) continue;
      // шинэ бүрэлдэхүүн
      let area = 0, sx = 0, sy = 0;
      let minx = x, maxx = x, miny = y, maxy = y;
      stack.length = 0;
      stack.push(idx);
      seen[idx] = 1;
      while (stack.length) {
        const p = stack.pop();
        const px = p % w, py = (p / w) | 0;
        area++;
        sx += px; sy += py;
        if (px < minx) minx = px;
        if (px > maxx) maxx = px;
        if (py < miny) miny = py;
        if (py > maxy) maxy = py;
        // 4 хөрш (цонхны хязгаарт)
        if (px > x0 && !seen[p - 1] && gray[p - 1] <= thr) { seen[p - 1] = 1; stack.push(p - 1); }
        if (px < x1 - 1 && !seen[p + 1] && gray[p + 1] <= thr) { seen[p + 1] = 1; stack.push(p + 1); }
        if (py > y0 && !seen[p - w] && gray[p - w] <= thr) { seen[p - w] = 1; stack.push(p - w); }
        if (py < y1 - 1 && !seen[p + w] && gray[p + w] <= thr) { seen[p + w] = 1; stack.push(p + w); }
      }
      comps.push({ area, cx: sx / area, cy: sy / area, minx, maxx, miny, maxy });
    }
  }
  return comps;
}

// ── 4 булангийн тэмдгийг олох ──
// corner: 0=TL,1=TR,2=BL,3=BR — тухайн булан руу хамгийн ойр, дөрвөлжин
// хэлбэртэй, хангалттай том blob-ийг сонгоно.
function detectFiducials(gray, w, h, thr) {
  const winW = Math.floor(w * 0.24);
  const winH = Math.floor(h * 0.2);
  const corners = [
    { name: 'TL', x0: 0, y0: 0, x1: winW, y1: winH, ax: 0, ay: 0 },
    { name: 'TR', x0: w - winW, y0: 0, x1: w, y1: winH, ax: w, ay: 0 },
    { name: 'BL', x0: 0, y0: h - winH, x1: winW, y1: h, ax: 0, ay: h },
    { name: 'BR', x0: w - winW, y0: h - winH, x1: w, y1: h, ax: w, ay: h },
  ];
  const minArea = (w * h) * 0.00015;
  const out = [];
  for (const c of corners) {
    const comps = findComponents(gray, w, h, thr, c.x0, c.y0, c.x1, c.y1);
    let best = null, bestScore = Infinity;
    for (const k of comps) {
      if (k.area < minArea) continue;
      const bw = k.maxx - k.minx + 1;
      const bh = k.maxy - k.miny + 1;
      const aspect = bw / Math.max(1, bh);
      if (aspect < 0.4 || aspect > 2.6) continue; // дөрвөлжин орчим
      const dist = Math.hypot(k.cx - c.ax, k.cy - c.ay); // буланд ойр
      if (dist < bestScore) {
        bestScore = dist;
        best = k;
      }
    }
    if (!best) return null;
    out.push({ x: best.cx, y: best.cy });
  }
  return out; // [TL,TR,BL,BR]
}

// ── Homography (DLT, 4 цэг) src→dst ──
function solveLinear(A, b, n) {
  // Гауссын аргаар A·x = b бодно.
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (Math.abs(A[piv][col]) < 1e-12) return null;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let cc = col; cc < n; cc++) A[r][cc] -= f * A[col][cc];
      b[r] -= f * b[col];
    }
  }
  const x = new Array(n);
  for (let i = 0; i < n; i++) x[i] = b[i] / A[i][i];
  return x;
}

export function buildHomography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i];
    const { x: u, y: v } = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  }
  const hs = solveLinear(A, b, 8);
  if (!hs) return null;
  return [hs[0], hs[1], hs[2], hs[3], hs[4], hs[5], hs[6], hs[7], 1];
}

export function applyH(H, x, y) {
  const d = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / d, (H[3] * x + H[4] * y + H[5]) / d];
}

// ── Бөмбөлгийн харанхуйг хэмжих (0=цагаан, 1=бүрэн харанхуй) ──
function sampleDarkness(gray, w, h, cx, cy, rad, thr) {
  let dark = 0, tot = 0;
  const r = Math.max(2, Math.round(rad));
  const x0 = Math.max(0, Math.round(cx - r)), x1 = Math.min(w - 1, Math.round(cx + r));
  const y0 = Math.max(0, Math.round(cy - r)), y1 = Math.min(h - 1, Math.round(cy + r));
  const r2 = r * r;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      tot++;
      if (gray[y * w + x] <= thr) dark++;
    }
  }
  return tot ? dark / tot : 0;
}

// ── Үндсэн уншигч ──
// layout: buildLayout()-ийн үр дүн.
// Буцаах: { ok, answers:[idx|null], idString, fiducials, fill: {fillThreshold} }
export function readSheet(gray, w, h, layout, opts = {}) {
  const fillThreshold = opts.fillThreshold ?? 0.45;
  const margin = opts.margin ?? 0.15; // ялгах зөрүү
  const thr = opts.threshold ?? otsuThreshold(gray);

  const fid = detectFiducials(gray, w, h, thr);
  if (!fid) return { ok: false, error: 'Булангийн 4 тэмдгийг олж чадсангүй. Гэрэлтүүлэг, өнцгөө тохируулна уу.' };

  const srcFid = layout.fiducials.map((f) => ({ x: f.cx, y: f.cy }));
  const H = buildHomography(srcFid, fid);
  if (!H) return { ok: false, error: 'Зургийн геометрийг тооцоолж чадсангүй.' };

  // Масштабыг тэмдгүүдийн зайгаар тооцоод бөмбөлгийн радиусыг хувиргана.
  const tplWidth = Math.hypot(srcFid[1].x - srcFid[0].x, srcFid[1].y - srcFid[0].y);
  const imgWidth = Math.hypot(fid[1].x - fid[0].x, fid[1].y - fid[0].y);
  const scale = imgWidth / tplWidth;

  const darknessAt = (b) => {
    const [ix, iy] = applyH(H, b.cx, b.cy);
    return sampleDarkness(gray, w, h, ix, iy, b.r * scale * 0.8, thr);
  };

  // ── Хариултууд ──
  const byQ = new Map();
  for (const b of layout.answerBubbles) {
    if (!byQ.has(b.q)) byQ.set(b.q, []);
    byQ.get(b.q).push(b);
  }
  const answers = new Array(layout.questions).fill(null);
  for (const [q, bubbles] of byQ) {
    bubbles.sort((a, b) => a.choice - b.choice);
    const ds = bubbles.map(darknessAt);
    let max = -1, maxI = -1, second = -1;
    ds.forEach((d, i) => {
      if (d > max) { second = max; max = d; maxI = i; }
      else if (d > second) second = d;
    });
    if (max >= fillThreshold && max - second >= margin) answers[q] = maxI;
    else answers[q] = null; // хоосон эсвэл олон тэмдэглэсэн
  }

  // ── Сурагчийн ID ──
  let idString = '';
  if (layout.idDigits > 0) {
    const byCol = new Map();
    for (const b of layout.idBubbles) {
      if (!byCol.has(b.col)) byCol.set(b.col, []);
      byCol.get(b.col).push(b);
    }
    for (let c = 0; c < layout.idDigits; c++) {
      const bubbles = byCol.get(c).sort((a, b) => a.digit - b.digit);
      const ds = bubbles.map(darknessAt);
      let max = -1, maxI = -1, second = -1;
      ds.forEach((d, i) => {
        if (d > max) { second = max; max = d; maxI = i; }
        else if (d > second) second = d;
      });
      idString += max >= fillThreshold && max - second >= margin ? String(maxI) : '';
    }
  }

  return { ok: true, answers, idString, fiducials: fid, threshold: thr, scale };
}

// ── Браузер туслах: зургийн эх сурвалжийг саарал болгох ──
export async function imageToGray(source, maxW = 1000) {
  let bitmap;
  if (source instanceof HTMLCanvasElement) {
    const ctx = source.getContext('2d');
    return canvasToGray(source, ctx);
  }
  if (source instanceof Blob) bitmap = await createImageBitmap(source);
  else if (source instanceof HTMLVideoElement) bitmap = source;
  else if (source instanceof HTMLImageElement) bitmap = source;
  else bitmap = source;

  const sw = bitmap.videoWidth || bitmap.width;
  const sh = bitmap.videoHeight || bitmap.height;
  const scale = Math.min(1, maxW / sw);
  const w = Math.round(sw * scale);
  const h = Math.round(sh * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvasToGray(canvas, ctx);
}

function canvasToGray(canvas, ctx) {
  const { width: w, height: h } = canvas;
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    // луминанс
    gray[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
  }
  return { gray, width: w, height: h };
}
