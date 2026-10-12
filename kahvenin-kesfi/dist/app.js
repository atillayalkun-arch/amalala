"use strict";
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
    lin: (x) => x,
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    back: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    elastic: (x) => (x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1),
    expo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
};
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
/** start'tan itibaren dur süresinde 0→1 ilerleme */
const P = (t, start, dur, ease = E.inOut) => ease(clamp((t - start) / dur));
/** giriş ve çıkışı olan görünürlük zarfı */
const env = (t, a, b, fade = 0.4) => P(t, a, fade, E.out) * (1 - P(t, b - fade, fade, E.in));
function kf(t, keys, ease = E.inOut) {
    if (t <= keys[0][0])
        return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
        const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
        if (t <= t1)
            return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
    }
    return keys[keys.length - 1][1];
}
function kcam(t, keys, ease = E.inOut) {
    const pick = (k) => kf(t, keys.map(([tt, c]) => [tt, c[k]]), ease);
    return { x: pick('x'), y: pick('y'), z: pick('z'), r: pick('r') };
}
const C = (x, y, z = 1, r = 0) => ({ x, y, z, r });
// --- Renk ---
function hex2rgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, k) {
    const A = hex2rgb(a), B = hex2rgb(b);
    k = clamp(k);
    const c = A.map((v, i) => Math.round(lerp(v, B[i], k)));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
function rgba(h, a) { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }
// --- Deterministik rastgele ---
function rng(seed) {
    return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// --- Aktif bağlam ---
let X;
let CUR_CAM = C(960, 540);
function applyCam(c, shake = 0, seed = 0) {
    CUR_CAM = c;
    let sx = 0, sy = 0;
    if (shake > 0) {
        sx = Math.sin(seed * 91.7) * shake;
        sy = Math.cos(seed * 77.3) * shake;
    }
    X.translate(W / 2 + sx, H / 2 + sy);
    X.rotate(c.r);
    X.scale(c.z, c.z);
    X.translate(-c.x, -c.y);
}
// --- Primitifler ---
function fs(fill, stroke, lw = T.lw) {
    if (fill) {
        X.fillStyle = fill;
        X.fill();
    }
    if (stroke) {
        X.lineWidth = lw;
        X.strokeStyle = stroke;
        X.lineJoin = 'round';
        X.lineCap = 'round';
        X.stroke();
    }
}
function circ(x, y, r, f, s, lw) {
    if (r <= 0)
        return;
    X.beginPath();
    X.arc(x, y, r, 0, TAU);
    fs(f, s, lw);
}
function ell(x, y, rx, ry, rot, f, s, lw) {
    if (rx <= 0 || ry <= 0)
        return;
    X.beginPath();
    X.ellipse(x, y, rx, ry, rot, 0, TAU);
    fs(f, s, lw);
}
function poly(pts, f, s, lw, close = true) {
    X.beginPath();
    X.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2)
        X.lineTo(pts[i], pts[i + 1]);
    if (close)
        X.closePath();
    fs(f, s, lw);
}
function line(x1, y1, x2, y2, s, lw = T.lw) {
    X.beginPath();
    X.moveTo(x1, y1);
    X.lineTo(x2, y2);
    fs(null, s, lw);
}
function rrect(x, y, w, h, r, f, s, lw) {
    X.beginPath();
    X.roundRect(x, y, w, h, r);
    fs(f, s, lw);
}
/** Yumuşak eğri: noktalar arasından quadratic geçer */
function smooth(pts, f, s, lw, close = false) {
    X.beginPath();
    X.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length - 2; i += 2) {
        const mx = (pts[i] + pts[i + 2]) / 2, my = (pts[i + 1] + pts[i + 3]) / 2;
        X.quadraticCurveTo(pts[i], pts[i + 1], mx, my);
    }
    X.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
    if (close)
        X.closePath();
    fs(f, s, lw);
}
function alpha(a, fn) {
    if (a <= 0.001)
        return;
    X.save();
    X.globalAlpha *= clamp(a);
    fn();
    X.restore();
}
function at(x, y, s, rot, fn) {
    X.save();
    X.translate(x, y);
    if (rot)
        X.rotate(rot);
    if (s !== 1)
        X.scale(s, s);
    fn();
    X.restore();
}
function txt(str, x, y, size, color, o = {}) {
    X.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 'normal'} ${size}px ${o.font ?? T.sans}`;
    X.textAlign = o.align ?? 'center';
    X.textBaseline = o.base ?? 'middle';
    X.letterSpacing = (o.spacing ?? 0) + 'px';
    if (o.shadow) {
        X.shadowColor = 'rgba(0,0,0,0.45)';
        X.shadowBlur = 12;
        X.shadowOffsetY = 3;
    }
    X.fillStyle = color;
    X.fillText(str, x, y);
    X.shadowColor = 'transparent';
    X.shadowBlur = 0;
    X.shadowOffsetY = 0;
    X.letterSpacing = '0px';
}
function dashed(fn, dash = [14, 12], offset = 0) {
    X.save();
    X.setLineDash(dash);
    X.lineDashOffset = offset;
    fn();
    X.restore();
}
// ===== Belgesel grafik elemanları =====
/** Alt bant etiketi (lower-third): çizgi uzar, metin maskeden kayar */
function tag(x, y, title, sub, k, color = T.gold, dark = false, k2 = k) {
    if (k <= 0)
        return;
    const lw = 340 * E.out(clamp(k * 1.6));
    const tk = E.out(clamp((k - 0.25) / 0.75));
    X.save();
    line(x, y, x + lw, y, color, 5);
    X.beginPath();
    X.rect(x - 10, y - 90, 700, 88);
    X.clip();
    txt(title, x, y - 34 + (1 - tk) * 60, 52, dark ? T.ink : T.cream, { align: 'left', weight: 'bold', spacing: 6, font: T.serif, shadow: !dark });
    X.restore();
    X.save();
    X.beginPath();
    X.rect(x - 10, y + 2, 700, 60);
    X.clip();
    const sk = E.out(clamp((k2 - 0.25) / 0.75));
    txt(sub, x, y + 28 - (1 - sk) * 50, 28, dark ? T.ink : color, { align: 'left', spacing: 3, shadow: !dark });
    X.restore();
}
/** Küçük rozet (chip) */
function chip(x, y, label, k, bg = T.gold, fg = T.ink) {
    if (k <= 0)
        return;
    const s = E.back(clamp(k));
    at(x, y, s, 0, () => {
        X.font = `bold 30px ${T.sans}`;
        const w = X.measureText(label).width + 44;
        rrect(-w / 2, -26, w, 52, 26, bg);
        txt(label, 0, 1, 30, fg, { weight: 'bold' });
    });
}
/** Ok + etiket (bilgi işaretçisi) */
function pointer(x1, y1, x2, y2, label, k, color = T.cream, size = 30) {
    if (k <= 0)
        return;
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
function soundRings(x, y, t, k, color = T.cream, wobble = 0, dir = 0, spread = 1.2) {
    if (k <= 0)
        return;
    for (let i = 0; i < 4; i++) {
        const ph = ((t * 1.1 + i / 4) % 1);
        const r = 30 + ph * 220;
        X.save();
        X.globalAlpha *= (1 - ph) * k;
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
function note(x, y, s, color, double = false) {
    at(x, y, s, 0, () => {
        ell(0, 0, 14, 10, -0.4, color);
        line(12, -2, 12, -56, color, 5);
        if (double) {
            ell(40, -8, 14, 10, -0.4, color);
            line(52, -10, 52, -62, color, 5);
            poly([12, -56, 52, -62, 52, -50, 12, -44], color);
        }
        else
            smooth([12, -56, 30, -44, 34, -24], null, color, 5);
    });
}
function sparkle(x, y, r, rot, color) {
    at(x, y, 1, rot, () => {
        X.beginPath();
        for (let i = 0; i < 8; i++) {
            const rr = i % 2 === 0 ? r : r * 0.22, a = (i / 8) * TAU;
            i === 0 ? X.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : X.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        X.closePath();
        fs(color);
    });
}
function glow(x, y, r, color, a = 1) {
    if (r <= 0 || a <= 0)
        return;
    const g = X.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(color, 0.9 * a));
    g.addColorStop(0.4, rgba(color, 0.35 * a));
    g.addColorStop(1, rgba(color, 0));
    X.fillStyle = g;
    X.beginPath();
    X.arc(x, y, r, 0, TAU);
    X.fill();
}
function bang(x, y, s, color = T.gold) {
    at(x, y, s, 0, () => {
        poly([-10, -70, 10, -70, 6, -10, -6, -10], color);
        circ(0, 12, 9, color);
    });
}
function qmark(x, y, s, color = T.cream, rot = 0) {
    at(x, y, s, rot, () => txt('?', 0, 0, 80, color, { weight: 'bold', font: T.serif, shadow: true }));
}
/** Düşünce balonu */
function thought(x, y, r, k, fromX, fromY, fill = T.cream) {
    if (k <= 0)
        return;
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
function clock(x, y, r, minute, k) {
    if (k <= 0)
        return;
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
        X.beginPath();
        X.moveTo(0, 0);
        X.arc(0, 0, r * 0.7, -Math.PI / 2, -Math.PI / 2 + (minute % 1) * TAU);
        X.closePath();
        fs(rgba(T.gold, 0.35));
        circ(0, 0, 10, T.berryDark);
    });
}
/** Enerji pili */
function battery(x, y, s, level, k) {
    if (k <= 0)
        return;
    at(x, y, s * E.back(clamp(k)), 0, () => {
        rrect(-80, -38, 160, 76, 14, T.ink, T.cream, 6);
        rrect(82, -14, 14, 28, 4, T.cream);
        const col = level < 0.3 ? '#C9772E' : level < 0.7 ? T.gold : '#9BC45A';
        rrect(-70, -28, 140 * clamp(level), 56, 8, col);
    });
}
// ===== Tekrar eden varlıklar: dekor + karakterler =====
const SKY = {
    day: { top: '#7FB6CC', bot: '#F3DDB0' },
    sunset: { top: '#5B3C5E', bot: '#F08A4B' },
    dusk: { top: '#2B2440', bot: '#8A4F5A' },
    night: { top: '#12101E', bot: '#3A2A44' },
};
function skyMix(a, b, k) { return { top: mix(a.top, b.top, k), bot: mix(a.bot, b.bot, k) }; }
/** Ekran uzayında gökyüzü (kameradan önce çağır) */
function drawSky(s, horizon = 0.85) {
    const g = X.createLinearGradient(0, 0, 0, H * horizon);
    g.addColorStop(0, s.top);
    g.addColorStop(1, s.bot);
    X.fillStyle = g;
    X.fillRect(0, 0, W, H);
}
function stars(a, t) {
    if (a <= 0)
        return;
    const r = rng(7);
    for (let i = 0; i < 90; i++) {
        const x = r() * W, y = r() * H * 0.55, tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
        circ(x, y, 1 + r() * 2, rgba('#FFF4D8', a * (0.4 + 0.6 * tw)));
    }
}
function sun(x, y, r, color, glowA = 1) {
    glow(x, y, r * 3.2, color, 0.6 * glowA);
    circ(x, y, r, color);
}
/** Paralaks tepe katmanı. depth: 0 = kamerayla sabit (uzak), 1 = dünya ile birlikte */
function hills(base, amp, freq, seed, color, depth = 1) {
    X.save();
    X.translate((CUR_CAM.x - 960) * (1 - depth), (CUR_CAM.y - 540) * (1 - depth) * 0.6);
    X.beginPath();
    X.moveTo(-3000, 4000);
    for (let x = -3000; x <= 6000; x += 30) {
        const y = base + amp * Math.sin(x * freq + seed) + amp * 0.45 * Math.sin(x * freq * 2.7 + seed * 3.1) + amp * 0.15 * Math.sin(x * freq * 7.1 + seed);
        X.lineTo(x, y);
    }
    X.lineTo(6000, 4000);
    X.closePath();
    fs(color);
    X.restore();
}
function hillY(x, base, amp, freq, seed) {
    return base + amp * Math.sin(x * freq + seed) + amp * 0.45 * Math.sin(x * freq * 2.7 + seed * 3.1) + amp * 0.15 * Math.sin(x * freq * 7.1 + seed);
}
/** Standart yayla dekoru (süreklilik kilidi): tüm dış mekan shot'ları aynı katmanları kullanır */
function highland(tint, nightK = 0) {
    const dk = (c) => mix(mix(c, '#5B3C5E', tint * 0.45), '#15121F', nightK * 0.7);
    hills(560, 50, 0.0021, 1.0, dk(T.hillFar), 0.25);
    hills(650, 60, 0.0016, 2.2, dk(T.hillMid), 0.55);
    acacia(1500, hillY(1500, 650, 60, 0.0016, 2.2) + 10, 0.8, dk(T.leafDark), dk('#4A3524'));
    acacia(300, hillY(300, 650, 60, 0.0016, 2.2) + 10, 0.6, dk(T.leafDark), dk('#4A3524'));
    hills(800, 26, 0.0011, 0.4, dk(T.hillNear), 1);
}
function acacia(x, y, s, leaf, trunk) {
    at(x, y, s, 0, () => {
        poly([-8, 0, 8, 0, 4, -90, 30, -150, 24, -154, 0, -110, -26, -150, -32, -146, -4, -92], trunk);
        ell(0, -160, 130, 26, 0, leaf);
        ell(-50, -172, 70, 18, 0, leaf);
        ell(55, -170, 60, 16, 0, leaf);
    });
}
function grassTufts(seed, y0, x0, x1, color, t = 0) {
    const r = rng(seed);
    for (let i = 0; i < 40; i++) {
        const x = lerp(x0, x1, r()), y = y0 + r() * 220, h = 14 + r() * 18, sw = Math.sin(t * 2 + i) * 3;
        poly([x - 6, y, x + sw, y - h, x + 6, y], color);
    }
}
/** Tukul: Etiyopya yuvarlak kulübesi */
function hut(x, y, s, smokeT = -1, k = 1, light = 0) {
    if (k <= 0)
        return;
    at(x, y, s * E.back(clamp(k)), 0, () => {
        rrect(-110, -150, 220, 150, 10, T.mud);
        rrect(-110, -150, 50, 150, 10, T.mudDark);
        rrect(-28, -100, 56, 100, 26, light > 0 ? mix('#2A1A10', T.fire2, light) : '#2A1A10');
        poly([-150, -140, 0, -300, 150, -140], T.thatch);
        poly([-150, -140, 0, -300, -60, -140], T.thatchDark);
        for (let i = 0; i < 5; i++)
            line(-130 + i * 60, -140, 0, -296, rgba(T.thatchDark, 0.6), 3);
        if (smokeT >= 0) {
            for (let i = 0; i < 6; i++) {
                const ph = (smokeT * 0.35 + i / 6) % 1;
                circ(Math.sin(ph * 6 + i) * 20 + ph * 60, -310 - ph * 200, 12 + ph * 30, rgba('#E9E1D3', 0.5 * (1 - ph)));
            }
        }
    });
}
/** Ağıl (çit) */
function pen(x, y, s) {
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
function monastery(x, y, s, lightK = 1, k = 1) {
    if (k <= 0)
        return;
    at(x, y, s * E.back(clamp(k)), 0, () => {
        rrect(-260, -90, 520, 90, 6, T.stoneDark);
        for (let i = 0; i < 6; i++)
            rrect(-250 + i * 88, -120, 60, 34, 4, T.stoneDark);
        rrect(-150, -260, 300, 260, 8, T.stone);
        rrect(-150, -260, 70, 260, 8, mix(T.stone, T.stoneDeep, 0.35));
        poly([-190, -250, 0, -420, 190, -250], T.thatch);
        poly([-190, -250, 0, -420, -60, -250], T.thatchDark);
        line(0, -420, 0, -500, T.gold, 10);
        line(-28, -470, 28, -470, T.gold, 10);
        circ(0, -500, 8, T.gold);
        const wl = mix('#2A1A10', T.fire2, lightK);
        for (const wx of [-90, 60]) {
            rrect(wx, -200, 34, 56, 17, wl);
            if (lightK > 0)
                glow(wx + 17, -172, 70, T.fire2, lightK * 0.7);
        }
        rrect(-34, -120, 68, 120, 34, wl);
        if (lightK > 0)
            glow(0, -60, 110, T.fire2, lightK * 0.6);
    });
}
const BUSH_LEAVES = (() => { const r = rng(42); const a = []; for (let i = 0; i < 46; i++) {
    const ang = r() * TAU, d = Math.sqrt(r());
    a.push([Math.cos(ang) * d * 190, -150 + Math.sin(ang) * d * 120, r() * TAU, 0.7 + r() * 0.5, r()]);
} return a; })();
const BUSH_BERRIES = (() => { const r = rng(9); const a = []; for (let i = 0; i < 22; i++) {
    const ang = r() * TAU, d = 0.35 + Math.sqrt(r()) * 0.6;
    a.push([Math.cos(ang) * d * 170, -150 + Math.sin(ang) * d * 105, r()]);
} return a; })();
function bush(x, y, s, p = {}) {
    const lit = p.lit ?? 1, sway = p.sway ?? 0;
    at(x, y, s, 0, () => {
        poly([-14, 0, 14, 0, 8, -90, -8, -90], mix('#2A1A10', '#5A3E28', lit));
        for (const [lx, ly, rot, sc, sh] of BUSH_LEAVES) {
            const c = mix('#141A12', sh > 0.5 ? T.leaf : sh > 0.2 ? T.leafDark : T.leafHi, lit);
            ell(lx + Math.sin(sway + ly) * 4, ly, 46 * sc, 20 * sc, rot, c);
        }
        const bk = p.berries ?? 1;
        BUSH_BERRIES.forEach(([bx, by, d], i) => {
            if (i === (p.missing ?? -1))
                return;
            const k = E.back(clamp(bk * 1.6 - d * 0.6));
            if (k <= 0)
                return;
            if ((p.glowA ?? 0) > 0)
                glow(bx, by, 50 * k, T.berry, (p.glowA ?? 0) * 0.5);
            berry(bx, by, 15 * k, p.roast ?? 0);
        });
    });
}
function berry(x, y, r, roast = 0) {
    const body = roast < 0.5 ? mix(T.berry, T.beanMid, roast * 2) : mix(T.beanMid, T.bean, (roast - 0.5) * 2);
    circ(x, y, r, body);
    circ(x - r * 0.35, y - r * 0.35, r * 0.28, rgba(roast < 0.5 ? T.berryHi : '#C08A5A', 0.8 - roast * 0.4));
    circ(x + r * 0.5, y + r * 0.1, r * 0.12, rgba('#000000', 0.25));
}
/** Kavrulmuş çekirdek glifi */
function bean(x, y, r, rot, color = T.bean) {
    at(x, y, 1, rot, () => {
        ell(0, 0, r, r * 0.7, 0, color);
        smooth([-r * 0.8, 0, -r * 0.2, -r * 0.18, r * 0.2, r * 0.18, r * 0.8, 0], null, mix(color, '#000000', 0.5), r * 0.16);
    });
}
// ---------- Ateş ----------
function fire(x, y, s, t, k = 1) {
    if (k <= 0)
        return;
    glow(x, y - 80 * s, 420 * s * k, T.fire2, 0.55 * k);
    at(x, y, s, 0, () => {
        // odunlar
        rrect(-120, -26, 240, 30, 14, '#4A2E1C');
        at(0, -8, 1, 0.3, () => rrect(-110, -14, 220, 26, 12, '#5E3A22'));
        const layers = [[T.fire3, 1.0, 0], [T.fire2, 0.72, 1.3], [T.fire1, 0.45, 2.7]];
        for (const [col, sc, ph] of layers) {
            X.beginPath();
            X.moveTo(-110 * sc, -10);
            const n = 7;
            for (let i = 0; i <= n; i++) {
                const fx = lerp(-110, 110, i / n) * sc;
                const hh = (160 + 70 * Math.sin(t * 9 + i * 1.7 + ph)) * sc * k * (1 - Math.abs(i / n - 0.5) * 0.9);
                X.quadraticCurveTo(fx - 12 * sc, -hh * 0.4, fx + Math.sin(t * 6 + i) * 10, -hh);
                X.quadraticCurveTo(fx + 12 * sc, -hh * 0.4, fx + 16 * sc, -10);
            }
            X.closePath();
            fs(col);
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
function aroma(x, y, t, width, height, k, n = 5, seed = 1) {
    if (k <= 0)
        return;
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
        const ox = (r() - 0.5) * width, sp = 0.6 + r() * 0.5, ph = r() * TAU;
        const rise = clamp(k * 1.3 - i * 0.08);
        if (rise <= 0)
            continue;
        X.beginPath();
        const steps = 40;
        for (let j = 0; j <= steps * rise; j++) {
            const f = j / steps;
            const px = x + ox + Math.sin(f * 5 + t * sp * 2 + ph) * (40 + f * width * 0.18) + Math.sin(f * 11 + t) * 8;
            const py = y - f * height;
            j === 0 ? X.moveTo(px, py) : X.lineTo(px, py);
        }
        X.save();
        X.globalAlpha *= 0.55;
        fs(null, T.aroma, 10 + (i % 3) * 4);
        X.restore();
    }
}
/** Kaldi — ayak noktası (x,y), yükseklik ≈ 300*s, f: 1 sağa, -1 sola bakar */
function kaldi(x, y, s, f, p = {}) {
    at(x, y, s, 0, () => {
        X.scale(f, 1);
        const w = p.walk ?? 0, amt = p.walkAmt ?? 0, run = p.run ?? 0, st = p.startle ?? 0;
        const bob = -Math.abs(Math.sin(w)) * (8 + run * 14) * amt - st * 50;
        const sw = Math.sin(w) * (0.45 + run * 0.35) * amt;
        const hipY = -120 + bob;
        // bacaklar
        const leg = (lx, a, col) => {
            const kx = lx + Math.sin(a) * 62, ky = hipY + Math.cos(a) * 62;
            const fa = a - Math.max(0, -a) * 1.2 * (run + 0.3) * amt;
            const fx = kx + Math.sin(fa) * 60, fy = ky + Math.cos(fa) * 60;
            line(lx, hipY, kx, ky, col, 17);
            line(kx, ky, fx, fy, col, 15);
            ell(fx + 10, fy + 2, 16, 7, 0, col);
        };
        leg(-6, -sw - st * 0.4, T.skinDark);
        leg(8, sw + st * 0.4, T.skin);
        at(0, hipY, 1, (p.droop ?? 0) * 0.32 + run * 0.18 - st * 0.12, () => {
            // arka kol + asa
            const armL = (a1, a2, col, ox) => {
                const ex = ox + Math.cos(a1) * 52, ey = -112 + Math.sin(a1) * 52;
                const hx = ex + Math.cos(a2) * 50, hy = ey + Math.sin(a2) * 50;
                line(ox, -112, ex, ey, col, 15);
                line(ex, ey, hx, hy, col, 13);
                circ(hx, hy, 10, col);
                return [hx, hy];
            };
            const swing = sw * 0.9;
            const backA1 = lerp(1.75 + swing, -2.2, st) - (p.handOverEyes ?? 0) * 0;
            const [bhx, bhy] = armL(backA1, backA1 - 0.25, T.skinDark, -8);
            if (p.staff) {
                line(bhx - 6, bhy - 120, bhx + 12, bhy + 160 - bob, '#6B4A2E', 9);
                X.beginPath();
                X.arc(bhx - 20, bhy - 120, 14, 0, Math.PI, true);
                fs(null, '#6B4A2E', 9);
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
                X.beginPath();
                X.arc(0, -4, 37, Math.PI * 1.05, Math.PI * 2.05);
                fs(T.hair);
                for (let i = 0; i < 6; i++)
                    circ(-30 + i * 11, -30 + Math.abs(i - 2.5) * 3, 9, T.hair);
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
                if (m === 'smile' || m === 'grin') {
                    X.beginPath();
                    X.arc(22, 12, m === 'grin' ? 11 : 8, 0.15, Math.PI - 0.6);
                    fs(m === 'grin' ? '#FFFFFF' : null, T.hair, 3.5);
                }
                else if (m === 'o')
                    ell(24, 16, 5, 7, 0, T.hair);
                else if (m === 'chew')
                    ell(24, 15, 7, 3 + Math.abs(Math.sin(w * 3)) * 3, 0, T.hair);
                else if (m === 'frown') {
                    X.beginPath();
                    X.arc(22, 22, 8, Math.PI + 0.6, -0.2);
                    fs(null, T.hair, 3.5);
                }
                else
                    line(17, 15, 28, 15, T.hair, 3.5);
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
            if (p.hands === 'berries') {
                for (let i = 0; i < 7; i++)
                    berry(hx - 14 + (i % 4) * 10, hy - 10 - Math.floor(i / 4) * 12, 9);
            }
            if (p.hands === 'berry')
                berry(hx + 4, hy - 12, 10);
        });
    });
}
/** Keçi — ayak noktası, uzunluk ≈ 160*s */
function goat(x, y, s, f, p = {}) {
    const colors = [T.goatW, T.goatB, T.goatW, T.goatBr];
    const col = colors[p.col ?? 0];
    const ghost = p.ghost ?? 0;
    at(x, y - (p.jump ?? 0), s, 0, () => {
        X.scale(f, 1);
        X.translate(-40, -62);
        X.rotate(-(p.rear ?? 0) * 0.75);
        X.translate(40, 62);
        const ph = p.phase ?? 0, wa = p.walkAmt ?? 0, tuck = p.tuck ?? 0;
        const legCol = mix(col, '#000000', 0.25);
        const stroke = ghost ? col : null;
        const legF = ghost ? (a, b, c, d) => dashed(() => line(a, b, c, d, col, 5)) : (a, b, c, d) => line(a, b, c, d, legCol, 9);
        const legs = [[-42, 0], [-30, Math.PI], [42, Math.PI], [54, 0]];
        for (const [lx, lph] of legs) {
            const a = Math.sin(ph + lph) * 0.4 * wa;
            const fx = lx + Math.sin(a) * 60 + tuck * (lx > 0 ? -18 : 18), fy = -62 + Math.cos(a) * 60 * (1 - tuck * 0.45);
            legF(lx, -64, fx, fy);
        }
        const shape = () => {
            X.beginPath();
            X.ellipse(0, -82, 64, 30, 0, 0, TAU);
            X.moveTo(40, -96);
            X.lineTo(70, -136);
            X.lineTo(90, -126);
            X.lineTo(60, -70);
        };
        if (ghost) {
            dashed(() => { shape(); fs(null, col, 5); X.beginPath(); X.ellipse(86, -138 + (p.headDown ?? 0) * 40, 26, 15, 0.45, 0, TAU); fs(null, col, 5); });
            return;
        }
        shape();
        fs(col, stroke);
        if (p.col === 2) {
            ell(-20, -88, 18, 12, 0.3, T.goatBr);
            ell(18, -74, 12, 9, 0, T.goatBr);
        }
        poly([-60, -98, -78, -112, -66, -88], col);
        at(86, -138 + (p.headDown ?? 0) * 40, 1, 0.45 + (p.headDown ?? 0) * 0.5, () => {
            ell(0, 0, 26, 15, 0, col);
            ell(-14, -8, 14, 6, -0.8, mix(col, '#000000', 0.15));
            X.beginPath();
            X.moveTo(-8, -12);
            X.quadraticCurveTo(-30, -44, -48, -30);
            fs(null, T.horn, 7);
            circ(4, -5, 3.5, T.hair);
            poly([8, 12, 16, 12, 10, 30], mix(col, '#000000', 0.3));
        });
    });
}
/** Keşiş — ayak noktası */
function monk(x, y, s, f, p = {}) {
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
            X.beginPath();
            X.arc(0, -6, 38, Math.PI, TAU);
            fs(T.capW);
            rrect(-38, -10, 76, 12, 6, mix(T.capW, '#000000', 0.12));
            // sakal
            poly([-20, 14, 32, 14, 22, 58, 6, 66, -14, 40], p.beardCol ?? '#3A2E28');
            const br = (p.brow ?? 0) * 8;
            ell(18, 2, 6, 7, 0, '#FFFFFF');
            circ(20, 3, 3.5, T.hair);
            line(8, -10 - br, 28, -12 + (p.brow ?? 0) * -2 + ((p.brow ?? 0) < 0 ? 10 : 0), T.hair, 4);
            ell(32, 8, 5, 7, 0, T.skinDark);
            const m = p.mouth ?? 'flat';
            if (m === 'o')
                ell(22, 24, 5, 6, 0, T.hair);
            else if (m === 'frown') {
                X.beginPath();
                X.arc(20, 30, 7, Math.PI + 0.5, -0.3);
                fs(null, T.hair, 3.5);
            }
            else if (m === 'smile') {
                X.beginPath();
                X.arc(20, 20, 7, 0.2, Math.PI - 0.6);
                fs(null, T.hair, 3.5);
            }
            else
                line(14, 24, 26, 24, T.hair, 3.5);
        });
        // kol
        const reach = p.arm ?? 0, up = p.armUp ?? 0;
        let a1 = lerp(1.35, -0.2, reach);
        a1 = lerp(a1, -1.3, up);
        const a2 = lerp(a1 - 0.6, a1, reach) - up * 0.6;
        const ex = 14 + Math.cos(a1) * 56, ey = -205 + Math.sin(a1) * 56;
        const hx = ex + Math.cos(a2) * 54, hy = ey + Math.sin(a2) * 54;
        line(14, -205, ex, ey, mix(robe, '#FFFFFF', 0.1), 22);
        line(ex, ey, hx, hy, mix(robe, '#FFFFFF', 0.1), 18);
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
// ===== Shot'lar (PLAN.md'deki edit tasarım dokümanının birebir uygulaması) =====
/** Ekran uzayında çiz (kamerasız): etiket, sayaç, kaplama */
function onScreen(fn) { X.save(); X.setTransform(1, 0, 0, 1, 0, 0); fn(); X.restore(); }
function overlay(color, a) { if (a > 0)
    onScreen(() => { X.fillStyle = rgba(color, a); X.fillRect(0, 0, W, H); }); }
function flash(t, at0, d = 0.35, a = 0.8) { if (t >= at0 && t < at0 + d)
    overlay('#FFFFFF', (1 - (t - at0) / d) * a); }
const GROUND = 840;
// ---- İç mekan (manastır odası) ----
function room(t, fireK, cool = 0) {
    X.fillStyle = mix(T.stoneDark, T.stoneDeep, 0.3);
    X.fillRect(-1500, -800, 5000, 3000);
    const r = rng(11);
    for (let row = 0; row < 14; row++) {
        for (let c = 0; c < 18; c++) {
            const x = -400 + c * 170 + (row % 2) * 85, y = -120 + row * 70;
            if (y > GROUND + 20)
                continue;
            rrect(x, y, 160, 62, 10, mix(T.stoneDark, T.stone, 0.2 + r() * 0.35));
        }
    }
    // kemerli pencere
    rrect(1480, 160, 220, 320, 110, '#151225');
    stars(0.8, t);
    circ(1640, 250, 26, '#F4E9C8');
    X.beginPath();
    X.roundRect(1480, 160, 220, 320, 110);
    fs(null, T.stoneDeep, 20);
    // ahşap kiriş
    rrect(-400, 40, 2800, 46, 8, '#4A2E1C');
    // zemin
    X.fillStyle = '#4A3B2E';
    X.fillRect(-1500, GROUND + 40, 5000, 1200);
    // ocak
    for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        ell(960 + Math.cos(a) * 170, 880 + Math.sin(a) * 26 + 10, 42, 26, 0, i % 2 ? T.stoneDark : T.stone);
    }
    fire(960, 870, 0.75, t, fireK);
    // ateş ışığı + karanlık köşeler
    const g = X.createRadialGradient(960, 760, 100, 960, 700, 1300);
    g.addColorStop(0, rgba(T.fire2, 0.18 * fireK));
    g.addColorStop(0.5, 'rgba(0,0,0,0.15)');
    g.addColorStop(1, 'rgba(0,0,0,0.65)');
    X.fillStyle = g;
    X.fillRect(-1500, -800, 5000, 3000);
    if (cool > 0) {
        X.fillStyle = rgba(T.devil, 0.3 * cool);
        X.fillRect(-1500, -800, 5000, 3000);
    }
}
// ===================== S00 — Köprü: başlık =====================
const S00 = {
    id: 'S00', scene: 'Köprü · Açılış', dur: 4.5, trans: 'cut', sub: false,
    text: 'Kahvenin Keşfi', triggers: [{ w: 'Kahvenin Keşfi', at: 1.5 }],
    render(t) {
        const g = X.createRadialGradient(960, 500, 50, 960, 540, 1100);
        g.addColorStop(0, '#3A2618');
        g.addColorStop(1, '#120C08');
        X.fillStyle = g;
        X.fillRect(0, 0, W, H);
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
        const tw = X.measureText(title).width;
        let cx = 960 - tw / 2;
        for (let i = 0; i < title.length; i++) {
            const ch = title[i], w = X.measureText(ch).width;
            const kk = P(t, 1.5 + i * 0.05, 0.5, E.out);
            alpha(kk, () => txt(ch, cx + w / 2, 640 + (1 - kk) * 40, 120, T.cream, { font: T.serif, weight: 'bold' }));
            X.font = `bold 120px ${T.serif}`;
            cx += w;
        }
        const lk = P(t, 2.2, 0.8, E.out);
        line(960 - 300 * lk, 730, 960 + 300 * lk, 730, T.gold, 3);
        alpha(P(t, 2.5, 0.7), () => txt('ETİYOPYA  ·  IX. YÜZYIL EFSANESİ', 960, 780, 30, T.gold, { spacing: 8 }));
    },
};
// ===================== S01 — Zaman + yer =====================
const MAP = { x: 630, y: 155, s: 1.1 };
const ETH_W = { x: MAP.x + ETH_C.x * MAP.s, y: MAP.y + ETH_C.y * MAP.s };
const S01 = {
    id: 'S01', scene: 'A · Yayla', dur: 8, trans: 'dip',
    text: 'Dokuzuncu yüzyıl. Etiyopya’nın yüksek yaylalarında,',
    triggers: [{ w: 'Dokuzuncu yüzyıl', at: 0.4 }, { w: 'Etiyopya’nın', at: 2.8 }, { w: 'yüksek yaylalarında', at: 5.2 }],
    render(t) {
        X.fillStyle = T.paper;
        X.fillRect(0, 0, W, H);
        const cam = kcam(t, [[0, C(960, 540, 1)], [2.2, C(855, 470, 1.35)], [2.6, C(855, 470, 1.35)], [3.3, C(960, 540, 1)], [3.5, C(960, 540, 1)], [5.8, C(ETH_W.x, ETH_W.y, 3.4)], [8, C(ETH_W.x, ETH_W.y, 3.8)]]);
        applyCam(cam);
        // kağıt ızgarası
        for (let i = -10; i < 30; i++) {
            line(i * 120, -600, i * 120, 1700, rgba(T.paperDark, 0.5), 2);
            line(-600, i * 120, 2600, i * 120, rgba(T.paperDark, 0.5), 2);
        }
        // --- zaman çizelgesi ---
        const tlA = 1 - P(t, 2.4, 0.6);
        alpha(tlA, () => {
            X.save();
            X.translate(0, -P(t, 2.4, 0.6) * 120);
            const x0 = 260, x1 = 1660, ax = (c) => x0 + (c / 20) * (x1 - x0);
            const lk = P(t, 0.0, 0.9, E.out);
            line(x0, 540, lerp(x0, x1, lk), 540, T.ink, 5);
            for (let c = 0; c <= 20; c++) {
                const tk = P(t, 0.05 + c * 0.025, 0.3, E.out);
                line(ax(c), 540, ax(c), 540 + (c % 5 === 0 ? 34 : 18) * tk, T.ink, c % 5 === 0 ? 4 : 2);
                if (c % 5 === 0)
                    alpha(tk, () => txt(c === 0 ? 'MS 1' : String(c * 100), ax(c), 600, 26, T.ink));
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
                if (ek > 0)
                    circ(ETH_C.x, ETH_C.y, 10 + pulse * 70, null, rgba(T.berryDark, (1 - pulse) * ek), 3);
                alpha(ek * (1 - P(t, 4.6, 0.5)), () => { line(ETH_C.x + 40, ETH_C.y, ETH_C.x + 90, ETH_C.y - 40, T.ink, 2); txt('ETİYOPYA', ETH_C.x + 96, ETH_C.y - 44, 24, T.ink, { align: 'left', weight: 'bold', spacing: 4 }); });
            });
        });
        // --- haritadan gerçeğe: yaylalar yükselir ---
        const rk = P(t, 5.2, 1.8, E.out);
        if (rk > 0)
            onScreen(() => {
                X.globalAlpha = clamp(rk * 1.4);
                drawSky(SKY.day);
                sun(1500, 250, 60, '#FFE6A8');
                X.globalAlpha = 1;
                X.translate(0, (1 - rk) * 600);
                applyCam(C(960, 540, 1));
                highland(0);
                grassTufts(5, GROUND - 20, 0, 1920, T.hillDeep, t);
            });
        onScreen(() => {
            const ak = P(t, 5.9, 0.7, E.out);
            if (ak <= 0)
                return;
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
const S02 = {
    id: 'S02', scene: 'A · Yayla', dur: 7, trans: 'fade',
    text: 'Kaldi adında genç bir keçi çobanı yaşıyordu.',
    triggers: [{ w: 'Kaldi', at: 0.6 }, { w: 'genç', at: 1.8 }, { w: 'keçi çobanı', at: 2.8 }, { w: 'yaşıyordu', at: 4.3 }],
    render(t) {
        drawSky(SKY.day);
        sun(1500, 250, 60, '#FFE6A8');
        applyCam(kcam(t, [[0, C(920, 560, 1.0)], [7, C(1000, 540, 1.12)]], E.sine));
        highland(0);
        hut(1500, GROUND - 25, 0.85, t, P(t, 4.3, 0.6));
        grassTufts(5, GROUND - 20, -200, 2200, T.hillDeep, t);
        GOATS2.forEach((g, i) => {
            const k = P(t, 2.8 + i * 0.2, 0.55, E.out);
            if (k <= 0)
                return;
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
const S03 = {
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
            if (ck <= 0)
                return;
            at(1660, 220, ck, 0, () => {
                rrect(-110, -90, 220, 180, 20, rgba(T.ink, 0.75));
                X.save();
                X.beginPath();
                X.rect(-110, -80, 220, 120);
                X.clip();
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
const BIGHILL = (x) => 560 + Math.pow((x - 2150) / 330, 2) * 90;
const S04 = {
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
        X.beginPath();
        X.moveTo(1700, 1400);
        for (let x = 1700; x <= 2700; x += 20)
            X.lineTo(x, Math.min(BIGHILL(x), GROUND + 60));
        X.lineTo(2700, 1400);
        X.closePath();
        fs(mix(T.hillDeep, '#5B3C5E', 0.4));
        acacia(2250, BIGHILL(2250) + 6, 0.5, mix(T.leafDark, '#5B3C5E', 0.4), '#3A2A20');
        const kx = lerp(560, 1560, P(t, 0, 3.6, E.sine));
        const startle = kf(t, [[5.4, 0], [5.55, 1], [6.1, 0.55], [7.5, 0.45]], E.out);
        kaldi(kx, GROUND + 15, 1, 1, { walk: t * 7, walkAmt: 1 - P(t, 3.3, 0.4), staff: t < 5.4, mouth: t < 3.4 ? (Math.sin(t * 5) > 0 ? 'o' : 'flat') : t > 5.4 ? 'o' : 'flat', startle, brow: startle });
        // seslenme
        if (t < 3.4) {
            for (const c of [0.4, 1.6, 2.7])
                alpha(env(t, c, c + 0.8, 0.2), () => { soundRings(kx + 40, GROUND - 270, t, 1, T.cream, 0, 0, 0.5); qmark(kx + 120, GROUND - 360 - (t - c) * 30, 0.5); });
        }
        // tepenin ardından garip ses
        const sk = P(t, 4.0, 0.4);
        soundRings(2150, 560, t, sk, T.goldHi, 16, -Math.PI / 2, 1.1);
        if (sk > 0)
            for (let i = 0; i < 3; i++) {
                const ph = (t * 0.7 + i / 3) % 1;
                alpha(sk * (1 - ph), () => note(2050 + i * 90 + Math.sin(ph * 6) * 20, 520 - ph * 200, 0.8, T.goldHi, i === 1));
            }
        pointer(1960, 470, 1880, 380, 'tepelerin ardı', P(t, 3.0, 0.6) * (1 - P(t, 5.3, 0.3)), T.cream, 28);
        bang(kx + 30, GROUND - 400 - startle * 50, P(t, 5.4, 0.3, E.back) * 1.1);
    },
};
// ===================== S05 — Dans eden keçiler =====================
const S05 = {
    id: 'S05', scene: 'B · Tepelerin ardı', dur: 8.5, trans: 'zoom',
    text: 'Keçileri, parlak kırmızı meyveleri olan bir çalılığın etrafında zıplıyor, sanki dans ediyordu.',
    triggers: [{ w: 'Keçileri', at: 0.4 }, { w: 'parlak kırmızı meyveleri', at: 1.8 }, { w: 'çalılığın', at: 2.6 }, { w: 'etrafında zıplıyor', at: 3.6 }, { w: 'sanki dans ediyordu', at: 5.6 }],
    render(t) {
        drawSky(skyMix(SKY.sunset, SKY.dusk, 0.75));
        stars(0.6, t);
        circ(1550, 200, 46, '#F4E9C8');
        glow(1550, 200, 160, '#F4E9C8', 0.3);
        const dance = P(t, 5.6, 0.6);
        const cam = kcam(t, [[0, C(960, 980, 1.3)], [1.7, C(960, 560, 1.0)], [8.5, C(960, 600, 1.15)]]);
        cam.r = Math.sin(t * 2.4) * 0.014 * dance;
        applyCam(cam);
        highland(1);
        // dans ışığı
        if (dance > 0) {
            const g = X.createLinearGradient(960, 0, 960, 900);
            g.addColorStop(0, rgba(T.goldHi, 0));
            g.addColorStop(1, rgba(T.goldHi, 0.28 * dance));
            X.fillStyle = g;
            poly([860, -200, 1060, -200, 1460, 900, 460, 900], g);
        }
        const cx = 960, cy = GROUND + 10, rx = 380, ry = 70;
        const jumpK = P(t, 3.6, 0.4);
        const goats = [0, 1, 2, 3].map(i => {
            const th = (i / 4) * TAU + 0.6 + Math.max(0, t - 3.6) * 1.25;
            return { i, th, x: cx + Math.cos(th) * rx, y: cy + Math.sin(th) * ry };
        });
        const drawG = (g) => {
            const k = P(t, 0.4 + g.i * 0.12, 0.5, E.back);
            if (k <= 0)
                return;
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
        if (dance > 0)
            for (let i = 0; i < 6; i++) {
                const ph = (t * 0.5 + i / 6) % 1;
                alpha(dance * Math.sin(ph * Math.PI), () => note(cx - 450 + i * 180 + Math.sin(ph * 8 + i) * 30, 600 - ph * 320, 0.9, i % 2 ? T.goldHi : T.cream, i % 3 === 0));
            }
        pointer(cx + 160, cy - 260, cx + 330, cy - 420, 'kahve meyvesi', P(t, 2.0, 0.6) * (1 - P(t, 3.5, 0.4)), T.berryHi, 30);
        pointer(cx - 200, cy - 120, cx - 380, cy - 380, 'çalılık', P(t, 2.6, 0.6) * (1 - P(t, 3.8, 0.4)), T.cream, 30);
    },
};
// ===================== S06 — Yaklaşma, koparma, bakma, tatma =====================
function nearestBerry(bx, by, s, hx, hy) {
    let best = 0, bd = 1e9;
    BUSH_BERRIES.forEach(([x, y], i) => { const d = Math.hypot(bx + x * s - hx, by + y * s - hy); if (d < bd) {
        bd = d;
        best = i;
    } });
    return best;
}
const S06_BUSH = { x: 1150, y: GROUND, s: 1.1 };
const S06_HAND = { x: 1010, y: GROUND + 15 - 232 };
const S06_PICK = nearestBerry(S06_BUSH.x, S06_BUSH.y, S06_BUSH.s, S06_HAND.x, S06_HAND.y);
const S06 = {
    id: 'S06', scene: 'B · Tepelerin ardı', dur: 9, trans: 'cut',
    text: 'Kaldi şaşkınlıkla yaklaştı. Meyvelerden birini kopardı, uzun uzun baktı ve sonunda tadına baktı.',
    triggers: [{ w: 'şaşkınlıkla', at: 0.3 }, { w: 'yaklaştı', at: 1.0 }, { w: 'Meyvelerden birini kopardı', at: 2.8 }, { w: 'uzun uzun baktı', at: 4.4 }, { w: 'tadına baktı', at: 7.0 }],
    render(t) {
        const ecu = t >= 4.2 && t < 6.8;
        if (ecu) {
            // --- C: aşırı yakın plan, kesit ---
            const g = X.createRadialGradient(960, 540, 50, 960, 540, 1100);
            g.addColorStop(0, '#3B2A3A');
            g.addColorStop(1, '#141018');
            X.fillStyle = g;
            X.fillRect(0, 0, W, H);
            const r = rng(21);
            for (let i = 0; i < 18; i++)
                circ(r() * W, r() * H, 30 + r() * 90, rgba(r() > 0.5 ? T.goldHi : T.leafHi, 0.06 + r() * 0.06));
            applyCam(C(960, 540, kf(t, [[4.2, 1.08], [6.8, 1.0]], E.out)));
            // dev göz (soldan bakıyor)
            at(170, 560, 1, 0, () => {
                circ(-160, 0, 420, T.skin);
                ell(40, -10, 95, 62, 0, '#FFFFFF');
                circ(70, -6, 40, '#3A2010');
                circ(78, -8, 22, T.hair);
                circ(64, -22, 9, '#FFFFFF');
                X.beginPath();
                X.ellipse(40, -10, 100, 68, 0, Math.PI * 1.05, Math.PI * 1.95);
                fs(null, T.skinDark, 14);
                line(-50, -120 - P(t, 4.4, 0.4) * 20, 120, -112 - P(t, 4.4, 0.4) * 24, T.hair, 16);
            });
            const split = P(t, 5.2, 0.7, E.out);
            const bx = 1060, by = 520;
            at(bx, by, 1, Math.sin(t * 1.2) * 0.08, () => {
                glow(0, 0, 340, T.berry, 0.35);
                if (split <= 0) {
                    berry(0, 0, 170);
                    line(0, -170, 18, -230, T.leafDark, 12);
                }
                else {
                    // sol yarı: dış kabuk
                    X.save();
                    X.beginPath();
                    X.rect(-400, -400, 400, 800);
                    X.clip();
                    berry(-split * 120, 0, 170);
                    X.restore();
                    // sağ yarı: kesit yüzü
                    at(split * 200, 0, 1, 0, () => {
                        circ(0, 0, 170, T.berry);
                        circ(0, 0, 150, '#F2D9A8');
                        ell(-38, 0, 46, 100, 0, '#D8C08E');
                        ell(38, 0, 46, 100, 0, '#D8C08E');
                        line(-22, -80, -22, 80, '#B39A68', 5);
                        line(22, -80, 22, 80, '#B39A68', 5);
                    });
                }
            });
            // süre halkası: "uzun uzun"
            const rk = P(t, 4.4, 2.2, E.lin);
            if (rk > 0) {
                X.beginPath();
                X.arc(bx + split * 40, by, 260, -Math.PI / 2, -Math.PI / 2 + rk * TAU);
                fs(null, rgba(T.goldHi, 0.8), 6);
            }
            pointer(bx - split * 120 - 120, by - 120, bx - 320, by - 330, 'kabuk', P(t, 5.6, 0.5), T.cream, 30);
            pointer(bx + split * 200 + 110, by - 100, bx + 520, by - 300, 'meyve eti', P(t, 5.8, 0.5), T.cream, 30);
            pointer(bx + split * 200 + 40, by + 40, bx + 520, by + 260, 'çekirdek × 2', P(t, 6.0, 0.5), T.goldHi, 34);
            flash(t, 4.2, 0.25, 0.7);
            return;
        }
        // --- A, B, D: orta plan ---
        drawSky(skyMix(SKY.sunset, SKY.dusk, 0.8));
        stars(0.6, t);
        circ(1550, 200, 46, '#F4E9C8');
        const cam = t < 6.8
            ? kcam(t, [[0, C(860, 580, 1.08)], [2.6, C(900, 570, 1.12)], [3.3, C(1040, 610, 2.2)], [4.2, C(1040, 610, 2.3)]])
            : kcam(t, [[6.8, C(930, 560, 2.5)], [9, C(930, 560, 2.7)]], E.out);
        applyCam(cam);
        highland(1);
        // arka planda dans eden keçiler
        for (let i = 0; i < 2; i++)
            goat(1380 + i * 160, GROUND - 30, 0.6, -1, { col: i + 1, rear: 0.8, jump: Math.abs(Math.sin(t * 6 + i)) * 24 });
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
        for (let i = 0; i < 3; i++)
            alpha(env(t, 0.3 + i * 0.25, 2.6), () => qmark(kx - 40 + i * 50, GROUND - 380 - i * 30 - Math.sin(t * 3 + i) * 10, 0.6 + i * 0.15, T.cream, (i - 1) * 0.2));
        // çıt!
        if (t > 3.15 && t < 3.6) {
            const k = P(t, 3.15, 0.45, E.out);
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * TAU;
                line(S06_HAND.x + Math.cos(a) * (14 + k * 26), S06_HAND.y - 12 + Math.sin(a) * (14 + k * 26), S06_HAND.x + Math.cos(a) * (20 + k * 40), S06_HAND.y - 12 + Math.sin(a) * (20 + k * 40), rgba(T.goldHi, 1 - k), 4);
            }
        }
        // ısırma
        if (t > 7.0) {
            const k = P(t, 7.0, 0.5, E.out);
            const mx = 900 + 26, my = GROUND + 15 - 120 - 168 + 16;
            for (let i = 0; i < 5; i++) {
                const a = -0.9 + i * 0.45;
                line(mx + Math.cos(a) * (24 + k * 20), my + Math.sin(a) * (24 + k * 20), mx + Math.cos(a) * (32 + k * 34), my + Math.sin(a) * (32 + k * 34), rgba(T.goldHi, 1 - k * 0.6), 3);
            }
        }
        flash(t, 6.8, 0.25, 0.6);
    },
};
// ===================== S07 — Zaman geçer, enerji, gözler =====================
const S07 = {
    id: 'S07', scene: 'B · Tepelerin ardı', dur: 7, trans: 'dip',
    text: 'Birkaç dakika sonra yorgunluğu kaybolmuştu. Gözleri parladı.',
    triggers: [{ w: 'Birkaç dakika sonra', at: 0.2 }, { w: 'yorgunluğu', at: 1.9 }, { w: 'kaybolmuştu', at: 3.0 }, { w: 'Gözleri parladı', at: 4.6 }],
    render(t) {
        drawSky(skyMix(SKY.dusk, SKY.night, 0.3));
        stars(0.8, t);
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
        if (droop > 0.05)
            for (let i = 0; i < 3; i++) {
                const ph = (t * 0.6 + i / 3) % 1;
                alpha(droop * Math.sin(ph * Math.PI) * P(t, 1.9, 0.3), () => txt('z', 980 + ph * 60 + i * 10, 470 - ph * 120, 30 + i * 8, T.cream, { weight: 'bold', font: T.serif }));
            }
        battery(900, 360, 0.7, kf(t, [[3.0, 0.12], [3.9, 1.0]], E.inOut), P(t, 1.9, 0.4) * (1 - P(t, 4.3, 0.3)));
        // ışın patlaması
        if (gk > 0) {
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * TAU + t * 0.4;
                line(eyeX + Math.cos(a) * 14, eyeY + Math.sin(a) * 14, eyeX + Math.cos(a) * (14 + 50 * gk), eyeY + Math.sin(a) * (14 + 50 * gk), rgba(T.goldHi, 0.7 * gk), 2);
            }
            for (let i = 0; i < 4; i++) {
                const a = i * 1.7 + t;
                sparkle(eyeX + Math.cos(a) * 30, eyeY + Math.sin(a) * 22, 6 + 4 * Math.sin(t * 6 + i), t * 2 + i, T.goldHi);
            }
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
const PILE = (() => { const r = rng(5); const a = []; for (let i = 0; i < 16; i++) {
    const ang = r() * TAU, d = Math.sqrt(r());
    a.push([Math.cos(ang) * d * 120, Math.sin(ang) * d * 70 - i * 2, r()]);
} return a; })();
const MON = { x: 2650, y: 600 };
const path8 = (u) => ({ x: lerp(560, 2480, u), y: lerp(GROUND + 10, MON.y + 10, u) - Math.sin(u * Math.PI) * 30 });
const S08 = {
    id: 'S08', scene: 'C · Manastır', dur: 7.5, trans: 'whip',
    text: 'Avuçlarını meyveyle doldurup yakındaki manastıra koştu.',
    triggers: [{ w: 'Avuçlarını meyveyle doldurup', at: 0.3 }, { w: 'yakındaki manastıra', at: 2.6 }, { w: 'koştu', at: 3.8 }],
    render(t) {
        if (t < 2.4) {
            // kuşbakışı avuçlar
            X.fillStyle = '#4E3A2A';
            X.fillRect(0, 0, W, H);
            applyCam(C(960, 540, kf(t, [[0, 1], [2.4, 1.15]]), kf(t, [[0, -0.04], [2.4, 0.04]])));
            const r = rng(2);
            for (let i = 0; i < 60; i++)
                ell(r() * 2200 - 140, r() * 1300 - 110, 10 + r() * 30, 4 + r() * 8, r() * 3, rgba('#6B5038', 0.6));
            // avuçlar
            // bilekler alttan gelir, parmaklar yukarı ve dışa açılır; iki avuç ortada birleşir
            for (const s of [-1, 1])
                at(960 + s * 100, 600, 1, 0, () => {
                    X.scale(s, 1);
                    rrect(10, 120, 120, 400, 50, T.skinDark); // bilek/kol
                    ell(40, 40, 120, 150, 0, T.skin); // avuç
                    const fingers = [[-10, -90, -0.05, 120], [40, -96, 0.12, 130], [88, -80, 0.3, 120], [122, -50, 0.5, 98]];
                    for (const [fx, fy, rot, len] of fingers)
                        at(fx, fy, 1, rot, () => { rrect(-22, -len, 44, len + 30, 22, T.skin); ell(0, -len + 14, 12, 10, 0, mix(T.skin, '#E0B08A', 0.5)); line(-12, -len * 0.45, 12, -len * 0.45, rgba(T.skinDark, 0.6), 3); });
                    at(130, 90, 1, 0.9, () => rrect(-24, -110, 48, 130, 24, T.skin)); // başparmak
                    ell(10, 50, 92, 110, 0, mix(T.skin, '#C48A5A', 0.35)); // iç avuç
                    smooth([-40, 0, 0, 40, 50, 70], null, rgba(T.skinDark, 0.5), 4);
                });
            // düşen meyveler
            PILE.forEach(([px, py, d], i) => {
                const k = P(t, 0.3 + i * 0.09, 0.45, E.out);
                if (k <= 0)
                    return;
                const s = lerp(2.4, 1, k);
                alpha(clamp(k * 3), () => berry(960 + px * 1.1, 640 + py - (1 - E.back(k)) * 60, 30 * s));
            });
            return;
        }
        // --- gece, manastır ---
        drawSky(skyMix(SKY.dusk, SKY.night, 0.6));
        stars(1, t);
        circ(400, 180, 40, '#F4E9C8');
        glow(400, 180, 140, '#F4E9C8', 0.3);
        const u = P(t, 3.8, 3.4, E.inOut);
        const kp = path8(u);
        const wide = C(1600, 560, 0.62);
        const follow = C(kp.x + 180, kp.y - 200, 1.05);
        const fk = P(t, 3.7, 0.7);
        const cam = C(lerp(wide.x, follow.x, fk), lerp(wide.y, follow.y, fk), lerp(wide.z, follow.z, fk), 0);
        if (t > 6.6) {
            const e = P(t, 6.6, 0.9);
            cam.x = lerp(cam.x, MON.x - 150, e);
            cam.z = lerp(cam.z, 0.9, e);
        }
        applyCam(cam);
        highland(1, 0.6);
        ell(MON.x, MON.y + 180, 700, 200, 0, '#2A2A30');
        monastery(MON.x, MON.y + 10, 0.8, 0.8 + 0.2 * Math.sin(t * 7), P(t, 2.6, 0.6));
        // rota
        const rk = P(t, 2.6, 1.0, E.out);
        dashed(() => {
            X.beginPath();
            for (let i = 0; i <= 60 * rk; i++) {
                const p = path8(i / 60);
                i === 0 ? X.moveTo(p.x, p.y) : X.lineTo(p.x, p.y);
            }
            fs(null, rgba(T.goldHi, 0.8), 6);
        }, [18, 16], -t * 40);
        // pin
        alpha(rk, () => { circ(560, GROUND - 40, 14, T.goldHi); circ(MON.x, MON.y - 520, 24, null, T.goldHi, 5); });
        pointer(MON.x + 200, MON.y - 300, MON.x + 380, MON.y - 520, 'MANASTIR', P(t, 2.7, 0.6) * (1 - P(t, 4.0, 0.4)), T.cream, 48);
        chip(1560, GROUND - 200, 'yakında', P(t, 2.9, 0.5) * (1 - P(t, 3.9, 0.3)));
        // toz + hız çizgileri
        if (t > 3.8) {
            for (let i = 1; i < 7; i++) {
                const p = path8(Math.max(0, u - i * 0.012));
                circ(p.x - 20, p.y + 6, 10 + i * 5, rgba('#C9B79A', 0.35 * (1 - i / 7)));
            }
            const sp = P(t, 3.9, 0.4) * (1 - P(t, 6.8, 0.4));
            for (let i = 0; i < 5; i++)
                line(kp.x - 160 - i * 30, kp.y - 80 - i * 50, kp.x - 300 - i * 60, kp.y - 80 - i * 50, rgba(T.cream, 0.4 * sp), 4);
        }
        kaldi(kp.x, kp.y + 15, 1, 1, { walk: t * 13, walkAmt: t > 3.8 && u < 1 ? 1 : 0, run: 1, arm: 0.7, hands: 'berries', mouth: 'grin', brow: 0.6 });
    },
};
// ===================== S09 — Keşiş, şeytan, ateş =====================
const MONK1 = { x: 600, y: GROUND + 40 };
const KAL9 = { x: 1360, y: GROUND + 40 };
const parab = (u) => ({ x: lerp(725, 960, u), y: lerp(640, 820, u) - Math.sin(u * Math.PI) * 260 });
const S09 = {
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
        if (t >= 5.15 && t < 6.0)
            for (let i = 0; i < 7; i++)
                berry(725 + (i % 4) * 10 - 15, 640 - Math.floor(i / 4) * 12 - wind * 120, 9);
        if (t >= 6.0) {
            const u = P(t, 6.0, 0.9, E.in);
            dashed(() => { X.beginPath(); for (let i = 0; i <= 40 * u; i++) {
                const p = parab(i / 40);
                i === 0 ? X.moveTo(p.x, p.y) : X.lineTo(p.x, p.y);
            } fs(null, rgba(T.goldHi, 0.7 * (1 - P(t, 7.2, 0.6))), 4); }, [10, 10]);
            if (u < 1)
                for (let i = 0; i < 7; i++) {
                    const p = parab(clamp(u - i * 0.02));
                    berry(p.x + (i % 3) * 8, p.y + Math.floor(i / 3) * 8, 9);
                }
            if (t > 6.9) {
                const k = P(t, 6.9, 0.7, E.out);
                for (let i = 0; i < 14; i++) {
                    const a = -Math.PI * (0.1 + 0.8 * (i / 13));
                    circ(960 + Math.cos(a) * k * 220, 820 + Math.sin(a) * k * 200 + k * k * 80, 6 * (1 - k), rgba(T.fire1, 1 - k));
                }
            }
        }
        // "bu meyve" halkası
        if (has) {
            const k = P(t, 2.0, 0.4, E.back);
            if (k > 0)
                circ(1250, 630, 52 + Math.sin(t * 6) * 4, null, rgba(T.goldHi, k * (1 - P(t, 3.4, 0.5))), 5);
        }
        // düşünce balonu: meyve = şeytan
        const bk = P(t, 3.0, 0.6) * (1 - P(t, 5.0, 0.4));
        const shk = env(t, 4.0, 5.0, 0.15) * Math.sin(t * 50) * 6;
        at(shk, 0, 1, 0, () => {
            thought(520, 330, 170, bk, 600, 560, mix(T.cream, '#CDB8D8', P(t, 4.0, 0.5)));
            alpha(clamp(bk * 1.4 - 0.4), () => {
                berry(430, 330, 40);
                txt('=', 520, 330, 70, T.ink, { weight: 'bold' });
                at(615, 340, 1, 0, () => {
                    poly([-34, -20, -48, -78, -14, -34], T.devil);
                    poly([34, -20, 48, -78, 14, -34], T.devil);
                    circ(0, 0, 44, T.devil);
                    poly([-24, -8, -6, 0, -24, 4], T.goldHi);
                    poly([24, -8, 6, 0, 24, 4], T.goldHi);
                    X.beginPath();
                    X.arc(0, 14, 16, 0.2, Math.PI - 0.2);
                    fs(null, T.goldHi, 4);
                });
            });
        });
        onScreen(() => tag(120, 820, 'KEŞİŞ', 'MANASTIRDAN', P(t, 0.9, 0.8) * (1 - P(t, 3.0, 0.5))));
    },
};
// ===================== S10 — Kavrulma ve koku =====================
const S10 = {
    id: 'S10', scene: 'C · Manastır', dur: 7.5, trans: 'cut',
    text: 'Ateşten yükselen koku bütün odayı sardı.',
    triggers: [{ w: 'Ateşten', at: 0.2 }, { w: 'yükselen koku', at: 1.8 }, { w: 'bütün odayı sardı', at: 3.8 }],
    render(t) {
        applyCam(kcam(t, [[0, C(960, 780, 2.4)], [3.6, C(960, 750, 2.15)], [5.6, C(960, 560, 1.0)], [7.5, C(960, 540, 0.96)]]));
        room(t, 1.15);
        const roast = P(t, 0.2, 3.2, E.lin);
        const r = rng(8);
        for (let i = 0; i < 7; i++)
            berry(960 - 70 + i * 22 + r() * 6, 852 - (i % 2) * 8, 9, roast);
        monk(MONK1.x, MONK1.y, 1, 1, { mouth: t > 4.5 ? 'o' : 'frown', brow: t > 4.5 ? 0.6 : -0.6 });
        kaldi(KAL9.x, KAL9.y, 1, -1, { mouth: t > 4.5 ? 'smile' : 'o', brow: 0.5, lid: t > 5.2 ? 0.6 : 0 });
        aroma(960, 800, t, 160, 520, P(t, 1.8, 2.0, E.out), 5, 4);
        const sk = P(t, 3.8, 2.5, E.out);
        if (sk > 0) {
            aroma(960, 900, t, 1900, 1000, sk, 9, 3);
            for (let j = 0; j < 4; j++) {
                X.beginPath();
                for (let x = -100; x <= 2020 * sk + 100; x += 20) {
                    const y = 260 + j * 130 + Math.sin(x * 0.006 + t * 1.4 + j * 2) * 40;
                    x === -100 ? X.moveTo(x, y) : X.lineTo(x, y);
                }
                alpha(0.3, () => fs(null, T.aroma, 8));
            }
            const rr = rng(13);
            for (let i = 0; i < 14; i++) {
                const ph = (t * 0.15 + rr()) % 1;
                alpha(sk * Math.sin(ph * Math.PI) * 0.8, () => bean(rr() * 1920, 900 - ph * 800, 10, t + i, T.beanMid));
            }
        }
        pointer(990, 830, 1080, 760, 'kavrulma', P(t, 0.8, 0.5) * (1 - P(t, 3.6, 0.4)), T.cream, 14);
        // kavrulma çubuğu
        onScreen(() => {
            const bk = P(t, 0.6, 0.5, E.out) * (1 - P(t, 4.2, 0.5));
            if (bk <= 0)
                return;
            alpha(bk, () => {
                const x0 = 1380, y0 = 120, w = 420;
                txt('KAVRULMA', x0, y0 - 34, 26, T.cream, { align: 'left', weight: 'bold', spacing: 6, shadow: true });
                const g = X.createLinearGradient(x0, 0, x0 + w, 0);
                g.addColorStop(0, T.berry);
                g.addColorStop(0.5, T.beanMid);
                g.addColorStop(1, T.bean);
                X.fillStyle = g;
                X.beginPath();
                X.roundRect(x0, y0, w, 22, 11);
                X.fill();
                X.beginPath();
                X.roundRect(x0, y0, w, 22, 11);
                fs(null, T.cream, 3);
                const mx = x0 + w * roast;
                poly([mx - 12, y0 - 14, mx + 12, y0 - 14, mx, y0 + 2], T.goldHi);
            });
        });
    },
};
// ===================== S11 — Keşişler durdu, birbirlerine baktı =====================
const M11 = [{ x: 560, f: 1 }, { x: 1180, f: -1 }, { x: 1560, f: -1 }];
const S11 = {
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
            if (k > 0 && t < 1.6)
                glow(m.x, GROUND - 120, 300, T.goldHi, 0.25 * k * (1 - P(t, 1.2, 0.4)));
            let headF = 1;
            if (i === 1)
                headF = look > 0.5 ? (t < 4.6 ? -1 : 1) : 1;
            if (i === 2)
                headF = 1;
            const robe = i === 0 ? T.robe : i === 1 ? '#6A4630' : '#4E3524';
            monk(m.x, GROUND + 40, 1, m.f, { prop: i === 1 ? 'book' : i === 2 ? 'broom' : null, propT: pt, headF, mouth: look > 0 ? 'o' : 'flat', brow: look * 0.8, robe, arm: i === 1 ? 0.7 : 0, beardCol: i === 2 ? '#8C8070' : undefined });
            // donma çizgileri
            if (frozen) {
                const fk = P(t, 1.4, 0.3, E.back) * (1 - P(t, 2.6, 0.4));
                if (fk > 0)
                    for (let j = 0; j < 3; j++) {
                        const a = -Math.PI / 2 + (j - 1) * 0.5;
                        const h = heads[i];
                        line(h.x + Math.cos(a) * 60, h.y + Math.sin(a) * 60, h.x + Math.cos(a) * (60 + 34 * fk), h.y + Math.sin(a) * (60 + 34 * fk), T.cream, 5);
                    }
            }
        });
        // bakış hatları
        const pairs = [[0, 1], [1, 2], [0, 2]];
        pairs.forEach(([a, b], i) => {
            const k = P(t, 3.1 + i * 0.3, 0.5, E.out);
            if (k <= 0)
                return;
            const A = heads[a], B = heads[b];
            dashed(() => line(A.x, A.y, lerp(A.x, B.x, k), lerp(A.y, B.y, k) - (i === 2 ? Math.sin(k * Math.PI) * 0 : 0), rgba(T.goldHi, 0.85), 4), [12, 10], -t * 30);
        });
        onScreen(() => tag(120, 820, 'KEŞİŞLER', '', P(t, 0.3, 0.8) * (1 - P(t, 2.8, 0.5))));
        flash(t, 1.4, 0.35, 0.75);
        if (frozen)
            overlay('#1A1410', 0.12 * (1 - P(t, 2.4, 0.6)));
        overlay('#0B0806', P(t, 6.2, 1.3, E.in));
    },
};
const SHOTS = [S00, S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11];
// ===== Oynatıcı: zaman çizelgesi, geçişler, altyazı, film kaplaması, dışa aktarma =====
const TRANS_D = 0.7;
const STARTS = [];
let TOTAL = 0;
for (const s of SHOTS) {
    STARTS.push(TOTAL);
    TOTAL += s.dur;
}
const view = document.getElementById('stage');
view.width = W;
view.height = H;
const VX = view.getContext('2d');
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const bufA = mk(), bufB = mk();
const AX = bufA.getContext('2d'), BX = bufB.getContext('2d');
// film greni (önceden üretilir)
const grain = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256); const r = rng(99); for (let i = 0; i < d.data.length; i += 4) {
    const v = r() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
} g.putImageData(d, 0, 0); return c; })();
function renderShot(ctx, i, t) {
    X = ctx;
    X.setTransform(1, 0, 0, 1, 0, 0);
    X.globalAlpha = 1;
    X.clearRect(0, 0, W, H);
    X.save();
    SHOTS[i].render(t);
    X.restore();
}
function shotAt(T0) {
    let i = SHOTS.length - 1;
    for (let k = 0; k < SHOTS.length; k++)
        if (T0 < STARTS[k] + SHOTS[k].dur) {
            i = k;
            break;
        }
    return { i, t: clamp(T0 - STARTS[i], 0, SHOTS[i].dur) };
}
function compose(T0) {
    const { i, t } = shotAt(T0);
    const sh = SHOTS[i];
    renderShot(BX, i, t);
    VX.setTransform(1, 0, 0, 1, 0, 0);
    VX.globalAlpha = 1;
    VX.filter = 'none';
    VX.fillStyle = '#000';
    VX.fillRect(0, 0, W, H);
    const inTrans = i > 0 && t < TRANS_D && sh.trans !== 'cut';
    if (!inTrans)
        VX.drawImage(bufB, 0, 0);
    else {
        renderShot(AX, i - 1, SHOTS[i - 1].dur + t);
        const k = t / TRANS_D;
        switch (sh.trans) {
            case 'fade':
                VX.drawImage(bufA, 0, 0);
                VX.globalAlpha = E.inOut(k);
                VX.drawImage(bufB, 0, 0);
                break;
            case 'dip':
                if (k < 0.5) {
                    VX.drawImage(bufA, 0, 0);
                    VX.fillStyle = `rgba(0,0,0,${E.inOut(k * 2)})`;
                }
                else {
                    VX.drawImage(bufB, 0, 0);
                    VX.fillStyle = `rgba(0,0,0,${1 - E.inOut((k - 0.5) * 2)})`;
                }
                VX.fillRect(0, 0, W, H);
                break;
            case 'whip': {
                const e = E.inOut(k), off = e * W;
                VX.filter = `blur(${Math.sin(k * Math.PI) * 18}px)`;
                VX.drawImage(bufA, -off, 0);
                VX.drawImage(bufB, W - off, 0);
                VX.filter = 'none';
                break;
            }
            case 'zoom': {
                const e = E.in(k);
                VX.save();
                VX.translate(W / 2, H / 2);
                VX.scale(1 + e * 1.5, 1 + e * 1.5);
                VX.translate(-W / 2, -H / 2);
                VX.drawImage(bufA, 0, 0);
                VX.restore();
                VX.save();
                VX.globalAlpha = E.out(k);
                const s = lerp(0.85, 1, E.out(k));
                VX.translate(W / 2, H / 2);
                VX.scale(s, s);
                VX.translate(-W / 2, -H / 2);
                VX.drawImage(bufB, 0, 0);
                VX.restore();
                break;
            }
        }
        VX.globalAlpha = 1;
    }
    // film kaplaması: vinyet + gren
    const g = VX.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.5)');
    VX.fillStyle = g;
    VX.fillRect(0, 0, W, H);
    VX.globalAlpha = 0.045;
    VX.globalCompositeOperation = 'overlay';
    const ox = Math.floor((T0 * 997) % 256), oy = Math.floor((T0 * 613) % 256);
    for (let x = -ox; x < W; x += 256)
        for (let y = -oy; y < H; y += 256)
            VX.drawImage(grain, x, y);
    VX.globalCompositeOperation = 'source-over';
    VX.globalAlpha = 1;
    if (OPTS.subs)
        subtitle(i, t);
}
// ---- Altyazı: tetikleyici kelime göründüğü anda altına döner ----
function subtitle(i, t) {
    const sh = SHOTS[i];
    if (sh.sub === false)
        return;
    const a = P(t, 0, 0.35) * (1 - P(t, sh.dur - 0.25, 0.25));
    if (a <= 0)
        return;
    const text = sh.text;
    const ranges = [];
    let from = 0;
    for (const tr of sh.triggers) {
        const idx = text.indexOf(tr.w, from);
        if (idx >= 0) {
            ranges.push([idx, idx + tr.w.length, tr.at]);
            from = idx + tr.w.length;
        }
    }
    const words = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(text)))
        words.push({ w: m[0], s: m.index, e: m.index + m[0].length });
    const size = 40;
    VX.font = `500 ${size}px ${T.sans}`;
    const sp = VX.measureText(' ').width, maxW = 1500;
    const lines = [[]];
    let lw = 0;
    for (const w of words) {
        const ww = VX.measureText(w.w).width;
        if (lw + ww > maxW && lines[lines.length - 1].length) {
            lines.push([]);
            lw = 0;
        }
        lines[lines.length - 1].push(w);
        lw += ww + sp;
    }
    const lh = size * 1.35, boxH = lines.length * lh + 30, y0 = H - 60 - boxH;
    VX.save();
    VX.globalAlpha = a;
    const widths = lines.map(l => l.reduce((s, w) => s + VX.measureText(w.w).width, 0) + sp * (l.length - 1));
    const bw = Math.max(...widths) + 70;
    VX.fillStyle = 'rgba(16,10,6,0.62)';
    VX.beginPath();
    VX.roundRect(W / 2 - bw / 2, y0, bw, boxH, 16);
    VX.fill();
    VX.textBaseline = 'middle';
    VX.textAlign = 'left';
    lines.forEach((l, li) => {
        let x = W / 2 - widths[li] / 2;
        const y = y0 + 15 + lh * (li + 0.5);
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
const $ = (id) => document.getElementById(id);
const scrub = $('scrub');
scrub.max = String(TOTAL);
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function speak(i) {
    if (!OPTS.tts || !('speechSynthesis' in window) || SHOTS[i].sub === false)
        return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(SHOTS[i].text);
    u.lang = 'tr-TR';
    u.rate = 0.95;
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
        if (playing)
            speak(i);
        lastShot = i;
    }
}
function loop(ts) {
    if (playing) {
        now += Math.min(0.1, (ts - last) / 1000);
        if (now >= TOTAL) {
            now = TOTAL;
            setPlay(false);
            onEnd();
        }
    }
    last = ts;
    draw();
    requestAnimationFrame(loop);
}
function setPlay(p) {
    playing = p;
    $('play').textContent = p ? '❚❚' : '▶';
    if (p) {
        if (now >= TOTAL)
            now = 0;
        lastShot = -1;
    }
    else if ('speechSynthesis' in window)
        speechSynthesis.cancel();
}
function seek(s) { now = clamp(s, 0, TOTAL); lastShot = -1; if (!playing)
    draw(); }
$('play').onclick = () => setPlay(!playing);
scrub.oninput = () => seek(parseFloat(scrub.value));
document.getElementById('subs').onchange = e => { OPTS.subs = e.target.checked; };
document.getElementById('tts').onchange = e => { OPTS.tts = e.target.checked; };
const list = $('shots');
SHOTS.forEach((s, i) => { const b = document.createElement('button'); b.className = 'shot'; b.textContent = s.id; b.title = s.text; b.onclick = () => seek(STARTS[i] + 0.001); list.appendChild(b); });
window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        setPlay(!playing);
    }
    if (e.code === 'ArrowRight')
        seek(now + 2);
    if (e.code === 'ArrowLeft')
        seek(now - 2);
});
// ---- WebM dışa aktarma (gerçek zamanlı kayıt) ----
let rec = null;
let chunks = [];
function onEnd() { if (rec && rec.state === 'recording')
    rec.stop(); }
$('export').onclick = () => {
    if (rec && rec.state === 'recording')
        return;
    const stream = view.captureStream(30);
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
    rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    chunks = [];
    rec.ondataavailable = e => { if (e.data.size)
        chunks.push(e.data); };
    rec.onstop = () => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
        a.download = 'kahvenin-kesfi.webm';
        a.click();
        $('export').textContent = '⬇ WebM';
    };
    $('export').textContent = '● kaydediliyor';
    seek(0);
    rec.start();
    setPlay(true);
};
// test/inceleme kancası: belirli bir anı çiz
window.__seek = (s) => { playing = false; now = s; compose(now); };
window.__total = TOTAL;
requestAnimationFrame(ts => { last = ts; loop(ts); });
