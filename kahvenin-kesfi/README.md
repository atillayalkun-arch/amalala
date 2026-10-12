# Kahvenin Keşfi — saf kod animasyon

TypeScript + Canvas 2D, harici kütüphane yok. 1920×1080, ~89 sn, 12 shot.

- `PLAN.md` — sahne/shot kesimi, tetikleyiciler, edit tasarım dokümanı
- `src/core.ts` — tasarım token'ları, easing, kamera, çizim primitifleri, belgesel grafikleri
- `src/assets.ts` — tekrar eden varlıklar (Kaldi, keçi, keşiş, çalı, kulübe, manastır, ateş, koku, harita)
- `src/shots.ts` — 12 shot (her biri `render(t)` fonksiyonu)
- `src/main.ts` — oynatıcı, geçiş birleştirici (cut/fade/dip/whip/zoom), altyazı + tetikleyici vurgusu, gren/vinyet, WebM dışa aktarma

## Çalıştırma
```
tsc -p .          # dist/app.js
node build.mjs    # tek dosya: kahvenin-kesfi.html
```
`index.html` veya `kahvenin-kesfi.html` dosyasını tarayıcıda açın. Kısayollar: Boşluk = oynat/durdur, ←/→ = 2 sn sar.
"⬇ WebM" düğmesi videoyu gerçek zamanlı kaydedip indirir. İnceleme için konsolda `__seek(saniye)` kullanılabilir.
