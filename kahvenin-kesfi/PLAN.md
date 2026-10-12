# Kahvenin Keşfi — Edit Tasarım Dokümanı (v1)

Saf kod (TypeScript + Canvas 2D), 1920×1080, zaman çizelgesi tabanlı, ileri/geri sarılabilir.
Toplam süre ≈ 88 sn, 12 shot (1 köprü + 11 shot), 4 sahne.

## Ana fikir ve görsel ailesi
- **Ana fikir:** Sıradan bir akşam, bir çobanın merakı ve bir keşişin öfkesi, ateşte kavrulan kırmızı bir meyveyle dünyanın en sevilen kokusunu ortaya çıkarır.
- **Görsel aile:** Sıcak, düz (flat) belgesel illüstrasyonu + belgesel bilgi grafikleri (zaman çizelgesi, harita, etiket, kesit, sayaç).
- **Tek doygun vurgu rengi:** kahve meyvesinin kırmızısı (`berry #D7263D`). Bu renk yalnızca meyvede kullanılır. Vurgu metinleri altın (`gold #E8A33D`).
- **Işık anlatısı (süreklilik kilidi):** gündüz → gün batımı → alacakaranlık → gece/ateş ışığı. Her shot bir öncekinin bittiği ışıkta başlar.

## Ortak tasarım token'ları (`src/core.ts → T`)
| Rol | Değer |
|---|---|
| Mürekkep / koyu | `#2A1E17` |
| Krem metin | `#F4E9D8` |
| Vurgu (yalnız meyve) | `#D7263D` |
| Bilgi vurgusu | `#E8A33D` |
| Tepeler uzak/orta/yakın | `#B7B98A` / `#8FA05C` / `#6B843D` |
| Taş / cüppe | `#B9A58A` / `#5B3A29` |
| Ateş | `#FFB238` → `#F2542D` |
| Koku şeridi | `#D9B38C` (yarı saydam) |
| Kavrulmuş çekirdek | `#4A2C1A` |
- Tipografi: başlıklar serif (Georgia), etiket ve altyazılar sans.
- Hareket: girişler `back` (hafif taşma), kamera `inOut` kübik, bilgi grafikleri `out` kübik. Standart giriş 0.5 sn.
- Karakter ölçeği: Kaldi yaklaşık 300 px (s=1), keçi yaklaşık 160 px uzunluk, keşiş Kaldi ile aynı boyda. Zemin çizgisi y≈800.
- Kamera dili: yavaş push-in / pull-back, takip pan'ı (paralaks), vurgu anında snap-zoom + sarsıntı, ECU (aşırı yakın) ara planlar.
- Geçiş dili: `dip` (karartma), `fade`, `whip` (hızlı kaydırma + bulanıklık), `zoom` (içinden geçme), `cut`. Geçiş süresi 0.7 sn.
- Altyazı: alt bantta. Tetikleyici kelime ekranda göründüğü anda altın renge döner (karaoke vurgusu).

## Tekrar eden varlıklar (tek fonksiyon, tüm shot'larda aynı)
`kaldi()`, `goat()`, `monk()`, `bush()`, `hut()`, `monastery()`, `fire()`, `aroma()`, `hills()`.

---

## 0. grup — Köprü: Açılış
| Shot | Süre | Metin ve tetikleyiciler | Görsel / kamera / geçiş |
|---|---|---|---|
| S00 | 4.5 | **Kahvenin Keşfi** — (1) başlık [alıntı/başlık] | Koyu zemin. Kırmızı kahve meyvesi 0.3'te büyür, 1.2'de buhar çizgileri yükselir, 1.5'te başlık harf harf belirir, 2.5'te alt etiket "Etiyopya · IX. yüzyıl efsanesi". Kamera 1.0→1.08 push. Çıkış: dip. |

## 1. grup — Sahne A: Yayla (gündüz → gün batımı)
| Shot | Süre | Metin ve tetikleyiciler | Görsel / kamera / geçiş |
|---|---|---|---|
| S01 | 8 | Dokuzuncu yüzyıl. Etiyopya’nın yüksek yaylalarında, — (1) Dokuzuncu yüzyıl [zaman] @0.4 · (2) Etiyopya [yer] @2.8 · (3) yüksek yaylalar [yer] @5.2 | Parşömen zemin. Zaman çizelgesi (MS 0–2000), 850'ye düşen işaret, "IX. YÜZYIL". 2.4'te çizelge çıkar, Afrika haritası gelir. Etiyopya altınla dolar, nabız halkası. Kamera Etiyopya'ya 1→3.2 zoom yapar. 5.2'de tepeler alttan yükselir, harita gökyüzüne dönüşür, rakım parantezi "≈2.000+ m". |
| S02 | 7 | Kaldi adında genç bir keçi çobanı yaşıyordu. — (1) Kaldi [varlık] @0.6 · (2) genç [nitelik] @1.8 · (3) keçi çobanı [varlık] @2.8 · (4) yaşıyordu → kulübe [ima, yer] @4.3 | Gündüz yayla. Kaldi soldan yürüyerek girer. Alt bantta "KALDİ" etiketi, "genç" rozeti. Üç keçi zıplayarak düşer ve otlar. Sağ tepede tukul kulübe belirir, bacasından duman çıkar. Kamera yavaş drift + push. Giriş: fade. |
| S03 | 6.5 | Bir akşam keçileri eve dönmedi. — (1) Bir akşam [zaman] @0.3 · (2) keçileri [varlık] @2.0 · (3) eve dönmedi [olay] @3.2 | Gökyüzü gün batımına geçer, güneş batar. Ağıl: kesik çizgili hayalet keçi silüetleri belirir ve sonra söner. Sayaç "3 → 0". Kaldi kulübe kapısında sağa sola bakar. Kamera 1.15→1.0 pull-back. Giriş: fade. |

## 2. grup — Sahne B: Tepelerin ardı (alacakaranlık)
| Shot | Süre | Metin ve tetikleyiciler | Görsel / kamera / geçiş |
|---|---|---|---|
| S04 | 7.5 | Kaldi onları ararken tepelerin ardında garip bir sesle irkildi. — (1) Kaldi onları ararken [eylem] @0.3 · (2) tepelerin ardında [yer] @3.0 · (3) garip bir ses [olay] @4.0 · (4) irkildi [eylem] @5.4 | Paralaks takip pan'ı. Kaldi seslenerek yürür (ses yayları, "?"). Önüne büyük tepe gelir. Tepenin ardından dalgalı ses halkaları yayılır. İrkilme: zıplama, "!", kamera sarsıntısı + snap-zoom. Giriş: whip. |
| S05 | 8.5 | Keçileri, parlak kırmızı meyveleri olan bir çalılığın etrafında zıplıyor, sanki dans ediyordu. — (1) Keçileri [varlık] @0.4 · (2) parlak kırmızı meyveler [varlık] @1.8 · (3) çalılık [varlık] @2.6 · (4) etrafında zıplıyor [eylem/ilişki] @3.6 · (5) sanki dans [metafor] @5.6 | Tepe sırtından tilt-up ile açılış. Keçiler belirir. Karanlık çalılıkta kırmızı meyveler parlayarak patlar (tek vurgu rengi). Çalılık aydınlanır, "çalılık" etiketi gelir. Keçiler elips yörüngede zıplar. Dans: arka ayaklarda ritimli sallanma, nota işaretleri, ışık huzmesi. Kamera hafif salınım. Giriş: zoom. |
| S06 | 9 | Kaldi şaşkınlıkla yaklaştı. Meyvelerden birini kopardı, uzun uzun baktı ve sonunda tadına baktı. — (1) şaşkınlıkla [duygu] @0.3 · (2) yaklaştı [eylem] @1.0 · (3) meyvelerden birini kopardı [eylem] @2.8 · (4) uzun uzun baktı [eylem/süre] @4.4 · (5) tadına baktı [eylem] @7.0 | A: Şaşkın yüz, "?" işaretleri, Kaldi yaklaşır. B: Kamera ele zoom yapar, meyve "çıt" diye kopar. C: ECU, bokeh zemin, dev göz + meyve. Süre halkası dolar, meyve ikiye ayrılır ve kesit görünür ("meyve eti", "çekirdek ×2"). D: Profil yakın plan, ısırma ve çiğneme çizgileri. Giriş: cut. |
| S07 | 7 | Birkaç dakika sonra yorgunluğu kaybolmuştu. Gözleri parladı. — (1) birkaç dakika sonra [zaman] @0.2 · (2) yorgunluk [durum] @1.9 · (3) kaybolmuştu [değişim] @3.0 · (4) gözleri parladı [eylem] @4.6 | Saat ibresi hızla döner, "+ birkaç dakika". Kaldi çökük, enerji pili boş ve "zzz". Pil dolar, Kaldi doğrulur. ECU gözler: altın parlama, yıldız ışıltıları, ışın patlaması. Giriş: dip. |

## 3. grup — Sahne C: Manastır (gece, ateş ışığı)
| Shot | Süre | Metin ve tetikleyiciler | Görsel / kamera / geçiş |
|---|---|---|---|
| S08 | 7.5 | Avuçlarını meyveyle doldurup yakındaki manastıra koştu. — (1) avuçlarını meyveyle doldurup [eylem] @0.3 · (2) yakındaki manastır [yer] @2.6 · (3) koştu [eylem] @3.8 | Kuşbakışı avuçlar, meyveler sekerek dolar. Geniş gece planı, tepede ışıklı manastır, etiket ve kesik çizgili rota pini. Koşu: toz bulutları, hız çizgileri, takip kamerası. Giriş: whip. |
| S09 | 9 | Ama keşiş bu meyvenin şeytanın işi olduğunu düşündü ve onları ateşe fırlattı. — (1) Ama [karşıtlık] @0.2 · (2) keşiş [varlık] @0.9 · (3) bu meyve [referans] @2.0 · (4) şeytanın işi [soyut] @3.0 · (5) düşündü [eylem] @4.0 · (6) ateş [varlık] @5.4 · (7) fırlattı [eylem] @6.0 | İç mekan, taş duvar, ocak. "Ama": ışık soğur, keşiş kaşlarını çatar. "KEŞİŞ" etiketi. Meyveye halka. Düşünce balonu: meyve = boynuzlu şeytan. Balon titrer. Ateş harlanır, kamera ocağa itilir. Meyveler kesik çizgili parabolle ateşe uçar, kıvılcım. Giriş: fade. |
| S10 | 7.5 | Ateşten yükselen koku bütün odayı sardı. — (1) ateş [referans] @0.2 · (2) yükselen koku [olay] @1.8 · (3) bütün odayı sardı [kapsam] @3.8 | Ocak yakın planı. Meyveler kırmızı → kahve → koyu renge döner, "kavrulma" etiketi. Koku şeritleri yükselir. Kamera tüm odaya açılır, şeritler odayı doldurur. Giriş: cut. |
| S11 | 7.5 | Keşişler durdu, birbirlerine baktı. — (1) keşişler [varlık] @0.3 · (2) durdu [eylem] @1.4 · (3) birbirlerine baktı [ilişki] @3.0 | Üç keşiş (kitap okuyan, süpüren, ilk keşiş). Durdu: beyaz flaş + donma (koku hareket etmeye devam eder). Başlar döner, kesik çizgili bakış hatları üçgen oluşturur. Push-in, sona karartma. Giriş: fade. |

## Kontrol
- Shot metinleri birleştirildiğinde ham senaryo birebir elde ediliyor (başlık S00'da).
- Tetikleyici sırası metin sırasıyla aynı. Tek istisna S05'te "çalılık": görsel olarak baştan karanlık silüet olarak bulunuyor ve metin sırasında aydınlanıp etiketleniyor.
