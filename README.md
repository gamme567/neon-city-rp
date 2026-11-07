# NEON CITY RP — Hesap, Kamera ve Sunucu Ayarları sürümü

## Başlatma
1. ZIP'i tamamen bir klasöre çıkartın.
2. `start.bat` dosyasını çalıştırın.
3. Tarayıcıda `http://127.0.0.1:8000` açılır.
4. İlk girişte **Hesap oluştur** seçeneğiyle kullanıcı adı ve en az 8 karakterli şifre belirleyin.

## Kontroller
- W: ileri
- S: geri
- A: sola
- D: sağa
- SHIFT: koş
- T: sohbet
- E: etkileşim
- ESC: duraklat / fare kilidini bırak
- Fare: oyun görüntüsüne tıklayıp imleci kilitleyin; fareyi hareket ettirerek kamerayı/baş yönünü çevirin. ESC ile serbest bırakın. İmleç kilidi istemezseniz sahnede basılı tutup sürükleyerek de kamerayı döndürebilirsiniz.
- Fare tekerleği: kamera mesafesi

## Sunucu ayarları
`server_settings.json` dosyasını `server.py` ile aynı klasörde düzenleyin. Değişikliklerin uygulanması için sunucuyu kapatıp yeniden başlatın.

Örnek:
```json
{
  "name": "NEON CITY RP",
  "region": "TÜRKİYE · ANA SUNUCU",
  "capacity": 64,
  "mode": "Serbest RP",
  "time_of_day": "evening",
  "weather": "clear",
  "day_cycle_minutes": 0
}
```

`time_of_day` seçenekleri: `morning`, `noon`, `evening`, `night`, `cycle`.
- morning: sabah
- noon: öğle
- evening: akşam
- night: gece
- cycle: bilgisayarın yerel saatine göre gün ışığı döngüsü

`capacity`: 1–256 arası oyuncu kapasitesi. `mode`: sunucu kartında görünen oyun modu. `name` ve `region`: sunucu listesinde görünen ad ve bölge.

## Hesap güvenliği
Hesaplar `accounts.json` içinde saklanır. Şifreler düz metin olarak tutulmaz; PBKDF2-HMAC-SHA256 ve rastgele salt ile hashlenir. Bu prototipte oturumlar sunucu belleğindedir; Python sunucusu yeniden başlatıldığında kullanıcıların tekrar giriş yapması gerekir. `accounts.json` dosyasını silmek tüm kayıtlı hesapları siler; yedekleyin.

## Önemli
Bu proje yerel ağ prototipidir. İnternete açık, herkese açık sunucuya çevirmeden önce HTTPS, rate limit, kalıcı oturum, yönetici paneli ve güvenlik sertleştirmesi gerekir. `weather` ayarı şu an yapılandırmada saklanır; görsel yağmur/hava efektleri henüz uygulanmamıştır.


## Şehir ekonomisi (V4)
- Hesap açıldığında 6.500 başlangıç parası verilir.
- Şehir menüsünden market, garaj, günlük görevler ve mini oyunlar açılır.
- Araçlar ve market eşyaları hesap dosyasında kalıcı saklanır. Araç satın alma vardır; araca binme/sürüş entegrasyonu sonraki aşamadır.
- Mini oyun ödülleri backend tarafından sabit ödül ve süre kontrolüyle verilir. Bu prototipte tam hile önleme/anti-cheat değildir.

## İnternette yayınlama
Netlify statik HTML/CSS/JS dosyalarını yayınlayabilir; bu projedeki sürekli çalışan Python HTTP oyun sunucusunu Netlify üzerinde çalıştıramaz. Netlify'ı istemci için, Python backend'i ise Render/Fly.io/Railway gibi sürekli çalışan bir Python hizmetinde (veya VPS üzerinde) barındırmak gerekir. Gerçek çok oyunculu kullanım öncesi SQLite/PostgreSQL veritabanı, HTTPS, kalıcı oturumlar, WebSocket tabanlı hareket senkronizasyonu, oran sınırlama ve güvenlik sertleştirmesi gerekir. Mevcut sunucu prototipi HTTP polling kullanır ve oyun sunucusu tek süreç içi bellekte oyuncu durumunu tutar; üretim ortamı değildir.


### Netlify + Render dağıtımı (ön hazırlık)
1. Projeyi GitHub deposuna yükle.
2. Netlify'da bu depoyu bağla; `netlify.toml` statik yayın klasörünü proje kökü olarak ayarlar.
3. `site/config.js` içindeki `window.NEON_API_BASE` değerini Render'da oluşturduğun backend adresiyle değiştir (sonunda `/` olmasın).
4. Aynı depodan Render'da Python Web Service oluştur. Build Command: `pip install -r requirements.txt` (bu projede ek paket gerekmeyebilir); Start Command: `python server.py`. Render `PORT` ortam değişkenini otomatik sağlar.
5. Render servisi hazır olunca `config.js` adresini güncelle ve Netlify'ı yeniden deploy et.

**Önemli:** Bu sürüm prototip amaçlıdır. Render'ın varsayılan dosya sistemi geçicidir; hesap verileri deploy/restart sonrasında kaybolmamalıysa kalıcı disk veya veritabanı kurulmalıdır. Şu an gerçek zamanlı hareket/sohbet WebSocket değil, HTTP polling kullanır. İnternete açmadan önce güvenlik, rate-limit, kalıcı oturum, veritabanı, CORS alan adı kısıtlaması ve anti-cheat geliştirmesi gerekir.
