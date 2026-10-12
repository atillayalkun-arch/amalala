// ===== Çekirdek: token'lar, easing, zaman yardımcıları, çizim primitifleri =====
const W = 1920, H = 1080, TAU = Math.PI * 2;

const T = {
  ink: '#2A1E17', cream: '#F4E9D8', paper: '#EFE2C8', paperDark: '#D9C7A4',
  berry: '#D7263D', berryHi: '#FF7A88', berryDark: '#8E1424',
  gold: '#E8A33D', goldHi: '#FFD27A',
  leaf: '#4F7A34', leafDark: '#2F4E22', leafHi: '#6E9A45',
  hillFar: '#B7B98A', hillMid: '#8FA05C', hillNear: '#6B843D', hillDeep: '#4E6630',
  skin: '#7A4A2A', skinDark: '#5E3720', hair: '#1E120C',
  cloth: '#EDE3CF', clothShade: '#CFC2A8',
  goatW: '#F1ECE2', goatB: '#3B2C24', goatBr: '#9A6B43', horn: '#6B5A48',
  stone: '#B9A58A', stoneDark: '#8C7A62', stoneDeep: '#5E5040',
  robe: '#5B3A29', robeHi: '#7A5038', capW: '#EFE8DA',
  fire1: '#FFD27A', fire2: '#FFB238', fire3: '#F2542D',
  aroma: '#E8C9A0', bean: '#4A2C1A', beanMid: '#7A4524',
  mud: '#A86F43', mudDark: '#83522F', thatch: '#C9A25A', thatchDark: '#9C7A3C',
  devil: '#3D1F4A',
  lw: 4,
  serif: 'Georgia, "Times New Roman", serif',
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

// --- Easing ---
const E = {
  lin: (x: number) => x,
  inOut: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  in: (x: number) => x * x * x,
  back: (x: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  elastic: (x: number) => (x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1),
  expo: (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  sine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
};
type Ease = (x: number) => number;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** start'tan itibaren dur süresinde 0→1 ilerleme */
const P = (t: number, start: number, dur: number, ease: Ease = E.inOut) => ease(clamp((t - start) / dur));
/** giriş ve çıkışı olan görünürlük zarfı */
const env = (t: number, a: number, b: number, fade = 0.4) => P(t, a, fade, E.out) * (1 - P(t, b - fade, fade, E.in));

function kf(t: number, keys: [number, number][], ease: Ease = E.inOut): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
}

interface Cam { x: number; y: number; z: number; r: number }
function kcam(t: number, keys: [number, Cam][], ease: Ease = E.inOut): Cam {
  const pick = (k: keyof Cam) => kf(t, keys.map(([tt, c]) => [tt, c[k]] as [number, number]), ease);
  return { x: pick('x'), y: pick('y'), z: pick('z'), r: pick('r') };
}
const C = (x: number, y: number, z = 1, r = 0): Cam => ({ x, y, z, r });

// --- Renk ---
function hex2rgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, k: number): string {
  const A = hex2rgb(a), B = hex2rgb(b); k = clamp(k);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], k)));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
function rgba(h: string, a: number) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }

// --- Deterministik rastgele ---
function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// --- Aktif bağlam ---
let X: CanvasRenderingContext2D;
let CUR_CAM: Cam = C(960, 540);

function applyCam(c: Cam, shake = 0, seed = 0) {
  CUR_CAM = c;
  let sx = 0, sy = 0;
  if (shake > 0) { sx = Math.sin(seed * 91.7) * shake; sy = Math.cos(seed * 77.3) * shake; }
  X.translate(W / 2 + sx, H / 2 + sy);
  X.rotate(c.r);
  X.scale(c.z, c.z);
  X.translate(-c.x, -c.y);
}

// --- Primitifler ---
function fs(fill?: string | null, stroke?: string | null, lw = T.lw) {
  if (fill) { X.fillStyle = fill; X.fill(); }
  if (stroke) { X.lineWidth = lw; X.strokeStyle = stroke; X.lineJoin = 'round'; X.lineCap = 'round'; X.stroke(); }
}
function circ(x: number, y: number, r: number, f?: string | null, s?: string | null, lw?: number) {
  if (r <= 0) return; X.beginPath(); X.arc(x, y, r, 0, TAU); fs(f, s, lw);
}
function ell(x: number, y: number, rx: number, ry: number, rot: number, f?: string | null, s?: string | null, lw?: number) {
  if (rx <= 0 || ry <= 0) return; X.beginPath(); X.ellipse(x, y, rx, ry, rot, 0, TAU); fs(f, s, lw);
}
function poly(pts: number[], f?: string | null, s?: string | null, lw?: number, close = true) {
  X.beginPath(); X.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) X.lineTo(pts[i], pts[i + 1]);
  if (close) X.closePath(); fs(f, s, lw);
}
function line(x1: number, y1: number, x2: number, y2: number, s: string, lw = T.lw) {
  X.beginPath(); X.moveTo(x1, y1); X.lineTo(x2, y2); fs(null, s, lw);
}
function rrect(x: number, y: number, w: number, h: number, r: number, f?: string | null, s?: string | null, lw?: number) {
  X.beginPath(); X.roundRect(x, y, w, h, r); fs(f, s, lw);
}
/** Yumuşak eğri: noktalar arasından quadratic geçer */
function smooth(pts: number[], f?: string | null, s?: string | null, lw?: number, close = false) {
  X.beginPath(); X.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length - 2; i += 2) {
    const mx = (pts[i] + pts[i + 2]) / 2, my = (pts[i + 1] + pts[i + 3]) / 2;
    X.quadraticCurveTo(pts[i], pts[i + 1], mx, my);
  }
  X.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
  if (close) X.closePath(); fs(f, s, lw);
}
function alpha(a: number, fn: () => void) {
  if (a <= 0.001) return; X.save(); X.globalAlpha *= clamp(a); fn(); X.restore();
}
function at(x: number, y: number, s: number, rot: number, fn: () => void) {
  X.save(); X.translate(x, y); if (rot) X.rotate(rot); if (s !== 1) X.scale(s, s); fn(); X.restore();
}
interface TxtOpt { font?: string; align?: CanvasTextAlign; weight?: string; base?: CanvasTextBaseline; spacing?: number; italic?: boolean; shadow?: boolean }
function txt(str: string, x: number, y: number, size: number, color: string, o: TxtOpt = {}) {
  X.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 'normal'} ${size}px ${o.font ?? T.sans}`;
  X.textAlign = o.align ?? 'center'; X.textBaseline = o.base ?? 'middle';
  (X as any).letterSpacing = (o.spacing ?? 0) + 'px';
  if (o.shadow) { X.shadowColor = 'rgba(0,0,0,0.45)'; X.shadowBlur = 12; X.shadowOffsetY = 3; }
  X.fillStyle = color; X.fillText(str, x, y);
  X.shadowColor = 'transparent'; X.shadowBlur = 0; X.shadowOffsetY = 0;
  (X as any).letterSpacing = '0px';
}
function dashed(fn: () => void, dash = [14, 12], offset = 0) {
  X.save(); X.setLineDash(dash); X.lineDashOffset = offset; fn(); X.restore();
}

// ===== Belgesel grafik elemanları =====

/** Alt bant etiketi (lower-third): çizgi uzar, metin maskeden kayar */
function tag(x: number, y: number, title: string, sub: string, k: number, color = T.gold, dark = false, k2 = k) {
  if (k <= 0) return;
  const lw = 340 * E.out(clamp(k * 1.6));
  const tk = E.out(clamp((k - 0.25) / 0.75));
  X.save();
  line(x, y, x + lw, y, color, 5);
  X.beginPath(); X.rect(x - 10, y - 90, 700, 88); X.clip();
  txt(title, x, y - 34 + (1 - tk) * 60, 52, dark ? T.ink : T.cream, { align: 'left', weight: 'bold', spacing: 6, font: T.serif, shadow: !dark });
  X.restore();
  X.save();
  X.beginPath(); X.rect(x - 10, y + 2, 700, 60); X.clip();
  const sk = E.out(clamp((k2 - 0.25) / 0.75));
  txt(sub, x, y + 28 - (1 - sk) * 50, 28, dark ? T.ink : color, { align: 'left', spacing: 3, shadow: !dark });
  X.restore();
}
/** Küçük rozet (chip) */
function chip(x: number, y: number, label: string, k: number, bg = T.gold, fg = T.ink) {
  if (k <= 0) return;
  const s = E.back(clamp(k));
  at(x, y, s, 0, () => {
    X.font = `bold 30px ${T.sans}`; const w = X.measureText(label).width + 44;
    rrect(-w / 2, -26, w, 52, 26, bg);
    txt(label, 0, 1, 30, fg, { weight: 'bold' });
  });
}
/** Ok + etiket (bilgi işaretçisi) */
function pointer(x1: number, y1: number, x2: number, y2: number, label: string, k: number, color = T.cream, size = 30) {
  if (k <= 0) return;
  const e = E.out(clamp(k));
  const ex = lerp(x1, x2, e), ey = lerp(y1, y2, e);
  line(x1, y1, ex, ey, color, 3);
  circ(x1, y1, 6, color);
  alpha(clamp((k - 0.5) * 2), () => {
    const dx = x2 - x1;
    txt(label, x2 + (dx >= 0 ? 14 : -14), y2, size, color, { align: dx >= 0 ? 'left' : 'right', weight: 'bold', shadow: true });
  });
}
/** Ses halkaları */
function soundRings(x: number, y: number, t: number, k: number, color = T.cream, wobble = 0, dir = 0, spread = 1.2) {
  if (k <= 0) return;
  for (let i = 0; i < 4; i++) {
    const ph = ((t * 1.1 + i / 4) % 1);
    const r = 30 + ph * 220;
    X.save(); X.globalAlpha *= (1 - ph) * k;
    X.beginPath();
    for (let a = -spread; a <= spread; a += 0.05) {
      const rr = r + Math.sin(a * 12 + t * 14 + i) * wobble * (0.4 + ph);
      const px = x + Math.cos(a + dir) * rr, py = y + Math.sin(a + dir) * rr;
      a === -spread ? X.moveTo(px, py) : X.lineTo(px, py);
    }
    fs(null, color, 6);
    X.restore();
  }
}
function note(x: number, y: number, s: number, color: string, double = false) {
  at(x, y, s, 0, () => {
    ell(0, 0, 14, 10, -0.4, color);
    line(12, -2, 12, -56, color, 5);
    if (double) { ell(40, -8, 14, 10, -0.4, color); line(52, -10, 52, -62, color, 5); poly([12, -56, 52, -62, 52, -50, 12, -44], color); }
    else smooth([12, -56, 30, -44, 34, -24], null, color, 5);
  });
}
function sparkle(x: number, y: number, r: number, rot: number, color: string) {
  at(x, y, 1, rot, () => {
    X.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 === 0 ? r : r * 0.22, a = (i / 8) * TAU;
      i === 0 ? X.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : X.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    X.closePath(); fs(color);
  });
}
function glow(x: number, y: number, r: number, color: string, a = 1) {
  if (r <= 0 || a <= 0) return;
  const g = X.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, 0.9 * a)); g.addColorStop(0.4, rgba(color, 0.35 * a)); g.addColorStop(1, rgba(color, 0));
  X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, TAU); X.fill();
}
function bang(x: number, y: number, s: number, color = T.gold) {
  at(x, y, s, 0, () => {
    poly([-10, -70, 10, -70, 6, -10, -6, -10], color);
    circ(0, 12, 9, color);
  });
}
function qmark(x: number, y: number, s: number, color = T.cream, rot = 0) {
  at(x, y, s, rot, () => txt('?', 0, 0, 80, color, { weight: 'bold', font: T.serif, shadow: true }));
}
/** Düşünce balonu */
function thought(x: number, y: number, r: number, k: number, fromX: number, fromY: number, fill = T.cream) {
  if (k <= 0) return;
  const s = E.back(clamp(k));
  for (let i = 0; i < 3; i++) {
    const kk = E.back(clamp(k * 3 - i * 0.4));
    const f = (i + 1) / 4;
    circ(lerp(fromX, x, f * 0.8), lerp(fromY, y + r * 0.7, f * 0.8), (8 + i * 7) * kk, fill);
  }
  at(x, y, s, 0, () => {
    X.beginPath();
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      X.moveTo(Math.cos(a) * r * 0.82 + r * 0.25, Math.sin(a) * r * 0.62);
      X.arc(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.62, r * 0.32, 0, TAU);
    }
    fs(fill);
    ell(0, 0, r * 0.85, r * 0.62, 0, fill);
  });
}
/** Saat ikonu */
function clock(x: number, y: number, r: number, minute: number, k: number) {
  if (k <= 0) return;
  at(x, y, E.back(clamp(k)), 0, () => {
    circ(0, 0, r + 14, T.gold);
    circ(0, 0, r, T.cream);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      line(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94, T.ink, i % 3 === 0 ? 8 : 4);
    }
    const am = minute * TAU - Math.PI / 2, ah = (minute / 12) * TAU - Math.PI / 2 + 0.9;
    line(0, 0, Math.cos(ah) * r * 0.5, Math.sin(ah) * r * 0.5, T.ink, 12);
    line(0, 0, Math.cos(am) * r * 0.78, Math.sin(am) * r * 0.78, T.ink, 7);
    // geçen süre dilimi
    X.beginPath(); X.moveTo(0, 0); X.arc(0, 0, r * 0.7, -Math.PI / 2, -Math.PI / 2 + (minute % 1) * TAU); X.closePath();
    fs(rgba(T.gold, 0.35));
    circ(0, 0, 10, T.berryDark);
  });
}
/** Enerji pili */
function battery(x: number, y: number, s: number, level: number, k: number) {
  if (k <= 0) return;
  at(x, y, s * E.back(clamp(k)), 0, () => {
    rrect(-80, -38, 160, 76, 14, T.ink, T.cream, 6);
    rrect(82, -14, 14, 28, 4, T.cream);
    const col = level < 0.3 ? '#C9772E' : level < 0.7 ? T.gold : '#9BC45A';
    rrect(-70, -28, 140 * clamp(level), 56, 8, col);
  });
}
