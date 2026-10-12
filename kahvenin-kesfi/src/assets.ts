// ===== Tekrar eden varlıklar: dekor + karakterler =====

// ---------- Gökyüzü ve dekor ----------
interface Sky { top: string; bot: string }
const SKY = {
  day: { top: '#7FB6CC', bot: '#F3DDB0' },
  sunset: { top: '#5B3C5E', bot: '#F08A4B' },
  dusk: { top: '#2B2440', bot: '#8A4F5A' },
  night: { top: '#12101E', bot: '#3A2A44' },
};
function skyMix(a: Sky, b: Sky, k: number): Sky { return { top: mix(a.top, b.top, k), bot: mix(a.bot, b.bot, k) }; }
/** Ekran uzayında gökyüzü (kameradan önce çağır) */
function drawSky(s: Sky, horizon = 0.85) {
  const g = X.createLinearGradient(0, 0, 0, H * horizon);
  g.addColorStop(0, s.top); g.addColorStop(1, s.bot);
  X.fillStyle = g; X.fillRect(0, 0, W, H);
}
function stars(a: number, t: number) {
  if (a <= 0) return;
  const r = rng(7);
  for (let i = 0; i < 90; i++) {
    const x = r() * W, y = r() * H * 0.55, tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
    circ(x, y, 1 + r() * 2, rgba('#FFF4D8', a * (0.4 + 0.6 * tw)));
  }
}
function sun(x: number, y: number, r: number, color: string, glowA = 1) {
  glow(x, y, r * 3.2, color, 0.6 * glowA);
  circ(x, y, r, color);
}
/** Paralaks tepe katmanı. depth: 0 = kamerayla sabit (uzak), 1 = dünya ile birlikte */
function hills(base: number, amp: number, freq: number, seed: number, color: string, depth = 1) {
  X.save();
  X.translate((CUR_CAM.x - 960) * (1 - depth), (CUR_CAM.y - 540) * (1 - depth) * 0.6);
  X.beginPath(); X.moveTo(-3000, 4000);
  for (let x = -3000; x <= 6000; x += 30) {
    const y = base + amp * Math.sin(x * freq + seed) + amp * 0.45 * Math.sin(x * freq * 2.7 + seed * 3.1) + amp * 0.15 * Math.sin(x * freq * 7.1 + seed);
    X.lineTo(x, y);
  }
  X.lineTo(6000, 4000); X.closePath(); fs(color);
  X.restore();
}
function hillY(x: number, base: number, amp: number, freq: number, seed: number) {
  return base + amp * Math.sin(x * freq + seed) + amp * 0.45 * Math.sin(x * freq * 2.7 + seed * 3.1) + amp * 0.15 * Math.sin(x * freq * 7.1 + seed);
}
/** Standart yayla dekoru (süreklilik kilidi): tüm dış mekan shot'ları aynı katmanları kullanır */
function highland(tint: number, nightK = 0) {
  const dk = (c: string) => mix(mix(c, '#5B3C5E', tint * 0.45), '#15121F', nightK * 0.7);
  hills(560, 50, 0.0021, 1.0, dk(T.hillFar), 0.25);
  hills(650, 60, 0.0016, 2.2, dk(T.hillMid), 0.55);
  acacia(1500, hillY(1500, 650, 60, 0.0016, 2.2) + 10, 0.8, dk(T.leafDark), dk('#4A3524'));
  acacia(300, hillY(300, 650, 60, 0.0016, 2.2) + 10, 0.6, dk(T.leafDark), dk('#4A3524'));
  hills(800, 26, 0.0011, 0.4, dk(T.hillNear), 1);
}
function acacia(x: number, y: number, s: number, leaf: string, trunk: string) {
  at(x, y, s, 0, () => {
    poly([-8, 0, 8, 0, 4, -90, 30, -150, 24, -154, 0, -110, -26, -150, -32, -146, -4, -92], trunk);
    ell(0, -160, 130, 26, 0, leaf);
    ell(-50, -172, 70, 18, 0, leaf);
    ell(55, -170, 60, 16, 0, leaf);
  });
}
function grassTufts(seed: number, y0: number, x0: number, x1: number, color: string, t = 0) {
  const r = rng(seed);
  for (let i = 0; i < 40; i++) {
    const x = lerp(x0, x1, r()), y = y0 + r() * 220, h = 14 + r() * 18, sw = Math.sin(t * 2 + i) * 3;
    poly([x - 6, y, x + sw, y - h, x + 6, y], color);
  }
}

/** Tukul: Etiyopya yuvarlak kulübesi */
function hut(x: number, y: number, s: number, smokeT = -1, k = 1, light = 0) {
  if (k <= 0) return;
  at(x, y, s * E.back(clamp(k)), 0, () => {
    rrect(-110, -150, 220, 150, 10, T.mud);
    rrect(-110, -150, 50, 150, 10, T.mudDark);
    rrect(-28, -100, 56, 100, 26, light > 0 ? mix('#2A1A10', T.fire2, light) : '#2A1A10');
    poly([-150, -140, 0, -300, 150, -140], T.thatch);
    poly([-150, -140, 0, -300, -60, -140], T.thatchDark);
    for (let i = 0; i < 5; i++) line(-130 + i * 60, -140, 0, -296, rgba(T.thatchDark, 0.6), 3);
    if (smokeT >= 0) {
      for (let i = 0; i < 6; i++) {
        const ph = (smokeT * 0.35 + i / 6) % 1;
        circ(Math.sin(ph * 6 + i) * 20 + ph * 60, -310 - ph * 200, 12 + ph * 30, rgba('#E9E1D3', 0.5 * (1 - ph)));
      }
    }
  });
}
/** Ağıl (çit) */
function pen(x: number, y: number, s: number) {
  at(x, y, s, 0, () => {
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const px = Math.cos(a) * 220, py = Math.sin(a) * 40;
      line(px, py, px, py - 70, '#6B4A2E', 10);
    }
    smooth([-220, -55, -150, -80, 0, -95, 150, -80, 220, -55], null, '#6B4A2E', 7);
    smooth([-220, -25, -150, -50, 0, -65, 150, -50, 220, -25], null, '#6B4A2E', 7);
  });
}

/** Manastır: yuvarlak Etiyopya kilisesi */
function monastery(x: number, y: number, s: number, lightK = 1, k = 1) {
  if (k <= 0) return;
  at(x, y, s * E.back(clamp(k)), 0, () => {
    rrect(-260, -90, 520, 90, 6, T.stoneDark);
    for (let i = 0; i < 6; i++) rrect(-250 + i * 88, -120, 60, 34, 4, T.stoneDark);
    rrect(-150, -260, 300, 260, 8, T.stone);
    rrect(-150, -260, 70, 260, 8, mix(T.stone, T.stoneDeep, 0.35));
    poly([-190, -250, 0, -420, 190, -250], T.thatch);
    poly([-190, -250, 0, -420, -60, -250], T.thatchDark);
    line(0, -420, 0, -500, T.gold, 10);
    line(-28, -470, 28, -470, T.gold, 10);
    circ(0, -500, 8, T.gold);
    const wl = mix('#2A1A10', T.fire2, lightK);
    for (const wx of [-90, 60]) { rrect(wx, -200, 34, 56, 17, wl); if (lightK > 0) glow(wx + 17, -172, 70, T.fire2, lightK * 0.7); }
    rrect(-34, -120, 68, 120, 34, wl);
    if (lightK > 0) glow(0, -60, 110, T.fire2, lightK * 0.6);
  });
}

// ---------- Kahve çalısı ----------
interface BushP { berries?: number; lit?: number; glowA?: number; missing?: number; sway?: number; roast?: number }
const BUSH_LEAVES = (() => { const r = rng(42); const a: number[][] = []; for (let i = 0; i < 46; i++) { const ang = r() * TAU, d = Math.sqrt(r()); a.push([Math.cos(ang) * d * 190, -150 + Math.sin(ang) * d * 120, r() * TAU, 0.7 + r() * 0.5, r()]); } return a; })();
const BUSH_BERRIES = (() => { const r = rng(9); const a: number[][] = []; for (let i = 0; i < 22; i++) { const ang = r() * TAU, d = 0.35 + Math.sqrt(r()) * 0.6; a.push([Math.cos(ang) * d * 170, -150 + Math.sin(ang) * d * 105, r()]); } return a; })();
function bush(x: number, y: number, s: number, p: BushP = {}) {
  const lit = p.lit ?? 1, sway = p.sway ?? 0;
  at(x, y, s, 0, () => {
    poly([-14, 0, 14, 0, 8, -90, -8, -90], mix('#2A1A10', '#5A3E28', lit));
    for (const [lx, ly, rot, sc, sh] of BUSH_LEAVES) {
      const c = mix('#141A12', sh > 0.5 ? T.leaf : sh > 0.2 ? T.leafDark : T.leafHi, lit);
      ell(lx + Math.sin(sway + ly) * 4, ly, 46 * sc, 20 * sc, rot, c);
    }
    const bk = p.berries ?? 1;
    BUSH_BERRIES.forEach(([bx, by, d], i) => {
      if (i === (p.missing ?? -1)) return;
      const k = E.back(clamp(bk * 1.6 - d * 0.6));
      if (k <= 0) return;
      if ((p.glowA ?? 0) > 0) glow(bx, by, 50 * k, T.berry, (p.glowA ?? 0) * 0.5);
      berry(bx, by, 15 * k, p.roast ?? 0);
    });
  });
}
function berry(x: number, y: number, r: number, roast = 0) {
  const body = roast < 0.5 ? mix(T.berry, T.beanMid, roast * 2) : mix(T.beanMid, T.bean, (roast - 0.5) * 2);
  circ(x, y, r, body);
  circ(x - r * 0.35, y - r * 0.35, r * 0.28, rgba(roast < 0.5 ? T.berryHi : '#C08A5A', 0.8 - roast * 0.4));
  circ(x + r * 0.5, y + r * 0.1, r * 0.12, rgba('#000000', 0.25));
}
/** Kavrulmuş çekirdek glifi */
function bean(x: number, y: number, r: number, rot: number, color = T.bean) {
  at(x, y, 1, rot, () => {
    ell(0, 0, r, r * 0.7, 0, color);
    smooth([-r * 0.8, 0, -r * 0.2, -r * 0.18, r * 0.2, r * 0.18, r * 0.8, 0], null, mix(color, '#000000', 0.5), r * 0.16);
  });
}

// ---------- Ateş ----------
function fire(x: number, y: number, s: number, t: number, k = 1) {
  if (k <= 0) return;
  glow(x, y - 80 * s, 420 * s * k, T.fire2, 0.55 * k);
  at(x, y, s, 0, () => {
    // odunlar
    rrect(-120, -26, 240, 30, 14, '#4A2E1C');
    at(0, -8, 1, 0.3, () => rrect(-110, -14, 220, 26, 12, '#5E3A22'));
    const layers: [string, number, number][] = [[T.fire3, 1.0, 0], [T.fire2, 0.72, 1.3], [T.fire1, 0.45, 2.7]];
    for (const [col, sc, ph] of layers) {
      X.beginPath(); X.moveTo(-110 * sc, -10);
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const fx = lerp(-110, 110, i / n) * sc;
        const hh = (160 + 70 * Math.sin(t * 9 + i * 1.7 + ph)) * sc * k * (1 - Math.abs(i / n - 0.5) * 0.9);
        X.quadraticCurveTo(fx - 12 * sc, -hh * 0.4, fx + Math.sin(t * 6 + i) * 10, -hh);
        X.quadraticCurveTo(fx + 12 * sc, -hh * 0.4, fx + 16 * sc, -10);
      }
      X.closePath(); fs(col);
    }
    // kıvılcımlar
    const r = rng(3);
    for (let i = 0; i < 14; i++) {
      const ph = (t * (0.5 + r() * 0.6) + r()) % 1;
      circ(Math.sin(i * 3 + t * 2) * 60 * ph + (r() - 0.5) * 120, -60 - ph * 300, 4 * (1 - ph), rgba(T.fire1, (1 - ph) * k));
    }
  });
}
/** Koku şeritleri */
function aroma(x: number, y: number, t: number, width: number, height: number, k: number, n = 5, seed = 1) {
  if (k <= 0) return;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const ox = (r() - 0.5) * width, sp = 0.6 + r() * 0.5, ph = r() * TAU;
    const rise = clamp(k * 1.3 - i * 0.08);
    if (rise <= 0) continue;
    X.beginPath();
    const steps = 40;
    for (let j = 0; j <= steps * rise; j++) {
      const f = j / steps;
      const px = x + ox + Math.sin(f * 5 + t * sp * 2 + ph) * (40 + f * width * 0.18) + Math.sin(f * 11 + t) * 8;
      const py = y - f * height;
      j === 0 ? X.moveTo(px, py) : X.lineTo(px, py);
    }
    X.save(); X.globalAlpha *= 0.55;
    fs(null, T.aroma, 10 + (i % 3) * 4);
    X.restore();
  }
}

// ---------- Karakterler ----------
interface KP {
  walk?: number; walkAmt?: number; run?: number;
  arm?: number; armUp?: number; back?: number; startle?: number; droop?: number;
  mouth?: 'smile' | 'o' | 'flat' | 'chew' | 'grin' | 'frown'; brow?: number; glowEyes?: number;
  look?: number; staff?: boolean; hands?: 'berries' | 'berry' | null; lid?: number; handOverEyes?: number;
}
/** Kaldi — ayak noktası (x,y), yükseklik ≈ 300*s, f: 1 sağa, -1 sola bakar */
function kaldi(x: number, y: number, s: number, f: number, p: KP = {}) {
  at(x, y, s, 0, () => {
    X.scale(f, 1);
    const w = p.walk ?? 0, amt = p.walkAmt ?? 0, run = p.run ?? 0, st = p.startle ?? 0;
    const bob = -Math.abs(Math.sin(w)) * (8 + run * 14) * amt - st * 50;
    const sw = Math.sin(w) * (0.45 + run * 0.35) * amt;
    const hipY = -120 + bob;
    // bacaklar
    const leg = (lx: number, a: number, col: string) => {
      const kx = lx + Math.sin(a) * 62, ky = hipY + Math.cos(a) * 62;
      const fa = a - Math.max(0, -a) * 1.2 * (run + 0.3) * amt;
      const fx = kx + Math.sin(fa) * 60, fy = ky + Math.cos(fa) * 60;
      line(lx, hipY, kx, ky, col, 17); line(kx, ky, fx, fy, col, 15);
      ell(fx + 10, fy + 2, 16, 7, 0, col);
    };
    leg(-6, -sw - st * 0.4, T.skinDark);
    leg(8, sw + st * 0.4, T.skin);
    at(0, hipY, 1, (p.droop ?? 0) * 0.32 + run * 0.18 - st * 0.12, () => {
      // arka kol + asa
      const armL = (a1: number, a2: number, col: string, ox: number) => {
        const ex = ox + Math.cos(a1) * 52, ey = -112 + Math.sin(a1) * 52;
        const hx = ex + Math.cos(a2) * 50, hy = ey + Math.sin(a2) * 50;
        line(ox, -112, ex, ey, col, 15); line(ex, ey, hx, hy, col, 13);
        circ(hx, hy, 10, col);
        return [hx, hy];
      };
      const swing = sw * 0.9;
      const backA1 = lerp(1.75 + swing, -2.2, st) - (p.handOverEyes ?? 0) * 0;
      const [bhx, bhy] = armL(backA1, backA1 - 0.25, T.skinDark, -8);
      if (p.staff) {
        line(bhx - 6, bhy - 120, bhx + 12, bhy + 160 - bob, '#6B4A2E', 9);
        X.beginPath(); X.arc(bhx - 20, bhy - 120, 14, 0, Math.PI, true); fs(null, '#6B4A2E', 9);
      }
      // gövde (şamma)
      poly([-36, -126, 36, -126, 46, 18, -46, 18], T.cloth);
      poly([-36, -126, -10, -126, -18, 18, -46, 18], T.clothShade);
      line(-30, -122, 40, 10, T.gold, 7);
      line(-30, -112, 38, 0, T.berryDark, 3);
      // baş
      at(0, -168, 1, 0, () => {
        rrect(-12, 2, 24, 22, 6, T.skinDark);
        circ(0, 0, 36, T.skin);
        X.beginPath(); X.arc(0, -4, 37, Math.PI * 1.05, Math.PI * 2.05); fs(T.hair);
        for (let i = 0; i < 6; i++) circ(-30 + i * 11, -30 + Math.abs(i - 2.5) * 3, 9, T.hair);
        circ(-8, 4, 8, T.skinDark); // kulak
        const lk = (p.look ?? 0) * 5, br = (p.brow ?? 0) * 9;
        const lid = p.lid ?? 0;
        // göz
        ell(18, -4, 7, 8 * (1 - lid * 0.85), 0, '#FFFFFF');
        circ(19 + lk, -3 + lid * 2, 4 * (1 - lid * 0.5), T.hair);
        line(10, -18 - br, 28, -16 - br * 1.1, T.hair, 4);
        if ((p.glowEyes ?? 0) > 0) {
          glow(19, -4, 50, T.goldHi, p.glowEyes);
          sparkle(22, -8, 16 * (p.glowEyes ?? 0), 0.3, T.goldHi);
        }
        // ağız
        const m = p.mouth ?? 'flat';
        if (m === 'smile' || m === 'grin') { X.beginPath(); X.arc(22, 12, m === 'grin' ? 11 : 8, 0.15, Math.PI - 0.6); fs(m === 'grin' ? '#FFFFFF' : null, T.hair, 3.5); }
        else if (m === 'o') ell(24, 16, 5, 7, 0, T.hair);
        else if (m === 'chew') ell(24, 15, 7, 3 + Math.abs(Math.sin(w * 3)) * 3, 0, T.hair);
        else if (m === 'frown') { X.beginPath(); X.arc(22, 22, 8, Math.PI + 0.6, -0.2); fs(null, T.hair, 3.5); }
        else line(17, 15, 28, 15, T.hair, 3.5);
        ell(31, 3, 5, 7, 0, T.skinDark); // burun
      });
      // ön kol
      const reach = p.arm ?? 0, up = p.armUp ?? 0;
      let a1 = lerp(1.45 - swing, -0.15, reach);
      a1 = lerp(a1, -1.05, up);
      a1 = lerp(a1, -2.0, st);
      let a2 = lerp(a1 - 0.35, a1 + 0.1, reach);
      a2 = lerp(a2, -2.6, up);
      const [hx, hy] = armL(a1, a2, T.skin, 10);
      if (p.hands === 'berries') { for (let i = 0; i < 7; i++) berry(hx - 14 + (i % 4) * 10, hy - 10 - Math.floor(i / 4) * 12, 9); }
      if (p.hands === 'berry') berry(hx + 4, hy - 12, 10);
    });
  });
}

interface GP { phase?: number; jump?: number; rear?: number; col?: number; headDown?: number; walkAmt?: number; tuck?: number; ghost?: number }
/** Keçi — ayak noktası, uzunluk ≈ 160*s */
function goat(x: number, y: number, s: number, f: number, p: GP = {}) {
  const colors = [T.goatW, T.goatB, T.goatW, T.goatBr];
  const col = colors[p.col ?? 0];
  const ghost = p.ghost ?? 0;
  at(x, y - (p.jump ?? 0), s, 0, () => {
    X.scale(f, 1);
    X.translate(-40, -62); X.rotate(-(p.rear ?? 0) * 0.75); X.translate(40, 62);
    const ph = p.phase ?? 0, wa = p.walkAmt ?? 0, tuck = p.tuck ?? 0;
    const legCol = mix(col, '#000000', 0.25);
    const stroke = ghost ? col : null;
    const legF = ghost ? (a: number, b: number, c: number, d: number) => dashed(() => line(a, b, c, d, col, 5)) : (a: number, b: number, c: number, d: number) => line(a, b, c, d, legCol, 9);
    const legs: [number, number][] = [[-42, 0], [-30, Math.PI], [42, Math.PI], [54, 0]];
    for (const [lx, lph] of legs) {
      const a = Math.sin(ph + lph) * 0.4 * wa;
      const fx = lx + Math.sin(a) * 60 + tuck * (lx > 0 ? -18 : 18), fy = -62 + Math.cos(a) * 60 * (1 - tuck * 0.45);
      legF(lx, -64, fx, fy);
    }
    const shape = () => {
      X.beginPath(); X.ellipse(0, -82, 64, 30, 0, 0, TAU);
      X.moveTo(40, -96); X.lineTo(70, -136); X.lineTo(90, -126); X.lineTo(60, -70);
    };
    if (ghost) {
      dashed(() => { shape(); fs(null, col, 5); X.beginPath(); X.ellipse(86, -138 + (p.headDown ?? 0) * 40, 26, 15, 0.45, 0, TAU); fs(null, col, 5); });
      return;
    }
    shape(); fs(col, stroke);
    if (p.col === 2) { ell(-20, -88, 18, 12, 0.3, T.goatBr); ell(18, -74, 12, 9, 0, T.goatBr); }
    poly([-60, -98, -78, -112, -66, -88], col);
    at(86, -138 + (p.headDown ?? 0) * 40, 1, 0.45 + (p.headDown ?? 0) * 0.5, () => {
      ell(0, 0, 26, 15, 0, col);
      ell(-14, -8, 14, 6, -0.8, mix(col, '#000000', 0.15));
      X.beginPath(); X.moveTo(-8, -12); X.quadraticCurveTo(-30, -44, -48, -30); fs(null, T.horn, 7);
      circ(4, -5, 3.5, T.hair);
      poly([8, 12, 16, 12, 10, 30], mix(col, '#000000', 0.3));
    });
  });
}

interface MP { arm?: number; armUp?: number; headF?: number; brow?: number; mouth?: 'flat' | 'frown' | 'o' | 'smile'; prop?: 'book' | 'broom' | null; propT?: number; sniff?: number; robe?: string; beardCol?: string }
/** Keşiş — ayak noktası */
function monk(x: number, y: number, s: number, f: number, p: MP = {}) {
  const robe = p.robe ?? T.robe;
  at(x, y, s, 0, () => {
    X.scale(f, 1);
    poly([-40, -230, 40, -230, 70, 0, -70, 0], robe);
    poly([-40, -230, -10, -230, -24, 0, -70, 0], mix(robe, '#000000', 0.25));
    line(-38, -150, 44, -150, mix(robe, '#FFFFFF', 0.25), 6);
    const pt = p.propT ?? 0;
    if (p.prop === 'broom') {
      const a = Math.sin(pt * 6) * 0.25;
      at(30, -150, 1, a, () => { line(0, 0, 40, 170, '#8A6A3E', 8); poly([20, 160, 70, 165, 80, 215, 20, 215], T.thatch); });
    }
    // baş: başa göre ayrı yön
    at(0, -270, 1, 0, () => {
      X.scale(p.headF ?? 1, 1);
      circ(0, 0, 36, T.skin);
      // beyaz sarık / takke
      X.beginPath(); X.arc(0, -6, 38, Math.PI, TAU); fs(T.capW);
      rrect(-38, -10, 76, 12, 6, mix(T.capW, '#000000', 0.12));
      // sakal
      poly([-20, 14, 32, 14, 22, 58, 6, 66, -14, 40], p.beardCol ?? '#3A2E28');
      const br = (p.brow ?? 0) * 8;
      ell(18, 2, 6, 7, 0, '#FFFFFF'); circ(20, 3, 3.5, T.hair);
      line(8, -10 - br, 28, -12 + (p.brow ?? 0) * -2 + ((p.brow ?? 0) < 0 ? 10 : 0), T.hair, 4);
      ell(32, 8, 5, 7, 0, T.skinDark);
      const m = p.mouth ?? 'flat';
      if (m === 'o') ell(22, 24, 5, 6, 0, T.hair);
      else if (m === 'frown') { X.beginPath(); X.arc(20, 30, 7, Math.PI + 0.5, -0.3); fs(null, T.hair, 3.5); }
      else if (m === 'smile') { X.beginPath(); X.arc(20, 20, 7, 0.2, Math.PI - 0.6); fs(null, T.hair, 3.5); }
      else line(14, 24, 26, 24, T.hair, 3.5);
    });
    // kol
    const reach = p.arm ?? 0, up = p.armUp ?? 0;
    let a1 = lerp(1.35, -0.2, reach); a1 = lerp(a1, -1.3, up);
    const a2 = lerp(a1 - 0.6, a1, reach) - up * 0.6;
    const ex = 14 + Math.cos(a1) * 56, ey = -205 + Math.sin(a1) * 56;
    const hx = ex + Math.cos(a2) * 54, hy = ey + Math.sin(a2) * 54;
    line(14, -205, ex, ey, mix(robe, '#FFFFFF', 0.1), 22); line(ex, ey, hx, hy, mix(robe, '#FFFFFF', 0.1), 18);
    circ(hx, hy, 10, T.skin);
    if (p.prop === 'book') {
      at(hx + 10, hy - 6, 1, -0.15, () => {
        rrect(-36, -26, 72, 52, 4, '#7A2E22');
        rrect(-32, -22, 64, 44, 3, T.cream);
        line(0, -22, 0, 22, T.stoneDark, 2);
        const pf = Math.abs(Math.sin(pt * 2));
        poly([0, -22, 32 - pf * 50, -24, 32 - pf * 50, 20, 0, 22], '#F8F0E0');
      });
    }
  });
}

// ---------- Harita ----------
const AFRICA = [150, 40, 230, 20, 330, 30, 400, 48, 440, 62, 462, 110, 492, 168, 520, 214, 548, 240, 600, 246, 588, 290, 548, 352, 506, 420, 494, 480, 470, 540, 430, 604, 382, 660, 320, 692, 272, 680, 244, 622, 222, 540, 204, 462, 192, 402, 176, 356, 200, 330, 216, 318, 168, 300, 118, 292, 62, 262, 22, 204, 30, 132, 82, 80];
const ETHIOPIA = [446, 196, 492, 182, 520, 214, 548, 240, 532, 266, 508, 300, 470, 306, 442, 276, 436, 230];
const ETH_C = { x: 488, y: 244 };
