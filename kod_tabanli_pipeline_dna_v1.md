KALDIĞIMIZ YERDEN DEVAM: Saf kod tabanlı video üretim pipeline'ı (v1)

Beklenti: Bu bağlamla çalışmaya devam et. Konu yalnızca saf kod tabanlı animasyonla video üretimi. Hedef, niş bağımsız çalışan bir pipeline. Nano Banana ile görsel üretip kodla birleştiren hibrit yol ayrı bir sohbette ve ayrı bir denemede ele alınıyor, bu sohbette konu dışı.

## Neden bu yol deneniyor
- Rastgele yazdırılan bir senaryodan, 4 shot'luk (yaklaşık 20 saniye) bölümün planlama dokümanı verilip tek çağrıda kodlatılması denendi. Çıktı yaklaşık 1000 satır kod; 30'dan fazla asetten oluşan, etkileşimli motion graphic; kamera hareketi ve geçişler dahil. Hiçbir aset girdi olarak verilmedi, kural promptu da yoktu. Kalite beklenenden çok yüksekti. DeepSeek ve GLM ile denendi, ikisi de iyi sonuç verdi.
- Gözlemler: çözünürlük kalitesi yüksek, hareketler akışkan. Model kendi çizdiği nesnelerin yollarını, yüzeylerini, ağırlık noktalarını bildiği için ince animasyonlar (ör. küçük bir nesnede çatlama) kolay yapılıyor. 4 shot tek çağrıda yazıldığı için shot'lar arasında kopukluk hissi yok. Metin tabanlı olduğu için token maliyeti düşük.
- Hipotez (kanıtlanmadı): Piyasadaki benzer kod tabanlı videoların kalitesinin daha düşük görünmesinin sebebi, bizim ön süzgeçlerimiz olabilir (tetikleyici çıkarma, görsel gramer, visual thinking). Bunu A/B ile ölçeceğiz.
- Karar için takılma sebebi araç yetersizliği değil, pipeline'ın ne yapacağını kararlaştıramamaktı.

## İş akışı (genel)
Ham senaryo → sahne ayrımı (bağımsız parçalar "köprü" olarak ayrı) → shot kesimi → shot başına tetikleyici çıkarma → görsel planlama (ana fikir/görsel ailesi, metafor, kompozisyon, süreklilik kilidi) → metin tabanlı edit tasarım dokümanı → sekans bazında kodlama (4-6 shot tek çağrı) → render ve ekran görüntüsüyle gözden geçirme döngüsü.
Çözülmüş kısımlar: sahne ayrımı, shot kesimi, tetikleyici çıkarma formatı (aşağıda özet var).
Odak: edit tasarım dokümanı (en çok titizlik gerektiren adım; kodlayan modele yalnızca mekanik uygulama kalacak biçimde yazılacak) ve kodlama aşaması.

## Tanımlar
- Shot = tek bir tasarım birimi, kendi içinde animasyon verilen tek kompozisyon (AE'deki comp gibi). Geleneksel kamera shot'ı değil.
- Sahne ayrımı: aynı dünyada (mekan/ışık/palet/ölçek) geçen, tek bağlama ait parça. Hiyerarşi: Perde > Sekans > Sahne > Shot. Ölçüt: "aynı görsel dünyaya sığar mı?"
- Köprü: hiçbir sahnenin dünyasına ait olmayan bağımsız parça (açılış, geçiş sorusu, kapanış, izleyiciye hitap). Nasıl ele alınacağı shot tasarımı aşamasında kararlaştırılır (açık nokta).
- Tetikleyici = anlatıda duyulduğu anda ekranda görülmesi gereken en küçük anlam birimi. Çıkarım işidir, tasarım kararı değil.

## Shot kesim kuralı (uygulandı, onaylandı)
Karar birimi cümle değil bilgi birimidir. Cümle sınırı sadece aday.
1. Bağımsızlık testi: tek başına çizilebiliyor mu? Evetse ayrı shot adayı.
2. Bağlam testi: ayırınca görseli anlamlı yapan bağlam kayboluyorsa kesilmez. Çatışırsa bağlam testi kazanır.
Kesim yeri: görsel durumun değiştiği nokta (yeni özne, mekan/zaman, bilgi, kurulum→sonuç, soru→cevap). Birlikte kalanlar: karşılaştırmalar, neden-sonuç, iddia+kanıt, alıntı+söyleyen. Yer-zaman etiketleri devamından ayrılmaz. Shot bütçesi yok.
Çıktı kuralları: metin kelimesi kelimesine korunur, shot'lar birleşince ham senaryo birebir çıkar, sıra bozulmaz.

## Tetikleyici çıkarma kuralı (uygulandı, onaylandı)
Testler: görselleştirilebilirlik, bilgi taşıma, atomiklik (tek tetikleyici = tek şey), sıra. Önceki tetikleyiciye gönderme ("bu etki") yeni nesne değil, referans olarak notlanır.
Türler: varlık, eylem/olay, zaman/yer, sayı, ilişki/karşılaştırma, soyut kavram, alıntı.
Belirsiz olanlar "tartışmalı" işaretlenir (soru tetikleyicileri, belirsizlik ifadeleri). Bunlar için karar henüz verilmedi.
Çıktı formatı (her shot için): önce shot'ın ham metni, sonra "Tetikleyiciler:" altında her satır "metindeki ham ifade: (n) tetikleyici [tür]", senaryo sırasıyla. İma yoluyla gelene "ima" notu. Biçim: grup grup tablo ("1. grup: sahne/köprü: ad" başlığı, altında Shot | Metin ve tetikleyiciler).
Not: Saf kod yolunda tetikleyici başına KOD/ASET ayrımına gerek yok; her şey kodla çizilir. Kodla çizilemeyen/zor nesneler denemede ölçülecek (bkz. denemeler).

## Planlayıcı akışı
Ana fikir (tüm senaryodan tek cümle) → tek görsel ailesi/metafor ailesi → shot başına: tetikleyici sırası, metafor (ailenin içinden; test: yazısız anlaşılıyor mu, aileye uyuyor mu), kompozisyon planı, süreklilik kilidi (önceki shot'la birebir aynı kalacaklar), kamera/geçiş niyeti.
Not: Ana fikir/görsel ailesi ve süreklilik kilidi henüz bir senaryoda uygulanmadı.

## Kompozisyon / görsel gramer kuralları (kod için sayısal yerleşim kuralına çevrilecek)
- Okuma sırası tetikleyici sırasıyla örtüşür (Z hattı, soldan sağa, yukarıdan aşağı).
- Odak hiyerarşisi: shot'ın asıl bilgisi en çok alan ve kontrast. Tek doygun vurgu rengi yalnızca asıl bilgide.
- Benzer elemanlar aynı biçim, aynı boyut, eşit aralık (gruplama).
- Sonradan girecek elemanlara boş bölge ayrılır. Bağlam sakin/küçük/soluk, sonuç büyük/kontrastlı.
- İlişkiler yazısız kurulur: dal çizgisi, ok, parantez, düşünce balonu, ortak eksen.
- Ortak zemin çizgisi, kenar boşlukları, renk rolleri sabit.
- Bir shot'ta tek seferde okunabilir eleman sayısı sınırlıdır (bilişsel yük; yaklaşık 4±1 öğe bir uyarı eşiği olarak kullanılır, katı kural değil).
- Elementler aynı anda değil, sırayla ve kaliteli motion graphic ile girer.
- Hiçbir eleman ötekini tamamen kapatmasın.

## Edit tasarım dokümanı (bu sohbetin ana ürünü)
Kodlayan modele verilecek, mekanik uygulanabilir metin dokümanı. Şunları içermeli:
- Ortak tasarım token'ları dosyası: palet (rol bazlı), çizgi kalınlığı, tipografi, hareket eğrileri/süreleri, karakter ölçeği ve duruşu, kamera dili, geçiş dili. Sekansın tüm shot'ları ve tüm sekanslar aynı token'ı kullanır.
- Shot başına: süre, tetikleyici giriş sırası ve zamanları, kompozisyon (1920x1080 üzerinde yaklaşık bölgeler), ağırlık/vurgu, ilişki çizgileri, kamera hareketi, geçiş, süreklilik çapası (önceki/sonraki shot'la ortak eksen veya çizgi).
- Etiket metinleri (Türkçe) kodla eklenir, doğrudan senaryodan alınır.

## Süreklilik (nesne taşımadan)
- Sekansın 4-6 shot'u tek kodlama çağrısında yazılır, model hepsinin yerleşimini birlikte görür.
- Sabit çerçeve (zemin çizgisi, kenar boşlukları, ana eksen), sabit renk rolleri, tutarlı kompozisyon ritmi, sabit karakter ölçeği, shot geçişinde ortak çapa.
- Shot'lar arası nesne taşıma yok. Her shot kendi içinde eksiksiz çizilir. Yalnızca kimliği önemli, tekrar eden varlık (ör. maskot) için tek bir sabit fonksiyon/tanım tüm shot'larda yeniden kullanılır. Bunlar planlamada baştan listelenir.

## Kod mimarisi (öneri, denemede ölçülecek)
- Tek proje, sabit 1920x1080 sahne (SVG veya canvas), zaman çizelgesi (timeline) tabanlı.
- Zaman kontrollü ve ileri/geri sarılabilir (seekable) olmalı: böylece herhangi bir andan ekran görüntüsü alınıp gözden geçirilebilir.
- Her shot bir fonksiyon, ortak çizim yardımcıları/primitifleri ve token dosyası paylaşılır.
- Kamera ayrı bir katman, hareketler eleman animasyonundan bağımsız.

## Çalışma kısıtları
- Planlama ve prompt'ları AI yazar, ben sadece çalıştırıp sonucu getiririm. Manuel yük minimum.
- Parça parça yazılır, ama bir parça için plan başlamadan önce tamamen bitmiş olmalı.
- AI görmeden tahmine dayalı yargı yapmaz: gözden geçirme döngüsü ekran görüntülerine dayanır.
- Her yanıtın sonunda token kullanımı/kalan yüzde isteniyor; AI'nın bu sayılara erişimi yok, uydurma rakam yazılmaz.

## Denemeler (sonuçlar bu sohbetten ana sohbete taşınacak)
1. Planlama girdisi olmadan vs edit tasarım dokümanıyla aynı shot'ların kodlanması: kalite farkı.
2. Sekans başına kaç shot tek çağrıda güvenilir kodlanabiliyor (3, 4, 6, 8?). Hata oranı ve süreklilik.
3. Uzun videoda şablon hissi / görsel çeşitlilik: aynı tasarım dili 30+ shot'ta yorar mı.
4. Kodla çizmenin sınırı: kolaydan zora 8 nesneyle sınama (cetvel, telefon, saat, basit insan, beyin, el, gülen yüz, dökülen kahve) ve basit/organik ayrımı.
5. Modeller arası karşılaştırma (DeepSeek, GLM, Claude vb.): kalite, hata, süre, token.
6. Gözden geçirme döngüsü (render → ekran görüntüsü → düzeltme) kaç turda kaliteyi yakalıyor.
7. Kamera hareketi ve geçişlerin shot'lar arası bütünlüğe katkısı.

## Açık noktalar
- Köprü parçalarının (açılış, geçiş soruları, kapanış) görsel ele alınışı.
- Tartışmalı tetikleyici notları ve soru tetikleyicilerinin görselleşip görselleşmeyeceği.
- Olay shot'u / bilgi shot'u ayrımının saf kod yolunda hâlâ gerekip gerekmediği (ikisi de kodla çizilecek).
- Kodlama prompt'unun (kod modeline verilecek talimat) yapısı.

## Park edilen: hibrit yol (bu sohbette konu dışı)
Nano Banana ile kompozisyon/aset üretip kodla birleştirme ayrı denenecek. Ana fikirler: gerçek mekan gerektiren olay shot'ları Nano Banana'da üretilir ve alt karelerle animatic yapılır; bilgi shot'larında kompozisyon arka plansız Nano Banana'da, arka plan ve kamera kodda; aset ayrımı yeniden üretimle; kimlik sürekliliği olan varlıklar proje başında ortak aset olarak üretilir.
