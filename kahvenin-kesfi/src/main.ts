// ===== Oynatıcı: zaman çizelgesi, geçişler, altyazı, film kaplaması, dışa aktarma =====
const TRANS_D = 0.7;
const STARTS: number[] = [];
let TOTAL = 0;
for (const s of SHOTS) { STARTS.push(TOTAL); TOTAL += s.dur; }

const view = document.getElementById('stage') as HTMLCanvasElement;
view.width = W; view.height = H;
const VX = view.getContext('2d')!;
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const bufA = mk(), bufB = mk();
const AX = bufA.getContext('2d')!, BX = bufB.getContext('2d')!;

// film greni (önceden üretilir)
const grain = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d')!; const d = g.createImageData(256, 256); const r = rng(99); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; })();

function renderShot(ctx: CanvasRenderingContext2D, i: number, t: number) {
  X = ctx;
  X.setTransform(1, 0, 0, 1, 0, 0);
  X.globalAlpha = 1;
  X.clearRect(0, 0, W, H);
  X.save();
  SHOTS[i].render(t);
  X.restore();
}

function shotAt(T0: number) {
  let i = SHOTS.length - 1;
  for (let k = 0; k < SHOTS.length; k++) if (T0 < STARTS[k] + SHOTS[k].dur) { i = k; break; }
  return { i, t: clamp(T0 - STARTS[i], 0, SHOTS[i].dur) };
}

function compose(T0: number) {
  const { i, t } = shotAt(T0);
  const sh = SHOTS[i];
  renderShot(BX, i, t);
  VX.setTransform(1, 0, 0, 1, 0, 0); VX.globalAlpha = 1; VX.filter = 'none';
  VX.fillStyle = '#000'; VX.fillRect(0, 0, W, H);
  const inTrans = i > 0 && t < TRANS_D && sh.trans !== 'cut';
  if (!inTrans) VX.drawImage(bufB, 0, 0);
  else {
    renderShot(AX, i - 1, SHOTS[i - 1].dur + t);
    const k = t / TRANS_D;
    switch (sh.trans) {
      case 'fade':
        VX.drawImage(bufA, 0, 0); VX.globalAlpha = E.inOut(k); VX.drawImage(bufB, 0, 0); break;
      case 'dip':
        if (k < 0.5) { VX.drawImage(bufA, 0, 0); VX.fillStyle = `rgba(0,0,0,${E.inOut(k * 2)})`; }
        else { VX.drawImage(bufB, 0, 0); VX.fillStyle = `rgba(0,0,0,${1 - E.inOut((k - 0.5) * 2)})`; }
        VX.fillRect(0, 0, W, H); break;
      case 'whip': {
        const e = E.inOut(k), off = e * W;
        VX.filter = `blur(${Math.sin(k * Math.PI) * 18}px)`;
        VX.drawImage(bufA, -off, 0); VX.drawImage(bufB, W - off, 0);
        VX.filter = 'none'; break;
      }
      case 'zoom': {
        const e = E.in(k);
        VX.save(); VX.translate(W / 2, H / 2); VX.scale(1 + e * 1.5, 1 + e * 1.5); VX.translate(-W / 2, -H / 2); VX.drawImage(bufA, 0, 0); VX.restore();
        VX.save(); VX.globalAlpha = E.out(k); const s = lerp(0.85, 1, E.out(k)); VX.translate(W / 2, H / 2); VX.scale(s, s); VX.translate(-W / 2, -H / 2); VX.drawImage(bufB, 0, 0); VX.restore();
        break;
      }
    }
    VX.globalAlpha = 1;
  }
  // film kaplaması: vinyet + gren
  const g = VX.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
  VX.fillStyle = g; VX.fillRect(0, 0, W, H);
  VX.globalAlpha = 0.045; VX.globalCompositeOperation = 'overlay';
  const ox = Math.floor((T0 * 997) % 256), oy = Math.floor((T0 * 613) % 256);
  for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) VX.drawImage(grain, x, y);
  VX.globalCompositeOperation = 'source-over'; VX.globalAlpha = 1;
  if (OPTS.subs) subtitle(i, t);
}

// ---- Altyazı: tetikleyici kelime göründüğü anda altına döner ----
function subtitle(i: number, t: number) {
  const sh = SHOTS[i];
  if (sh.sub === false) return;
  const a = P(t, 0, 0.35) * (1 - P(t, sh.dur - 0.25, 0.25));
  if (a <= 0) return;
  const text = sh.text;
  const ranges: [number, number, number][] = [];
  let from = 0;
  for (const tr of sh.triggers) {
    const idx = text.indexOf(tr.w, from);
    if (idx >= 0) { ranges.push([idx, idx + tr.w.length, tr.at]); from = idx + tr.w.length; }
  }
  const words: { w: string; s: number; e: number }[] = [];
  const re = /\S+/g; let m: RegExpExecArray | null;
  while ((m = re.exec(text))) words.push({ w: m[0], s: m.index, e: m.index + m[0].length });
  const size = 40;
  VX.font = `500 ${size}px ${T.sans}`;
  const sp = VX.measureText(' ').width, maxW = 1500;
  const lines: typeof words[] = [[]]; let lw = 0;
  for (const w of words) {
    const ww = VX.measureText(w.w).width;
    if (lw + ww > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(w); lw += ww + sp;
  }
  const lh = size * 1.35, boxH = lines.length * lh + 30, y0 = H - 60 - boxH;
  VX.save(); VX.globalAlpha = a;
  const widths = lines.map(l => l.reduce((s, w) => s + VX.measureText(w.w).width, 0) + sp * (l.length - 1));
  const bw = Math.max(...widths) + 70;
  VX.fillStyle = 'rgba(16,10,6,0.62)'; VX.beginPath(); VX.roundRect(W / 2 - bw / 2, y0, bw, boxH, 16); VX.fill();
  VX.textBaseline = 'middle'; VX.textAlign = 'left';
  lines.forEach((l, li) => {
    let x = W / 2 - widths[li] / 2; const y = y0 + 15 + lh * (li + 0.5);
    for (const w of l) {
      const r = ranges.find(([s, e]) => w.s < e && w.e > s);
      const hk = r ? P(t, r[2], 0.25, E.out) : 0;
      VX.fillStyle = hk > 0 ? mix(T.cream, T.goldHi, hk) : T.cream;
      VX.font = `${hk > 0.5 ? 700 : 500} ${size}px ${T.sans}`;
      VX.fillText(w.w, x, y - hk * 3);
      x += VX.measureText(w.w).width + sp;
      VX.font = `500 ${size}px ${T.sans}`;
    }
  });
  VX.restore();
}

// ---- Oynatma döngüsü ----
const OPTS = { subs: true, tts: false };
let now = 0, playing = false, last = 0, lastShot = -1;
const $ = (id: string) => document.getElementById(id) as HTMLElement;
const scrub = $('scrub') as HTMLInputElement;
scrub.max = String(TOTAL);
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function speak(i: number) {
  if (!OPTS.tts || !('speechSynthesis' in window) || SHOTS[i].sub === false) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(SHOTS[i].text); u.lang = 'tr-TR'; u.rate = 0.95;
  speechSynthesis.speak(u);
}
function draw() {
  compose(now);
  scrub.value = String(now);
  $('time').textContent = `${fmt(now)} / ${fmt(TOTAL)}`;
  const { i } = shotAt(now);
  if (i !== lastShot) {
    document.querySelectorAll('.shot').forEach((b, k) => b.classList.toggle('on', k === i));
    $('shotinfo').textContent = `${SHOTS[i].id} · ${SHOTS[i].scene}`;
    if (playing) speak(i);
    lastShot = i;
  }
}
function loop(ts: number) {
  if (playing) {
    now += Math.min(0.1, (ts - last) / 1000);
    if (now >= TOTAL) { now = TOTAL; setPlay(false); onEnd(); }
  }
  last = ts; draw();
  requestAnimationFrame(loop);
}
function setPlay(p: boolean) {
  playing = p; $('play').textContent = p ? '❚❚' : '▶';
  if (p) { if (now >= TOTAL) now = 0; lastShot = -1; } else if ('speechSynthesis' in window) speechSynthesis.cancel();
}
function seek(s: number) { now = clamp(s, 0, TOTAL); lastShot = -1; if (!playing) draw(); }

$('play').onclick = () => setPlay(!playing);
scrub.oninput = () => seek(parseFloat(scrub.value));
(document.getElementById('subs') as HTMLInputElement).onchange = e => { OPTS.subs = (e.target as HTMLInputElement).checked; };
(document.getElementById('tts') as HTMLInputElement).onchange = e => { OPTS.tts = (e.target as HTMLInputElement).checked; };
const list = $('shots');
SHOTS.forEach((s, i) => { const b = document.createElement('button'); b.className = 'shot'; b.textContent = s.id; b.title = s.text; b.onclick = () => seek(STARTS[i] + 0.001); list.appendChild(b); });
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
  if (e.code === 'ArrowRight') seek(now + 2);
  if (e.code === 'ArrowLeft') seek(now - 2);
});

// ---- WebM dışa aktarma (gerçek zamanlı kayıt) ----
let rec: MediaRecorder | null = null; let chunks: Blob[] = [];
function onEnd() { if (rec && rec.state === 'recording') rec.stop(); }
$('export').onclick = () => {
  if (rec && rec.state === 'recording') return;
  const stream = view.captureStream(30);
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
  rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
  chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
    a.download = 'kahvenin-kesfi.webm'; a.click(); $('export').textContent = '⬇ WebM';
  };
  $('export').textContent = '● kaydediliyor';
  seek(0); rec.start(); setPlay(true);
};

// test/inceleme kancası: belirli bir anı çiz
(window as any).__seek = (s: number) => { playing = false; now = s; compose(now); };
(window as any).__total = TOTAL;
requestAnimationFrame(ts => { last = ts; loop(ts); });
