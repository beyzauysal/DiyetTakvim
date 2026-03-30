# DiyetTakvim — Web Frontend dokümantasyonu

## Canlı site adresi (domain)

**Buraya deploy sonrası tam adresi yazın:**

```
https://BURAYA-FRONTEND-DOMAIN-YAZIN.com
```

Örnek: `https://diyettakvim.com` veya `https://diyettakvim.vercel.app`

Tarayıcıdan bu adrese girildiğinde uygulama açılmalı (ödev şartı).

---

## Teknoloji

- **React (Vite)** — kaynak: `web/` klasörü
- **API adresi:** production’da `web/.env.production` veya hosting ortam değişkeni ile  
  `VITE_API_URL=https://SIZIN-API-DOMAIN.com`  
  (boş bırakılırsa aynı origin’e `/api` proxy’si gerekir — çoğu PaaS’ta API ayrı subdomain ise **mutlaka tam API URL verin**.)

---

## Derleme

```bash
cd web
npm ci
npm run build
```

Çıktı: `web/dist/` — statik hosting (Vercel, Netlify, S3+CloudFront vb.) ile yayınlanır.

---

## Ana sayfalar / API kullanımı (özet)

| Sayfa / özellik | Route | Bağlı API (örnek) |
|-----------------|-------|-------------------|
| Giriş / kayıt / doğrulama / şifre sıfırlama | `/login`, `/register`, `/verify-email`, `/forgot-password` | `/api/auth/*` |
| Danışan panel | `/client/dashboard` | randevu, bildirim, su, kalori listesi |
| Randevular | `/client/appointments`, `/client/book-appointment` | `/api/appointments/*` |
| Kayıtlarım / beslenme | `/client/records` | `/api/calorie-records/preview`, `/save`, `/my-records` |
| Ayarlar | `/client/settings` | `/api/auth/me`, profil |
| Diyetisyen panel | `/dietitian/dashboard`, `/clients`, `/appointments` | ilgili GET/POST/PATCH |
| Ayarlar (diyetisyen) | `/dietitian/settings` | `/api/dietitians`, `/api/auth/*`, davet kodu `/api/invite-code` |

---

## Üye sayfaları

Her grup üyesi kendi **`docs/uyeler/<github-kullanici-adi>-frontend.md`** dosyasını oluşturur; en üste YouTube kanıt linki (domain üzerinden test + gereksinim başına detay) ekler.
