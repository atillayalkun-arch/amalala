// ===== Shot'lar (PLAN.md'deki edit tasarım dokümanının birebir uygulaması) =====

type Trans = 'cut' | 'fade' | 'dip' | 'whip' | 'zoom';
interface Trig { w: string; at: number }
interface Shot { id: string; scene: string; dur: number; text: string; triggers: Trig[]; trans: Trans; sub?: boolean; render: (t: number) => void }

/** Ekran uzayında çiz (kamerasız): etiket, sayaç, kaplama */
function onScreen(fn: () => void) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); fn(); X.restore(); }
function overlay(color: string, a: number) { if (a > 0) onScreen(() => { X.fillStyle = rgba(color, a); X.fillRect(0, 0, W, H); }); }
function flash(t: number, at0: number, d = 0.35, a = 0.8) { if (t >= at0 && t < at0 + d) overlay('#FFFFFF', (1 - (t - at0) / d) * a); }
const GROUND = 840;

// ---- İç mekan (manastır odası) ----
function room(t: number, fireK: number, cool = 0) {
  X.fillStyle = mix(T.stoneDark, T.stoneDeep, 0.3); X.fillRect(-1500, -800, 5000, 3000);
  const r = rng(11);
  for (let row = 0; row < 14; row++) {
    for (let c = 0; c < 18; c++) {
      const x = -400 + c * 170 + (row % 2) * 85, y = -120 + row * 70;
      if (y > GROUND + 20) continue;
      rrect(x, y, 160, 62, 10, mix(T.stoneDark, T.stone, 0.2 + r() * 0.35));
    }
  }
  // kemerli pencere
  rrect(1480, 160, 220, 320, 110, '#151225');
  stars(0.8, t);
  circ(1640, 250, 26, '#F4E9C8');
  X.beginPath(); X.roundRect(1480, 160, 220, 320, 110); fs(null, T.stoneDeep, 20);
  // ahşap kiriş
  rrect(-400, 40, 2800, 46, 8, '#4A2E1C');
  // zemin
  X.fillStyle = '#4A3B2E'; X.fillRect(-1500, GROUND + 40, 5000, 1200);
  // ocak
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; ell(960 + Math.cos(a) * 170, 880 + Math.sin(a) * 26 + 10, 42, 26, 0, i % 2 ? T.stoneDark : T.stone); }
  fire(960, 870, 0.75, t, fireK);
  // ateş ışığı + karanlık köşeler
  const g = X.createRadialGradient(960, 760, 100, 960, 700, 1300);
  g.addColorStop(0, rgba(T.fire2, 0.18 * fireK)); g.addColorStop(0.5, 'rgba(0,0,0,0.15)'); g.addColorStop(1, 'rgba(0,0,0,0.65)');
  X.fillStyle = g; X.fillRect(-1500, -800, 5000, 3000);
  if (cool > 0) { X.fillStyle = rgba(T.devil, 0.3 * cool); X.fillRect(-1500, -800, 5000, 3000); }
}

// ===================== S00 — Köprü: başlık =====================
const S00: Shot = {
  id: 'S00', scene: 'Köprü · Açılış', dur: 4.5, trans: 'cut', sub: false,
  text: 'Kahvenin Keşfi', triggers: [{ w: 'Kahvenin Keşfi', at: 1.5 }],
  render(t) {
    const g = X.createRadialGradient(960, 500, 50, 960, 540, 1100);
    g.addColorStop(0, '#3A2618'); g.addColorStop(1, '#120C08');
    X.fillStyle = g; X.fillRect(0, 0, W, H);
    applyCam(C(960, 540, kf(t, [[0, 1], [4.5, 1.08]], E.sine)));
    const k = P(t, 0.3, 0.9, E.back);
    glow(960, 380, 260 * k, T.berry, 0.5);
    berry(960, 380, 78 * k);
    // sap ve yaprak
    alpha(k, () => { line(960, 300, 975, 262, T.leafDark, 8); ell(1010, 262, 40, 15, -0.3, T.leaf); });
    aroma(960, 300, t, 140, 220, P(t, 1.2, 1.6, E.out), 3, 5);
    // başlık harf harf
    const title = 'Kahvenin Keşfi';
    X.font = `bold 120px ${T.serif}`;
    const tw = X.measureText(title).width; let cx = 960 - tw / 2;
    for (let i = 0; i < title.length; i++) {
      const ch = title[i], w = X.measureText(ch).width;
      const kk = P(t, 1.5 + i * 0.05, 0.5, E.out);
      alpha(kk, () => txt(ch, cx + w / 2, 640 + (1 - kk) * 40, 120, T.cream, { font: T.serif, weight: 'bold' }));
      X.font = `bold 120px ${T.serif}`; cx += w;
    }
    const lk = P(t, 2.2, 0.8, E.out);
    line(960 - 300 * lk, 730, 960 + 300 * lk, 730, T.gold, 3);
    alpha(P(t, 2.5, 0.7), () => txt('ETİYOPYA  ·  IX. YÜZYIL EFSANESİ', 960, 780, 30, T.gold, { spacing: 8 }));
  },
};

// ===================== S01 — Zaman + yer =====================
const MAP = { x: 630, y: 155, s: 1.1 };
const ETH_W = { x: MAP.x + ETH_C.x * MAP.s, y: MAP.y + ETH_C.y * MAP.s };
const S01: Shot = {
  id: 'S01', scene: 'A · Yayla', dur: 8, trans: 'dip',
  text: 'Dokuzuncu yüzyıl. Etiyopya’nın yüksek yaylalarında,',
  triggers: [{ w: 'Dokuzuncu yüzyıl', at: 0.4 }, { w: 'Etiyopya’nın', at: 2.8 }, { w: 'yüksek yaylalarında', at: 5.2 }],
  render(t) {
    X.fillStyle = T.paper; X.fillRect(0, 0, W, H);
    const cam = kcam(t, [[0, C(960, 540, 1)], [2.2, C(855, 470, 1.35)], [2.6, C(855, 470, 1.35)], [3.3, C(960, 540, 1)], [3.5, C(960, 540, 1)], [5.8, C(ETH_W.x, ETH_W.y, 3.4)], [8, C(ETH_W.x, ETH_W.y, 3.8)]]);
    applyCam(cam);
    // kağıt ızgarası
    for (let i = -10; i < 30; i++) { line(i * 120, -600, i * 120, 1700, rgba(T.paperDark, 0.5), 2); line(-600, i * 120, 2600, i * 120, rgba(T.paperDark, 0.5), 2); }
    // --- zaman çizelgesi ---
    const tlA = 1 - P(t, 2.4, 0.6);
    alpha(tlA, () => {
      X.save(); X.translate(0, -P(t, 2.4, 0.6) * 120);
      const x0 = 260, x1 = 1660, ax = (c: number) => x0 + (c / 20) * (x1 - x0);
      const lk = P(t, 0.0, 0.9, E.out);
      line(x0, 540, lerp(x0, x1, lk), 540, T.ink, 5);
      for (let c = 0; c <= 20; c++) {
        const tk = P(t, 0.05 + c * 0.025, 0.3, E.out);
        line(ax(c), 540, ax(c), 540 + (c % 5 === 0 ? 34 : 18) * tk, T.ink, c % 5 === 0 ? 4 : 2);
        if (c % 5 === 0) alpha(tk, () => txt(c === 0 ? 'MS 1' : String(c * 100), ax(c), 600, 26, T.ink));
      }
      const bk = P(t, 0.4, 0.6, E.out);
      rrect(ax(8), 520, (ax(9) - ax(8)) * bk, 40, 4, rgba(T.gold, 0.9));
      const pk = P(t, 0.5, 0.6, E.back);
      at(ax(8.5), 500 - (1 - pk) * 80, 1, 0, () => alpha(clamp(pk * 2), () => { poly([-16, -30, 16, -30, 0, 0], T.berryDark); circ(0, -40, 18, T.berryDark); }));
      const hk = P(t, 0.7, 0.7, E.out);
      alpha(hk, () => {
        txt('IX. YÜZYIL', ax(8.5), 380 - (1 - hk) * 30, 64, T.ink, { font: T.serif, weight: 'bold', spacing: 4 });
        txt('800 – 900', ax(8.5), 430, 26, T.stoneDeep, { spacing: 4 });
      });
      X.restore();
    });
    // --- Afrika haritası ---
    const mk = P(t, 2.4, 0.8, E.out);
    alpha(mk * (1 - P(t, 5.6, 1.2)), () => {
      at(MAP.x, MAP.y + (1 - mk) * 40, MAP.s, 0, () => {
        poly(AFRICA, '#E6D3AE', T.ink, 3);
        alpha(0.35, () => txt('AFRİKA', 300, 420, 64, T.stoneDeep, { font: T.serif, spacing: 18 }));
        alpha(P(t, 3.0, 0.6), () => txt('Kızıldeniz', 512, 120, 15, T.stoneDeep, { italic: true, font: T.serif }));
        const ek = P(t, 2.8, 0.6, E.out);
        poly(ETHIOPIA, mix('#E6D3AE', T.gold, ek), ek > 0 ? T.ink : null, 2.5);
        const pulse = (t * 0.8) % 1;
        if (ek > 0) circ(ETH_C.x, ETH_C.y, 10 + pulse * 70, null, rgba(T.berryDark, (1 - pulse) * ek), 3);
        alpha(ek * (1 - P(t, 4.6, 0.5)), () => { line(ETH_C.x + 40, ETH_C.y, ETH_C.x + 90, ETH_C.y - 40, T.ink, 2); txt('ETİYOPYA', ETH_C.x + 96, ETH_C.y - 44, 24, T.ink, { align: 'left', weight: 'bold', spacing: 4 }); });
      });
    });
    // --- haritadan gerçeğe: yaylalar yükselir ---
    const rk = P(t, 5.2, 1.8, E.out);
    if (rk > 0) onScreen(() => {
      X.globalAlpha = clamp(rk * 1.4);
      drawSky(SKY.day); sun(1500, 250, 60, '#FFE6A8');
      X.globalAlpha = 1;
      X.translate(0, (1 - rk) * 600);
      applyCam(C(960, 540, 1));
      highland(0);
      grassTufts(5, GROUND - 20, 0, 1920, T.hillDeep, t);
    });
    onScreen(() => {
      const ak = P(t, 5.9, 0.7, E.out);
      if (ak <= 0) return;
      alpha(ak, () => {
        const top = lerp(800, 520, ak);
        line(1760, 800, 1760, top, T.cream, 4);
        poly([1748, top + 18, 1760, top - 4, 1772, top + 18], T.cream);
        line(1740, 800, 1780, 800, T.cream, 4);
        txt('YÜKSEK YAYLA', 1730, top + 30, 30, T.cream, { align: 'right', weight: 'bold', spacing: 4, shadow: true });
        txt('≈ 1.500 – 3.000 m', 1730, top + 70, 26, T.goldHi, { align: 'right', shadow: true });
      });
    });
  },
};

// ===================== S02 — Kaldi =====================
const GOATS2 = [{ x: 640, c: 2 }, { x: 1110, c: 1 }, { x: 1260, c: 0 }];
const S02: Shot = {
  id: 'S02', scene: 'A · Yayla', dur: 7, trans: 'fade',
  text: 'Kaldi adında genç bir keçi çobanı yaşıyordu.',
  triggers: [{ w: 'Kaldi', at: 0.6 }, { w: 'genç', at: 1.8 }, { w: 'keçi çobanı', at: 2.8 }, { w: 'yaşıyordu', at: 4.3 }],
  render(t) {
    drawSky(SKY.day); sun(1500, 250, 60, '#FFE6A8');
    applyCam(kcam(t, [[0, C(920, 560, 1.0)], [7, C(1000, 540, 1.12)]], E.sine));
    highland(0);
    hut(1500, GROUND - 25, 0.85, t, P(t, 4.3, 0.6));
    grassTufts(5, GROUND - 20, -200, 2200, T.hillDeep, t);
    GOATS2.forEach((g, i) => {
      const k = P(t, 2.8 + i * 0.2, 0.55, E.out);
      if (k <= 0) return;
      const drop = (1 - E.back(k)) * 300;
      goat(g.x, GROUND + 20 - Math.max(drop, -20), 0.9, i === 0 ? 1 : -1, { col: g.c, headDown: k >= 1 ? 0.5 + 0.5 * Math.sin(t * 2 + i) : 0, tuck: drop > 0 ? 0.6 : 0 });
    });
    const wk = P(t, 0, 2.2, E.out);
    const kx = lerp(360, 860, wk);
    kaldi(kx, GROUND + 15, 1, 1, { walk: t * 7, walkAmt: 1 - P(t, 1.8, 0.4), staff: true, mouth: 'smile', look: t > 3 ? 1 : 0 });
    chip(kx + 10, GROUND - 380, 'genç', P(t, 1.8, 0.5) * (1 - P(t, 4.6, 0.4)));
    onScreen(() => tag(120, 820, 'KALDİ', 'KEÇİ ÇOBANI', P(t, 0.6, 0.8), T.gold, false, P(t, 2.8, 0.8)));
  },
};

// ===================== S03 — Akşam, dönmeyen keçiler =====================
const S03: Shot = {
  id: 'S03', scene: 'A · Yayla', dur: 6.5, trans: 'fade',
  text: 'Bir akşam keçileri eve dönmedi.',
  triggers: [{ w: 'Bir akşam', at: 0.3 }, { w: 'keçileri', at: 2.0 }, { w: 'eve dönmedi', at: 3.2 }],
  render(t) {
    const sk = P(t, 0.3, 2.2);
    drawSky(skyMix(SKY.day, SKY.sunset, sk));
    sun(1500, lerp(250, 700, sk), lerp(60, 80, sk), mix('#FFE6A8', '#FF9A4D', sk));
    applyCam(kcam(t, [[0, C(1000, 620, 1.18)], [6.5, C(960, 540, 1.0)]]));
    highland(sk);
    // boş patika
    dashed(() => smooth([760, GROUND + 40, 560, GROUND + 10, 320, GROUND - 10, 100, GROUND - 40], null, rgba(T.cream, 0.6 * P(t, 3.2, 0.6)), 5), [16, 14], -t * 30);
    pen(820, GROUND + 30, 1);
    hut(1250, GROUND - 25, 0.85, t, 1, P(t, 2.5, 1.5) * 0.8);
    // hayalet keçiler
    const gk = P(t, 2.0, 0.5) * (1 - P(t, 3.6, 0.9));
    alpha(gk * (0.6 + 0.4 * Math.sin(t * 8)), () => {
      [[700, 1], [830, -1], [940, 1]].forEach(([x, f], i) => goat(x, GROUND + 20 - i * 6, 0.75, f, { ghost: 1, col: 0 }));
    });
    const turn = t < 3.7 ? -1 : t < 4.7 ? 1 : -1;
    kaldi(1110, GROUND + 15, 1, turn, { staff: true, mouth: t > 3.2 ? 'o' : 'flat', brow: P(t, 3.2, 0.4), armUp: P(t, 3.4, 0.4) * 0.8 });
    // sayaç 3 → 0
    onScreen(() => {
      const ck = P(t, 2.0, 0.5, E.back);
      if (ck <= 0) return;
      at(1660, 220, ck, 0, () => {
        rrect(-110, -90, 220, 180, 20, rgba(T.ink, 0.75));
        X.save(); X.beginPath(); X.rect(-110, -80, 220, 120); X.clip();
        const rk = P(t, 3.2, 0.5, E.inOut);
        txt('3', 0, -20 - rk * 120, 110, T.cream, { font: T.serif, weight: 'bold' });
        txt('0', 0, -20 + (1 - rk) * 120, 110, T.goldHi, { font: T.serif, weight: 'bold' });
        X.restore();
        txt('KEÇİ', 0, 60, 24, T.gold, { spacing: 8, weight: 'bold' });
      });
    });
  },
};

// ===================== S04 — Arayış ve garip ses =====================
const BIGHILL = (x: number) => 560 + Math.pow((x - 2150) / 330, 2) * 90;
const S04: Shot = {
  id: 'S04', scene: 'B · Tepelerin ardı', dur: 7.5, trans: 'whip',
  text: 'Kaldi onları ararken tepelerin ardında garip bir sesle irkildi.',
  triggers: [{ w: 'Kaldi onları ararken', at: 0.3 }, { w: 'tepelerin ardında', at: 3.0 }, { w: 'garip bir sesle', at: 4.0 }, { w: 'irkildi', at: 5.4 }],
  render(t) {
    const dk = P(t, 0, 7.5, E.lin);
    drawSky(skyMix(SKY.sunset, SKY.dusk, dk * 0.7));
    stars(dk * 0.6, t);
    const st = t > 5.4 ? 18 * (1 - P(t, 5.4, 0.6, E.lin)) : 0;
    applyCam(kcam(t, [[0, C(760, 560, 1.05)], [3.3, C(1640, 540, 1.0)], [5.35, C(1720, 530, 1.0)], [5.7, C(1720, 560, 1.32)], [7.5, C(1730, 560, 1.38)]]), st, t * 60);
    highland(1);
    // büyük tepe
    X.beginPath(); X.moveTo(1700, 1400);
    for (let x = 1700; x <= 2700; x += 20) X.lineTo(x, Math.min(BIGHILL(x), GROUND + 60));
    X.lineTo(2700, 1400); X.closePath(); fs(mix(T.hillDeep, '#5B3C5E', 0.4));
    acacia(2250, BIGHILL(2250) + 6, 0.5, mix(T.leafDark, '#5B3C5E', 0.4), '#3A2A20');
    const kx = lerp(560, 1560, P(t, 0, 3.6, E.sine));
    const startle = kf(t, [[5.4, 0], [5.55, 1], [6.1, 0.55], [7.5, 0.45]], E.out);
    kaldi(kx, GROUND + 15, 1, 1, { walk: t * 7, walkAmt: 1 - P(t, 3.3, 0.4), staff: t < 5.4, mouth: t < 3.4 ? (Math.sin(t * 5) > 0 ? 'o' : 'flat') : t > 5.4 ? 'o' : 'flat', startle, brow: startle });
    // seslenme
    if (t < 3.4) { for (const c of [0.4, 1.6, 2.7]) alpha(env(t, c, c + 0.8, 0.2), () => { soundRings(kx + 40, GROUND - 270, t, 1, T.cream, 0, 0, 0.5); qmark(kx + 120, GROUND - 360 - (t - c) * 30, 0.5); }); }
    // tepenin ardından garip ses
    const sk = P(t, 4.0, 0.4);
    soundRings(2150, 560, t, sk, T.goldHi, 16, -Math.PI / 2, 1.1);
    if (sk > 0) for (let i = 0; i < 3; i++) { const ph = (t * 0.7 + i / 3) % 1; alpha(sk * (1 - ph), () => note(2050 + i * 90 + Math.sin(ph * 6) * 20, 520 - ph * 200, 0.8, T.goldHi, i === 1)); }
    pointer(1960, 470, 1880, 380, 'tepelerin ardı', P(t, 3.0, 0.6) * (1 - P(t, 5.3, 0.3)), T.cream, 28);
    bang(kx + 30, GROUND - 400 - startle * 50, P(t, 5.4, 0.3, E.back) * 1.1);
  },
};

// ===================== S05 — Dans eden keçiler =====================
const S05: Shot = {
  id: 'S05', scene: 'B · Tepelerin ardı', dur: 8.5, trans: 'zoom',
  text: 'Keçileri, parlak kırmızı meyveleri olan bir çalılığın etrafında zıplıyor, sanki dans ediyordu.',
  triggers: [{ w: 'Keçileri', at: 0.4 }, { w: 'parlak kırmızı meyveleri', at: 1.8 }, { w: 'çalılığın', at: 2.6 }, { w: 'etrafında zıplıyor', at: 3.6 }, { w: 'sanki dans ediyordu', at: 5.6 }],
  render(t) {
    drawSky(skyMix(SKY.sunset, SKY.dusk, 0.75));
    stars(0.6, t);
    circ(1550, 200, 46, '#F4E9C8'); glow(1550, 200, 160, '#F4E9C8', 0.3);
    const dance = P(t, 5.6, 0.6);
    const cam = kcam(t, [[0, C(960, 980, 1.3)], [1.7, C(960, 560, 1.0)], [8.5, C(960, 600, 1.15)]]);
    cam.r = Math.sin(t * 2.4) * 0.014 * dance;
    applyCam(cam);
    highland(1);
    // dans ışığı
    if (dance > 0) {
      const g = X.createLinearGradient(960, 0, 960, 900);
      g.addColorStop(0, rgba(T.goldHi, 0)); g.addColorStop(1, rgba(T.goldHi, 0.28 * dance));
      X.fillStyle = g; poly([860, -200, 1060, -200, 1460, 900, 460, 900], g as any);
    }
    const cx = 960, cy = GROUND + 10, rx = 380, ry = 70;
    const jumpK = P(t, 3.6, 0.4);
    const goats = [0, 1, 2, 3].map(i => {
      const th = (i / 4) * TAU + 0.6 + Math.max(0, t - 3.6) * 1.25;
      return { i, th, x: cx + Math.cos(th) * rx, y: cy + Math.sin(th) * ry };
    });
    const drawG = (g: { i: number; th: number; x: number; y: number }) => {
      const k = P(t, 0.4 + g.i * 0.12, 0.5, E.back);
      if (k <= 0) return;
      const f = Math.sin(g.th) > 0 ? -1 : 1;
      const jump = Math.abs(Math.sin((t - 3.6) * 5 + g.i * 1.3)) * 90 * jumpK * (1 - dance * 0.6);
      const bobD = Math.abs(Math.sin(t * 6 + g.i)) * 30 * dance;
      goat(g.x, g.y, 0.85 * k, f, { col: g.i, jump: jump + bobD, tuck: jump > 20 ? 0.6 : 0, rear: dance * 0.9, phase: t * 8, walkAmt: jumpK, headDown: t < 3.6 ? 0.5 : 0 });
    };
    goats.filter(g => Math.sin(g.th) < 0).forEach(drawG);
    bush(cx, cy - 10, 1.25, { berries: P(t, 1.8, 1.0, E.lin), glowA: P(t, 1.8, 0.6) * (0.7 + 0.3 * Math.sin(t * 4)), lit: lerp(0.15, 1, P(t, 2.6, 0.8)), sway: t * 3 });
    goats.filter(g => Math.sin(g.th) >= 0).forEach(drawG);
    // ön plan sırt (tilt reveal)
    hills(1060, 30, 0.002, 4, '#1E1A22', 1);
    // notalar
    if (dance > 0) for (let i = 0; i < 6; i++) { const ph = (t * 0.5 + i / 6) % 1; alpha(dance * Math.sin(ph * Math.PI), () => note(cx - 450 + i * 180 + Math.sin(ph * 8 + i) * 30, 600 - ph * 320, 0.9, i % 2 ? T.goldHi : T.cream, i % 3 === 0)); }
    pointer(cx + 160, cy - 260, cx + 330, cy - 420, 'kahve meyvesi', P(t, 2.0, 0.6) * (1 - P(t, 3.5, 0.4)), T.berryHi, 30);
    pointer(cx - 200, cy - 120, cx - 380, cy - 380, 'çalılık', P(t, 2.6, 0.6) * (1 - P(t, 3.8, 0.4)), T.cream, 30);
  },
};

// ===================== S06 — Yaklaşma, koparma, bakma, tatma =====================
function nearestBerry(bx: number, by: number, s: number, hx: number, hy: number) {
  let best = 0, bd = 1e9;
  BUSH_BERRIES.forEach(([x, y], i) => { const d = Math.hypot(bx + x * s - hx, by + y * s - hy); if (d < bd) { bd = d; best = i; } });
  return best;
}
const S06_BUSH = { x: 1150, y: GROUND, s: 1.1 };
const S06_HAND = { x: 1010, y: GROUND + 15 - 232 };
const S06_PICK = nearestBerry(S06_BUSH.x, S06_BUSH.y, S06_BUSH.s, S06_HAND.x, S06_HAND.y);
const S06: Shot = {
  id: 'S06', scene: 'B · Tepelerin ardı', dur: 9, trans: 'cut',
  text: 'Kaldi şaşkınlıkla yaklaştı. Meyvelerden birini kopardı, uzun uzun baktı ve sonunda tadına baktı.',
  triggers: [{ w: 'şaşkınlıkla', at: 0.3 }, { w: 'yaklaştı', at: 1.0 }, { w: 'Meyvelerden birini kopardı', at: 2.8 }, { w: 'uzun uzun baktı', at: 4.4 }, { w: 'tadına baktı', at: 7.0 }],
  render(t) {
    const ecu = t >= 4.2 && t < 6.8;
    if (ecu) {
      // --- C: aşırı yakın plan, kesit ---
      const g = X.createRadialGradient(960, 540, 50, 960, 540, 1100);
      g.addColorStop(0, '#3B2A3A'); g.addColorStop(1, '#141018'); X.fillStyle = g; X.fillRect(0, 0, W, H);
      const r = rng(21);
      for (let i = 0; i < 18; i++) circ(r() * W, r() * H, 30 + r() * 90, rgba(r() > 0.5 ? T.goldHi : T.leafHi, 0.06 + r() * 0.06));
      applyCam(C(960, 540, kf(t, [[4.2, 1.08], [6.8, 1.0]], E.out)));
      // dev göz (soldan bakıyor)
      at(170, 560, 1, 0, () => {
        circ(-160, 0, 420, T.skin);
        ell(40, -10, 95, 62, 0, '#FFFFFF');
        circ(70, -6, 40, '#3A2010'); circ(78, -8, 22, T.hair); circ(64, -22, 9, '#FFFFFF');
        X.beginPath(); X.ellipse(40, -10, 100, 68, 0, Math.PI * 1.05, Math.PI * 1.95); fs(null, T.skinDark, 14);
        line(-50, -120 - P(t, 4.4, 0.4) * 20, 120, -112 - P(t, 4.4, 0.4) * 24, T.hair, 16);
      });
      const split = P(t, 5.2, 0.7, E.out);
      const bx = 1060, by = 520;
      at(bx, by, 1, Math.sin(t * 1.2) * 0.08, () => {
        glow(0, 0, 340, T.berry, 0.35);
        if (split <= 0) { berry(0, 0, 170); line(0, -170, 18, -230, T.leafDark, 12); }
        else {
          // sol yarı: dış kabuk
          X.save(); X.beginPath(); X.rect(-400, -400, 400, 800); X.clip(); berry(-split * 120, 0, 170); X.restore();
          // sağ yarı: kesit yüzü
          at(split * 200, 0, 1, 0, () => {
            circ(0, 0, 170, T.berry);
            circ(0, 0, 150, '#F2D9A8');
            ell(-38, 0, 46, 100, 0, '#D8C08E'); ell(38, 0, 46, 100, 0, '#D8C08E');
            line(-22, -80, -22, 80, '#B39A68', 5); line(22, -80, 22, 80, '#B39A68', 5);
          });
        }
      });
      // süre halkası: "uzun uzun"
      const rk = P(t, 4.4, 2.2, E.lin);
      if (rk > 0) { X.beginPath(); X.arc(bx + split * 40, by, 260, -Math.PI / 2, -Math.PI / 2 + rk * TAU); fs(null, rgba(T.goldHi, 0.8), 6); }
      pointer(bx - split * 120 - 120, by - 120, bx - 320, by - 330, 'kabuk', P(t, 5.6, 0.5), T.cream, 30);
      pointer(bx + split * 200 + 110, by - 100, bx + 520, by - 300, 'meyve eti', P(t, 5.8, 0.5), T.cream, 30);
      pointer(bx + split * 200 + 40, by + 40, bx + 520, by + 260, 'çekirdek × 2', P(t, 6.0, 0.5), T.goldHi, 34);
      flash(t, 4.2, 0.25, 0.7);
      return;
    }
    // --- A, B, D: orta plan ---
    drawSky(skyMix(SKY.sunset, SKY.dusk, 0.8)); stars(0.6, t);
    circ(1550, 200, 46, '#F4E9C8');
    const cam = t < 6.8
      ? kcam(t, [[0, C(860, 580, 1.08)], [2.6, C(900, 570, 1.12)], [3.3, C(1040, 610, 2.2)], [4.2, C(1040, 610, 2.3)]])
      : kcam(t, [[6.8, C(930, 560, 2.5)], [9, C(930, 560, 2.7)]], E.out);
    applyCam(cam);
    highland(1);
    // arka planda dans eden keçiler
    for (let i = 0; i < 2; i++) goat(1380 + i * 160, GROUND - 30, 0.6, -1, { col: i + 1, rear: 0.8, jump: Math.abs(Math.sin(t * 6 + i)) * 24 });
    const picked = t >= 3.2;
    bush(S06_BUSH.x, S06_BUSH.y, S06_BUSH.s, { berries: 1, glowA: 0.3, missing: picked ? S06_PICK : -1, sway: t * 2 });
    const kx = lerp(420, 900, P(t, 0.8, 1.8, E.inOut));
    const walking = t > 0.8 && t < 2.6;
    const reach = t < 6.8 ? kf(t, [[2.7, 0], [3.15, 1], [3.6, 1], [4.0, 0.6]], E.inOut) : 0;
    const eat = t >= 6.8;
    kaldi(kx, GROUND + 15, 1, 1, {
      walk: t * 7, walkAmt: walking ? 1 : 0, mouth: eat ? (t > 7.0 ? 'chew' : 'o') : t < 3 ? 'o' : 'flat', brow: t < 3 ? 1 : 0.5,
      arm: reach, armUp: eat ? kf(t, [[6.8, 0.6], [7.0, 1.0], [7.3, 0.2]]) : 0,
      hands: (picked && !(eat && t > 7.0)) ? 'berry' : null, staff: true,
    });
    for (let i = 0; i < 3; i++) alpha(env(t, 0.3 + i * 0.25, 2.6), () => qmark(kx - 40 + i * 50, GROUND - 380 - i * 30 - Math.sin(t * 3 + i) * 10, 0.6 + i * 0.15, T.cream, (i - 1) * 0.2));
    // çıt!
    if (t > 3.15 && t < 3.6) { const k = P(t, 3.15, 0.45, E.out); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; line(S06_HAND.x + Math.cos(a) * (14 + k * 26), S06_HAND.y - 12 + Math.sin(a) * (14 + k * 26), S06_HAND.x + Math.cos(a) * (20 + k * 40), S06_HAND.y - 12 + Math.sin(a) * (20 + k * 40), rgba(T.goldHi, 1 - k), 4); } }
    // ısırma
    if (t > 7.0) { const k = P(t, 7.0, 0.5, E.out); const mx = 900 + 26, my = GROUND + 15 - 120 - 168 + 16; for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; line(mx + Math.cos(a) * (24 + k * 20), my + Math.sin(a) * (24 + k * 20), mx + Math.cos(a) * (32 + k * 34), my + Math.sin(a) * (32 + k * 34), rgba(T.goldHi, 1 - k * 0.6), 3); } }
    flash(t, 6.8, 0.25, 0.6);
  },
};

// ===================== S07 — Zaman geçer, enerji, gözler =====================
const S07: Shot = {
  id: 'S07', scene: 'B · Tepelerin ardı', dur: 7, trans: 'dip',
  text: 'Birkaç dakika sonra yorgunluğu kaybolmuştu. Gözleri parladı.',
  triggers: [{ w: 'Birkaç dakika sonra', at: 0.2 }, { w: 'yorgunluğu', at: 1.9 }, { w: 'kaybolmuştu', at: 3.0 }, { w: 'Gözleri parladı', at: 4.6 }],
  render(t) {
    drawSky(skyMix(SKY.dusk, SKY.night, 0.3)); stars(0.8, t);
    const droop = 1 - P(t, 3.0, 0.8);
    const eyeX = 900 + 18, eyeY = GROUND + 15 - 120 - 168 - 4;
    const cam = kcam(t, [[0, C(960, 560, 1.0)], [1.8, C(960, 560, 1.0)], [2.1, C(930, 600, 1.55)], [4.4, C(930, 590, 1.6)], [5.0, C(eyeX + 6, eyeY, 4.2)], [7, C(eyeX + 6, eyeY, 4.6)]]);
    const shake = t > 4.6 && t < 5.2 ? 6 * (1 - P(t, 4.6, 0.6, E.lin)) : 0;
    applyCam(cam, shake, t * 50);
    highland(1, 0.3);
    bush(1180, GROUND, 1.1, { berries: 1, glowA: 0.2, missing: S06_PICK });
    const gk = P(t, 4.6, 0.5, E.out);
    kaldi(900, GROUND + 15, 1, 1, { droop, lid: droop * 0.8, mouth: droop > 0.5 ? 'flat' : 'grin', glowEyes: gk, staff: true, brow: (1 - droop) * 0.6 });
    // zzz
    if (droop > 0.05) for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; alpha(droop * Math.sin(ph * Math.PI) * P(t, 1.9, 0.3), () => txt('z', 980 + ph * 60 + i * 10, 470 - ph * 120, 30 + i * 8, T.cream, { weight: 'bold', font: T.serif })); }
    battery(900, 360, 0.7, kf(t, [[3.0, 0.12], [3.9, 1.0]], E.inOut), P(t, 1.9, 0.4) * (1 - P(t, 4.3, 0.3)));
    // ışın patlaması
    if (gk > 0) {
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + t * 0.4; line(eyeX + Math.cos(a) * 14, eyeY + Math.sin(a) * 14, eyeX + Math.cos(a) * (14 + 50 * gk), eyeY + Math.sin(a) * (14 + 50 * gk), rgba(T.goldHi, 0.7 * gk), 2); }
      for (let i = 0; i < 4; i++) { const a = i * 1.7 + t; sparkle(eyeX + Math.cos(a) * 30, eyeY + Math.sin(a) * 22, 6 + 4 * Math.sin(t * 6 + i), t * 2 + i, T.goldHi); }
    }
    // saat kaplaması
    const ck = env(t, 0.1, 1.95, 0.3);
    if (ck > 0) {
      overlay('#0E0A12', 0.55 * ck);
      onScreen(() => alpha(ck, () => {
        clock(960, 470, 170, P(t, 0.2, 1.5, E.inOut) * 0.15, P(t, 0.1, 0.4));
        chip(960, 720, '+ birkaç dakika', P(t, 0.5, 0.5));
      }));
    }
  },
};

// ===================== S08 — Avuç dolusu, manastıra koşu =====================
const PILE = (() => { const r = rng(5); const a: number[][] = []; for (let i = 0; i < 16; i++) { const ang = r() * TAU, d = Math.sqrt(r()); a.push([Math.cos(ang) * d * 120, Math.sin(ang) * d * 70 - i * 2, r()]); } return a; })();
const MON = { x: 2650, y: 600 };
const path8 = (u: number) => ({ x: lerp(560, 2480, u), y: lerp(GROUND + 10, MON.y + 10, u) - Math.sin(u * Math.PI) * 30 });
const S08: Shot = {
  id: 'S08', scene: 'C · Manastır', dur: 7.5, trans: 'whip',
  text: 'Avuçlarını meyveyle doldurup yakındaki manastıra koştu.',
  triggers: [{ w: 'Avuçlarını meyveyle doldurup', at: 0.3 }, { w: 'yakındaki manastıra', at: 2.6 }, { w: 'koştu', at: 3.8 }],
  render(t) {
    if (t < 2.4) {
      // kuşbakışı avuçlar
      X.fillStyle = '#4E3A2A'; X.fillRect(0, 0, W, H);
      applyCam(C(960, 540, kf(t, [[0, 1], [2.4, 1.15]]), kf(t, [[0, -0.04], [2.4, 0.04]])));
      const r = rng(2); for (let i = 0; i < 60; i++) ell(r() * 2200 - 140, r() * 1300 - 110, 10 + r() * 30, 4 + r() * 8, r() * 3, rgba('#6B5038', 0.6));
      // avuçlar
      // bilekler alttan gelir, parmaklar yukarı ve dışa açılır; iki avuç ortada birleşir
      for (const s of [-1, 1]) at(960 + s * 100, 600, 1, 0, () => {
        X.scale(s, 1);
        rrect(10, 120, 120, 400, 50, T.skinDark);                 // bilek/kol
        ell(40, 40, 120, 150, 0, T.skin);                          // avuç
        const fingers: [number, number, number, number][] = [[-10, -90, -0.05, 120], [40, -96, 0.12, 130], [88, -80, 0.3, 120], [122, -50, 0.5, 98]];
        for (const [fx, fy, rot, len] of fingers) at(fx, fy, 1, rot, () => { rrect(-22, -len, 44, len + 30, 22, T.skin); ell(0, -len + 14, 12, 10, 0, mix(T.skin, '#E0B08A', 0.5)); line(-12, -len * 0.45, 12, -len * 0.45, rgba(T.skinDark, 0.6), 3); });
        at(130, 90, 1, 0.9, () => rrect(-24, -110, 48, 130, 24, T.skin)); // başparmak
        ell(10, 50, 92, 110, 0, mix(T.skin, '#C48A5A', 0.35));    // iç avuç
        smooth([-40, 0, 0, 40, 50, 70], null, rgba(T.skinDark, 0.5), 4);
      });
      // düşen meyveler
      PILE.forEach(([px, py, d], i) => {
        const k = P(t, 0.3 + i * 0.09, 0.45, E.out);
        if (k <= 0) return;
        const s = lerp(2.4, 1, k);
        alpha(clamp(k * 3), () => berry(960 + px * 1.1, 640 + py - (1 - E.back(k)) * 60, 30 * s));
      });
      return;
    }
    // --- gece, manastır ---
    drawSky(skyMix(SKY.dusk, SKY.night, 0.6)); stars(1, t);
    circ(400, 180, 40, '#F4E9C8'); glow(400, 180, 140, '#F4E9C8', 0.3);
    const u = P(t, 3.8, 3.4, E.inOut);
    const kp = path8(u);
    const wide = C(1600, 560, 0.62);
    const follow = C(kp.x + 180, kp.y - 200, 1.05);
    const fk = P(t, 3.7, 0.7);
    const cam = C(lerp(wide.x, follow.x, fk), lerp(wide.y, follow.y, fk), lerp(wide.z, follow.z, fk), 0);
    if (t > 6.6) { const e = P(t, 6.6, 0.9); cam.x = lerp(cam.x, MON.x - 150, e); cam.z = lerp(cam.z, 0.9, e); }
    applyCam(cam);
    highland(1, 0.6);
    ell(MON.x, MON.y + 180, 700, 200, 0, '#2A2A30');
    monastery(MON.x, MON.y + 10, 0.8, 0.8 + 0.2 * Math.sin(t * 7), P(t, 2.6, 0.6));
    // rota
    const rk = P(t, 2.6, 1.0, E.out);
    dashed(() => {
      X.beginPath();
      for (let i = 0; i <= 60 * rk; i++) { const p = path8(i / 60); i === 0 ? X.moveTo(p.x, p.y) : X.lineTo(p.x, p.y); }
      fs(null, rgba(T.goldHi, 0.8), 6);
    }, [18, 16], -t * 40);
    // pin
    alpha(rk, () => { circ(560, GROUND - 40, 14, T.goldHi); circ(MON.x, MON.y - 520, 24, null, T.goldHi, 5); });
    pointer(MON.x + 200, MON.y - 300, MON.x + 380, MON.y - 520, 'MANASTIR', P(t, 2.7, 0.6) * (1 - P(t, 4.0, 0.4)), T.cream, 48);
    chip(1560, GROUND - 200, 'yakında', P(t, 2.9, 0.5) * (1 - P(t, 3.9, 0.3)));
    // toz + hız çizgileri
    if (t > 3.8) {
      for (let i = 1; i < 7; i++) { const p = path8(Math.max(0, u - i * 0.012)); circ(p.x - 20, p.y + 6, 10 + i * 5, rgba('#C9B79A', 0.35 * (1 - i / 7))); }
      const sp = P(t, 3.9, 0.4) * (1 - P(t, 6.8, 0.4));
      for (let i = 0; i < 5; i++) line(kp.x - 160 - i * 30, kp.y - 80 - i * 50, kp.x - 300 - i * 60, kp.y - 80 - i * 50, rgba(T.cream, 0.4 * sp), 4);
    }
    kaldi(kp.x, kp.y + 15, 1, 1, { walk: t * 13, walkAmt: t > 3.8 && u < 1 ? 1 : 0, run: 1, arm: 0.7, hands: 'berries', mouth: 'grin', brow: 0.6 });
  },
};

// ===================== S09 — Keşiş, şeytan, ateş =====================
const MONK1 = { x: 600, y: GROUND + 40 };
const KAL9 = { x: 1360, y: GROUND + 40 };
const parab = (u: number) => ({ x: lerp(725, 960, u), y: lerp(640, 820, u) - Math.sin(u * Math.PI) * 260 });
const S09: Shot = {
  id: 'S09', scene: 'C · Manastır', dur: 9, trans: 'fade',
  text: 'Ama keşiş bu meyvenin şeytanın işi olduğunu düşündü ve onları ateşe fırlattı.',
  triggers: [{ w: 'Ama', at: 0.2 }, { w: 'keşiş', at: 0.9 }, { w: 'bu meyvenin', at: 2.0 }, { w: 'şeytanın işi', at: 3.0 }, { w: 'düşündü', at: 4.0 }, { w: 'ateşe', at: 5.4 }, { w: 'fırlattı', at: 6.0 }],
  render(t) {
    const shake = t > 6.9 && t < 7.5 ? 10 * (1 - P(t, 6.9, 0.6, E.lin)) : 0;
    applyCam(kcam(t, [[0, C(960, 560, 1.0)], [5.2, C(960, 560, 1.0)], [5.7, C(900, 640, 1.25)], [9, C(930, 650, 1.32)]]), shake, t * 70);
    const fireK = kf(t, [[5.4, 0.8], [5.8, 1.1], [6.9, 1.1], [7.1, 1.4], [9, 1.2]], E.out);
    room(t, fireK, P(t, 0.2, 0.6) * (1 - P(t, 6.9, 1.2)));
    const reach = kf(t, [[4.8, 0], [5.15, 1], [5.5, 0.4]]);
    const wind = kf(t, [[5.5, 0], [5.9, 1], [6.05, 0]], E.inOut);
    const throwA = t > 6.0 ? kf(t, [[6.0, 0.2], [6.15, 1], [7, 0.5]]) : 0;
    monk(MONK1.x, MONK1.y, 1, 1, { brow: -P(t, 0.2, 0.5), mouth: 'frown', arm: Math.max(reach, throwA), armUp: wind });
    const has = t < 5.15;
    const st = t > 6.2 ? kf(t, [[6.2, 0], [6.4, 0.5], [9, 0.4]], E.out) : 0;
    kaldi(KAL9.x, KAL9.y, 1, -1, { arm: has ? 1 : 0.4, hands: has ? 'berries' : null, mouth: t > 6.2 ? 'o' : t > 3 ? 'flat' : 'smile', startle: st, brow: st * 2 });
    // meyveler keşişin elinde → parabol
    if (t >= 5.15 && t < 6.0) for (let i = 0; i < 7; i++) berry(725 + (i % 4) * 10 - 15, 640 - Math.floor(i / 4) * 12 - wind * 120, 9);
    if (t >= 6.0) {
      const u = P(t, 6.0, 0.9, E.in);
      dashed(() => { X.beginPath(); for (let i = 0; i <= 40 * u; i++) { const p = parab(i / 40); i === 0 ? X.moveTo(p.x, p.y) : X.lineTo(p.x, p.y); } fs(null, rgba(T.goldHi, 0.7 * (1 - P(t, 7.2, 0.6))), 4); }, [10, 10]);
      if (u < 1) for (let i = 0; i < 7; i++) { const p = parab(clamp(u - i * 0.02)); berry(p.x + (i % 3) * 8, p.y + Math.floor(i / 3) * 8, 9); }
      if (t > 6.9) { const k = P(t, 6.9, 0.7, E.out); for (let i = 0; i < 14; i++) { const a = -Math.PI * (0.1 + 0.8 * (i / 13)); circ(960 + Math.cos(a) * k * 220, 820 + Math.sin(a) * k * 200 + k * k * 80, 6 * (1 - k), rgba(T.fire1, 1 - k)); } }
    }
    // "bu meyve" halkası
    if (has) { const k = P(t, 2.0, 0.4, E.back); if (k > 0) circ(1250, 630, 52 + Math.sin(t * 6) * 4, null, rgba(T.goldHi, k * (1 - P(t, 3.4, 0.5))), 5); }
    // düşünce balonu: meyve = şeytan
    const bk = P(t, 3.0, 0.6) * (1 - P(t, 5.0, 0.4));
    const shk = env(t, 4.0, 5.0, 0.15) * Math.sin(t * 50) * 6;
    at(shk, 0, 1, 0, () => {
      thought(520, 330, 170, bk, 600, 560, mix(T.cream, '#CDB8D8', P(t, 4.0, 0.5)));
      alpha(clamp(bk * 1.4 - 0.4), () => {
        berry(430, 330, 40);
        txt('=', 520, 330, 70, T.ink, { weight: 'bold' });
        at(615, 340, 1, 0, () => {
          poly([-34, -20, -48, -78, -14, -34], T.devil); poly([34, -20, 48, -78, 14, -34], T.devil);
          circ(0, 0, 44, T.devil);
          poly([-24, -8, -6, 0, -24, 4], T.goldHi); poly([24, -8, 6, 0, 24, 4], T.goldHi);
          X.beginPath(); X.arc(0, 14, 16, 0.2, Math.PI - 0.2); fs(null, T.goldHi, 4);
        });
      });
    });
    onScreen(() => tag(120, 820, 'KEŞİŞ', 'MANASTIRDAN', P(t, 0.9, 0.8) * (1 - P(t, 3.0, 0.5))));
  },
};

// ===================== S10 — Kavrulma ve koku =====================
const S10: Shot = {
  id: 'S10', scene: 'C · Manastır', dur: 7.5, trans: 'cut',
  text: 'Ateşten yükselen koku bütün odayı sardı.',
  triggers: [{ w: 'Ateşten', at: 0.2 }, { w: 'yükselen koku', at: 1.8 }, { w: 'bütün odayı sardı', at: 3.8 }],
  render(t) {
    applyCam(kcam(t, [[0, C(960, 780, 2.4)], [3.6, C(960, 750, 2.15)], [5.6, C(960, 560, 1.0)], [7.5, C(960, 540, 0.96)]]));
    room(t, 1.15);
    const roast = P(t, 0.2, 3.2, E.lin);
    const r = rng(8);
    for (let i = 0; i < 7; i++) berry(960 - 70 + i * 22 + r() * 6, 852 - (i % 2) * 8, 9, roast);
    monk(MONK1.x, MONK1.y, 1, 1, { mouth: t > 4.5 ? 'o' : 'frown', brow: t > 4.5 ? 0.6 : -0.6 });
    kaldi(KAL9.x, KAL9.y, 1, -1, { mouth: t > 4.5 ? 'smile' : 'o', brow: 0.5, lid: t > 5.2 ? 0.6 : 0 });
    aroma(960, 800, t, 160, 520, P(t, 1.8, 2.0, E.out), 5, 4);
    const sk = P(t, 3.8, 2.5, E.out);
    if (sk > 0) {
      aroma(960, 900, t, 1900, 1000, sk, 9, 3);
      for (let j = 0; j < 4; j++) {
        X.beginPath();
        for (let x = -100; x <= 2020 * sk + 100; x += 20) { const y = 260 + j * 130 + Math.sin(x * 0.006 + t * 1.4 + j * 2) * 40; x === -100 ? X.moveTo(x, y) : X.lineTo(x, y); }
        alpha(0.3, () => fs(null, T.aroma, 8));
      }
      const rr = rng(13);
      for (let i = 0; i < 14; i++) { const ph = (t * 0.15 + rr()) % 1; alpha(sk * Math.sin(ph * Math.PI) * 0.8, () => bean(rr() * 1920, 900 - ph * 800, 10, t + i, T.beanMid)); }
    }
    pointer(990, 830, 1080, 760, 'kavrulma', P(t, 0.8, 0.5) * (1 - P(t, 3.6, 0.4)), T.cream, 14);
    // kavrulma çubuğu
    onScreen(() => {
      const bk = P(t, 0.6, 0.5, E.out) * (1 - P(t, 4.2, 0.5));
      if (bk <= 0) return;
      alpha(bk, () => {
        const x0 = 1380, y0 = 120, w = 420;
        txt('KAVRULMA', x0, y0 - 34, 26, T.cream, { align: 'left', weight: 'bold', spacing: 6, shadow: true });
        const g = X.createLinearGradient(x0, 0, x0 + w, 0);
        g.addColorStop(0, T.berry); g.addColorStop(0.5, T.beanMid); g.addColorStop(1, T.bean);
        X.fillStyle = g; X.beginPath(); X.roundRect(x0, y0, w, 22, 11); X.fill();
        X.beginPath(); X.roundRect(x0, y0, w, 22, 11); fs(null, T.cream, 3);
        const mx = x0 + w * roast;
        poly([mx - 12, y0 - 14, mx + 12, y0 - 14, mx, y0 + 2], T.goldHi);
      });
    });
  },
};

// ===================== S11 — Keşişler durdu, birbirlerine baktı =====================
const M11 = [{ x: 560, f: 1 }, { x: 1180, f: -1 }, { x: 1560, f: -1 }];
const S11: Shot = {
  id: 'S11', scene: 'C · Manastır', dur: 7.5, trans: 'fade',
  text: 'Keşişler durdu, birbirlerine baktı.',
  triggers: [{ w: 'Keşişler', at: 0.3 }, { w: 'durdu', at: 1.4 }, { w: 'birbirlerine baktı', at: 3.0 }],
  render(t) {
    applyCam(kcam(t, [[0, C(1060, 560, 1.0)], [7.5, C(1060, 530, 1.16)]], E.sine));
    room(t, 1.1);
    aroma(960, 900, t, 1900, 1000, 1, 9, 3);
    const frozen = t >= 1.4;
    const pt = frozen ? 1.4 : t;
    const look = P(t, 3.0, 0.4);
    const heads = M11.map(m => ({ x: m.x + m.f * 10, y: GROUND + 40 - 275 }));
    M11.forEach((m, i) => {
      const k = P(t, 0.3 + i * 0.15, 0.4, E.back);
      if (k > 0 && t < 1.6) glow(m.x, GROUND - 120, 300, T.goldHi, 0.25 * k * (1 - P(t, 1.2, 0.4)));
      let headF = 1;
      if (i === 1) headF = look > 0.5 ? (t < 4.6 ? -1 : 1) : 1;
      if (i === 2) headF = 1;
      const robe = i === 0 ? T.robe : i === 1 ? '#6A4630' : '#4E3524';
      monk(m.x, GROUND + 40, 1, m.f, { prop: i === 1 ? 'book' : i === 2 ? 'broom' : null, propT: pt, headF, mouth: look > 0 ? 'o' : 'flat', brow: look * 0.8, robe, arm: i === 1 ? 0.7 : 0, beardCol: i === 2 ? '#8C8070' : undefined });
      // donma çizgileri
      if (frozen) { const fk = P(t, 1.4, 0.3, E.back) * (1 - P(t, 2.6, 0.4)); if (fk > 0) for (let j = 0; j < 3; j++) { const a = -Math.PI / 2 + (j - 1) * 0.5; const h = heads[i]; line(h.x + Math.cos(a) * 60, h.y + Math.sin(a) * 60, h.x + Math.cos(a) * (60 + 34 * fk), h.y + Math.sin(a) * (60 + 34 * fk), T.cream, 5); } }
    });
    // bakış hatları
    const pairs: [number, number][] = [[0, 1], [1, 2], [0, 2]];
    pairs.forEach(([a, b], i) => {
      const k = P(t, 3.1 + i * 0.3, 0.5, E.out);
      if (k <= 0) return;
      const A = heads[a], B = heads[b];
      dashed(() => line(A.x, A.y, lerp(A.x, B.x, k), lerp(A.y, B.y, k) - (i === 2 ? Math.sin(k * Math.PI) * 0 : 0), rgba(T.goldHi, 0.85), 4), [12, 10], -t * 30);
    });
    onScreen(() => tag(120, 820, 'KEŞİŞLER', '', P(t, 0.3, 0.8) * (1 - P(t, 2.8, 0.5))));
    flash(t, 1.4, 0.35, 0.75);
    if (frozen) overlay('#1A1410', 0.12 * (1 - P(t, 2.4, 0.6)));
    overlay('#0B0806', P(t, 6.2, 1.3, E.in));
  },
};

const SHOTS: Shot[] = [S00, S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11];
