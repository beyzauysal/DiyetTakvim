# DiyetTakvim — Web Frontend Dokümantasyonu

## Canlı site adresi (domain)

**Buraya deploy sonrası tam adresi yazın:**

```
https://BURAYA-FRONTEND-DOMAIN-YAZIN.com
```

Örnek: `https://diyettakvim.com` veya `https://diyettakvim.vercel.app`

Tarayıcıdan bu adrese girildiğinde uygulama açılmalı (ödev şartı).

---

## Teknoloji

- **React (Vite)** — kaynak: `frontend/` klasörü
- **API adresi:** production'da `frontend/.env.production` veya hosting ortam değişkeni ile  
  `VITE_API_URL=https://SIZIN-API-DOMAIN.com`  
  (boş bırakılırsa aynı origin'e `/api` proxy'si gerekir; API ayrı domain ise mutlaka tam API URL verin.)

---

## Derleme

```bash
cd frontend
npm ci
npm run build
```

Çıktı: `frontend/dist/` — statik hosting (Vercel, Netlify, S3+CloudFront vb.) ile yayınlanır.

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

---

## Frontend Prensipleri

## 1. Responsive Tasarım

- **Yaklaşım:** Mobile-first responsive tasarım uygulanır.
- **Breakpoint mantığı:**
  - Mobile: `< 768px`
  - Tablet: `768px - 1024px`
  - Desktop: `> 1024px`
- **Layout sistemi:** Esnek yerleşim için `Flexbox` ve gerekli yerlerde `CSS Grid` kullanılır.
- **Bileşen davranışı:** Kartlar, formlar, dashboard alanları ve listeler küçük ekranlarda alt alta, büyük ekranlarda yan yana akacak şekilde tasarlanır.
- **Dokunmatik kullanım:** Mobilde butonlar ve etkileşim alanları dokunmaya uygun boyutta tutulur.

## 2. Tasarım Sistemi

- **UI yaklaşımı:** Hazır bir framework yerine büyük ölçüde custom CSS tabanlı bir tasarım dili kullanılır.
- **Renk sistemi:** Ortak renkler ve tema değerleri CSS variables ile merkezi olarak yönetilir.
- **Tipografi:** Okunabilir, sade ve modern bir tipografi tercih edilir.
- **Boşluk sistemi:** Tutarlı `padding`, `margin`, kart boşlukları ve form aralıkları kullanılır.
- **Bileşen yaklaşımı:** Tekrar kullanılabilir bileşenler tercih edilir.
  - Örnek: layout bileşenleri, navbar, water widget, beslenme günlüğü bölümü, logo bileşenleri

## 3. Performans Optimizasyonu

- **Build aracı:** `Vite` kullanılır; hızlı geliştirme ve optimize production build sağlar.
- **Bundle optimizasyonu:** Production build sırasında minification ve modern bundle optimizasyonları uygulanır.
- **İstek yönetimi:** API çağrıları merkezi `apiClient` üzerinden yapılır.
- **Gereksiz yükü azaltma:** Sayfa bazlı veri yalnız ilgili ekran açıldığında yüklenir.
- **UI akıcılığı:** Dashboard gibi alanlarda veriler gerektiğinde eşzamanlı yüklenir.

## 4. SEO

- **Uygulama tipi:** Bu proje ağırlıklı olarak giriş gerektiren bir SPA yapısındadır.
- **Temel SEO yaklaşımı:** Landing sayfasında anlamlı başlıklar, açıklama metinleri ve okunabilir içerik yapısı korunur.
- **Semantic HTML:** Başlıklar, bölümler ve içerik alanlarında anlamlı HTML yapısı tercih edilir.
- **Alt metin:** Görseller için uygun `alt` açıklamaları kullanılır.
- **Not:** Bu projede SEO, kullanıcı panelinden daha çok ana sayfa için önemlidir.

## 5. Erişilebilirlik

- **Form erişilebilirliği:** Input, select, textarea alanlarında anlamlı etiketleme kullanılır.
- **Klavye erişimi:** Formlar ve temel etkileşimler klavye ile kullanılabilir olmalıdır.
- **ARIA desteği:** Gerekli yerlerde `aria-label`, `role`, `aria-hidden`, `aria-pressed` gibi öznitelikler kullanılır.
- **Görsel netlik:** Kontrast, okunabilirlik ve odak görünürlüğü korunur.
- **Durum mesajları:** Hata ve başarı mesajları kullanıcı tarafından rahat algılanabilir şekilde gösterilir.

## 6. Browser Compatibility

- **Hedef tarayıcılar:** Modern Chrome, Safari, Firefox ve Edge sürümleri desteklenir.
- **Temel yaklaşım:** Modern tarayıcı odaklı geliştirme yapılır.
- **Uyumluluk:** Vite ve modern frontend araçlarıyla güncel JavaScript/CSS desteği hedeflenir.
- **Fallback yaklaşımı:** Kritik kullanıcı akışları gereksiz ileri seviye tarayıcı bağımlılıklarına bağlanmaz.

## 7. State Management

- **Global state:** Projede hafif global state için `React Context API` kullanılır.
  - Örnek: `AuthContext`
- **Local state:** Sayfa içi durumlar için `useState`, `useEffect`, `useMemo`, `useRef` gibi React hook'ları kullanılır.
- **Server state:** API'den gelen veriler ekran bazlı çağrılarla yönetilir; ayrı bir server-state kütüphanesi kullanılmaz.
- **Form state:** Formlar çoğunlukla React'in yerel state yaklaşımıyla yönetilir.

## 8. Routing

- **Client-side routing:** `React Router` kullanılır.
- **Rol bazlı yönlendirme:** Kullanıcı rolüne göre farklı paneller bulunur.
  - Diyetisyen paneli
  - Danışan paneli
- **Protected routes:** Giriş gerektiren sayfalar korunur.
- **404 yönetimi:** Özel `NotFound` sayfası bulunur.
- **Navigation yapısı:** Uygulama içinde sayfa geçişleri yönlendirme sistemi ile sağlanır.

## 9. API Entegrasyonu

- **HTTP client:** `Axios` kullanılır.
- **Merkezi API client:** Tüm istekler `apiClient` üzerinden geçer.
- **Request interceptor:**
  - Token ekleme
  - Gerekirse URL düzeltme
  - `FormData` için header yönetimi
- **Response interceptor:**
  - `401/403` durumunda refresh akışı
  - token yenileme
- **Hata yönetimi:** Ekran bazlı kullanıcı mesajları ve merkezi axios davranışı birlikte kullanılır.
- **Loading states:** Buton bazlı ve sayfa bazlı loading durumları gösterilir.

## 10. Testing

- **Mevcut yaklaşım:** Bu projede öncelik manuel işlev testleri ve gerçek akış doğrulamasıdır.
- **API testleri:** `Postman` ve `Swagger` ile endpoint doğrulaması yapılır.
- **UI doğrulaması:** Kullanıcı akışları tarayıcı üzerinde test edilir.
- **Gelecek iyileştirme:** İleride
  - Unit test: `Vitest`
  - Component test: `React Testing Library`
  - E2E: `Playwright` veya `Cypress`
  eklenebilir.

## 11. Build ve Deployment

- **Build tool:** `Vite`
- **Environment yönetimi:** `.env` ve `VITE_*` değişkenleri kullanılır.
- **Frontend canlıya alma:** `Vercel` gibi modern static hosting platformları uygundur.
- **Backend bağımlılığı:** Frontend, canlı backend adresine `VITE_API_URL` ile bağlanır.
- **Production yapı:** Frontend ve backend ayrı deploy edilebilir.
- **Docker desteği:** Frontend için `Dockerfile` eklidir; istenirse container tabanlı deployment yapılabilir.

## 12. Rol Bazlı Deneyim

- Arayüz, diyetisyen ve danışan kullanıcılarını ayrı deneyimler olarak ele alır.
- Dashboard, randevu, kayıt ve ayarlar ekranları role göre farklı içerik sunar.

## 13. Sağlık Verisi ve Kullanıcı Güveni

- Kullanıcıya ait sağlık, randevu ve beslenme verileri sade ve anlaşılır şekilde gösterilmelidir.
- Karmaşık işlemler yerine açık, yönlendirici ve güven veren arayüz tercih edilir.

## 14. Kullanılabilirlik Önceliği

- Özellikle kayıt, giriş, randevu alma, öğün kaydetme ve su takibi akışları mümkün olduğunca kısa ve anlaşılır tutulur.
- Gereksiz alan, gereksiz tıklama ve kafa karıştıran metinlerden kaçınılır.

## 15. Tutarlı Panel Yapısı

- Panel ekranlarında ortak layout yapısı korunur.
- Kart görünümü, bölüm başlıkları, form alanları ve liste yapıları mümkün olduğunca aynı tasarım diliyle ilerler.
