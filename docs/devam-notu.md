# Devam notu: Japonca YouTube kanalı, hedef kanal analizi → kanal DNA'sı

Bu belge yeni bir oturumun kaldığımız yerden devam etmesi için yazıldı. Önce bunu oku.

## 1. Amaç
Kullanıcı (IT öğrencisi, faceless Japonca YouTube kanalı kuruyor) için: hedef bir kanalı analiz et → niş talebini çıkar → **bizim kanalın DNA'sını ve kanal haritasını** yaz → sonra video fikri üretim hattını kur. Hızlı başlangıç isteniyor; karmaşık veritabanı, persona paneli, kendi kanal tarayıcımız **şimdilik yok** (uzun vadeli proje olarak ileride).

## 2. Çalışma tercihleri
- Türkçe yazışma. Her yanıtın sonunda kullanılan token ve kalan yüzde (tahmini) gösterilir.
- Edit/kurgu/prodüksiyon önerisi istenmiyor.
- Doğru ve dürüst bilgi, itiraz kabul. Somut örnek seviyor.
- Japonca kontrolü yapacak kimse yok: başlık/ifadeler hedef kanalın kendi tutmuş kalıplarından ve yorumlardaki gerçek Japoncadan türetilmeli.
- Script yazımından yoruldu: yorum ayıklama scripti bitti, tekrar sürüm istemiyor. Veri sorunu çıkarsa LLM ile çözülecek.

## 3. Temel kararlar (eski sohbetten + bu sohbetten)
- **Talep önce gelir.** Talep yokken sıfırdan niş/konu uydurulmaz. Formül: **kanıtlanmış ihtiyaç × kullanılmamış açı.**
- Video 3 katmanlı: öncül (talep burada), açı (hangi soruya cevap), yüzey. Öncül aynı + soru aynı = kopya. Vaat testi ve yeni bilgi testi ile açı değişimi ölçülür.
- Kopya kontrolü açı seviyesinde yapılır. Risk = benzerlik × erişim × yenilik (2 gün önce 10 bin izlenen benzer video, yıllar önceki 100 izlenenden büyük risk).
- **Konu kopya testi (kullanıcının yöntemi, onaylandı):** fikir için 15-30 başlık kalıbı / sorgu üret (Japonca varyasyonlarla), YouTube'da ara (alaka/tarih/izlenme sıralamaları), çıkan videoları tabloya al, LLM "aynı ihtiyaç+açı mı" diye eler, kalanlara performans+tarih ile risk tablosu. Durma kuralı: yeni sorgu yeni ilgili video getirmiyorsa dur. Çıktıda sorgular, video sayısı, elenenler ve linkler zorunlu. Garanti değil, ölçülebilir güven. YouTube API: arama 100 birim, günlük 10.000 kota (günde ~100 arama).
- **Fikir üretimi video başına yapılır** (havuzun tamamı prompt'a girmez): video özet kartı (ihtiyaç, vaat, açı, format, 3-5 ana iddia) + süzülmüş yorumlar (soru, itiraz, istek, kişisel hikâye) + kanal DNA'sı → 30-50 aday → dış doğrulama (iddia listesi, kaynak URL + alıntı, bulunamayan "bulunamadı") → kopya testi → paketleme. Havuz büyüyünce: kaynak seçimi, boş hücre (ihtiyaç × açı) bulma, kopya filtresi.
- Başarısız videolar fikir kaynağı değil **negatif örnek** (talep mi, paket mi, açı mı zayıf, ayrıştırılmalı). Kurgusal fikirlerde talep kanıtı: aynı kalıbın başka öznelerle başarısı, otomatik tamamlama, 知恵袋, yorumlar.
- İsteğe bağlı üst katman: "bağlam araştırması" (video neden Japonya'da tuttu, rakip hipotezler, hâlâ geçerli mi). Bulgu ile yorum ayrı, kaynak zorunlu.
- Kanalın ilk 10-20 videosunda açılar kanıtlanmış ihtiyaca yakın ama net farklı olmalı.

## 4. Hedef kanal
**深淵回廊@人間の脳と心の仕組み** (ID UCV8Jcbou4ei7HhtuffgvUYg). Açılış 2026-07-16; çekim 2026-10-14: 97.2K abone (ekran görüntüsünde 101K), 55 video (49 uzun, 6 Shorts), 13.8M izlenme, haftada ~4,3 video, uzun video medyanı 89.868, ort. süre 17:10, 17.871 yorum. vidIQ benzer kanallar: Asahi / 心理学しか勉強してない男 (48.4K), ずんだの本質 (64.4K), 黒幕の日記帳 (129K). Sahibi ayrıca "しんえん散歩" (stereo sesli şehir yürüyüşü) kanalını işletiyor. Sadece bu kanal örnek alınacak.

### Veriden çıkan ilk bulgular (yalnızca başlık+sayılar; kapak/transkript/yorum içeriği henüz okunmadı)
- İlk iki video izlenmenin **%42'si**, ilk beş **%57'si**: 015 (Shorts "IQ低い人に視えてる世界", 3,21M) ve 048 (【IQ70とIQ160】, 2,64M). 48 uzun videonun %25'i medyanın 2 katı+; sadece 2'si 10 katı geçiyor.
- **"〇〇に見えてる世界" (başkasının gözünden dünya)** kalıbı: 7 video, medyan ~441K, 4'ü ≥2x. IQ ve kuşak (Z世代, 052: 534K) karşılaştırmalarında patlıyor; klinik konularda zayıf (şizofreni 14: 15K, ASD 30: 90K, HSP 45: 82K).
- Konu grupları (örtüşür, küçük örnek): IQ/zekâ uzun videolar medyan 144K; bilmece/düşünce deneyi 186K; "5 işaret/7 tip" listeleri 125K; **klinik/duygusal dert grubu medyan 63K, 0 outlier**.
- **Short → uzun zincir:** 015 Short (6 Ağu) → 017 uzun (8 Ağu, 1,02M) → 048 uzun (1 Eki, 2,64M). Son Short 13 Ağustos; sonra bırakılmış.
- Kanal açıklaması "怖い心理学 / 人生の落とし穴 / ゾッとする視点" diyor ama talep **IQ/dünya görüşü, sosyal psikoloji (çekicilik, uyum, iş yeri insan tipleri)** tarafında. DNA'da beyan edilen konum değil kanıtlanmış talep esas alınmalı.
- Karıştırıcılar: `【社会心理学】` gibi etiketler ve 22+ dk süre daha geç (kanal büyürken) kullanılmış, etki ayrıştırılamaz. Aylık uzun video medyanı Tem 47K → Ağu 78K → Eyl 155K → Eki 124K (Ekim olgunlaşmadı). CTR/izlenme süresi yok.
- Yorumlardan (010): izleyiciler anlatıcının okuma hatalarını fark ediyor ("読上ソフトかAI?"), yani **yapay ses seslendirme** gibi görünüyor; kanal sahibi yorumlara kişisel cevap veriyor; 010'un yüksek yorum oranı videonun sonundaki "film önerin" çağrısından (CTA), talep sinyali değil.

## 5. Veri ve araçların durumu
- Kullanıcının bilgisayarında (depoda YOK): `.../shinen-kairo_UCV8Jcbou4ei7HhtuffgvUYg/videolar/` altında 55 video `.md` (başlık, açıklama, etiketler, tüm yorumlar; transkript yok), kanal bilgisi ve video listesi.
- **`araclar/yorum_ayikla.py` BİTTİ** (v3). Kullanıcının bilgisayarında çalıştırıldı: **55/55 OK**, tüm yorum sayıları başlıklarla birebir (015: 2762 ana/1093 cevap, 048: 1586/1173, 017: 1297/389). `yorumlar_secili/` klasöründe her video için yorum paketi (≤100 ana yorum: en beğenilen, soru, istek, kişisel anlatı, rastgele; kanal sahibi cevapları dahil).
- Seçilen **13 video**: üst grup 015, 048, 017, 018, 052, 049, 002, 042; zayıf grup 010, 004, 009, 014, 008. Transkript istenen 11: üst grubun 8'i + 010, 009, 014 (ayrı dosya, `048_transkript.md` gibi).

## 6. Sıradaki işler
1. Kullanıcı 13 yorum dosyası + 11 transkripti yükler (sohbete @ ile; yüklemeler oturumlar arası kalıcı değil, gerekirse ilk iş depoya `veri/hedef-kanal/` altına kopyala; depo özel olmalı).
2. Video video işle: her biri için kart (ihtiyaç, vaat, açı, format, giriş/hook, yapı, ton, yorum örüntüleri) → `analiz/kartlar/NNN.md`. Tam transkript okumayı en önemli 3 videoyla (015, 048, 052) sınırla; diğerlerinde giriş (~90 sn) + yapı.
3. **Başarı kalıpları raporu** (premise, açı, paketleme, ton, yapı, yorumlarda karşılanmamış ihtiyaçlar).
4. **Bizim kanal DNA'sı + kanal haritası** (niş, izleyici, vaat, ton, format kuralları, yapmayacaklarımız, içerik sütunları, ilk 20 video yönü, hedef kanaldan net farkımız).
5. Hafif doygunluk kontrolü (benzer 3 kanalın açılış tarihi ve büyümesi).

## 7. Açık sorular
- **Fark noktası** (kullanıcıya soruldu, cevaplanmadı): bizim kanal hedef kanal gibi geniş "beyin ve zihin" mi, yoksa iş hayatı ağırlıklı bir alt alan mı?
- Kapak görselleri henüz görülmedi (ekran görüntüsü ya da dosya gerekebilir). Paketleme DNA'nın önemli parçası.
- Short'lar bizim için açı testi aracı olarak kullanılacak mı?
- Ses/anlatım kararı (yapay ses, okuma hatası riski).
