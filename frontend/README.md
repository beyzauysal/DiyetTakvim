# DiyetTakvim — web (Vite + React)

Diyetisyen ve danışanların randevu, müsaitlik ve kayıt akışlarını yönettiği arayüz. Geliştirme sunucusu: `npm run dev` (varsayılan `http://localhost:5173`).

## Ortam

- **API tabanı:** `src/api/apiClient.js` içinde `baseURL` (ör. `http://localhost:5050`). İstemci yolları `/api/...` ile tanımlıdır.
- **Backend:** Aynı Express uygulamasında hem `/api/...` hem de gereksinim dokümanındaki kısa yollar (`/auth`, `/appointments`, …) kullanılabilir; ikisi de aynı route’lara bağlıdır.

## API ile hizalama (özet)

| Alan | Örnek uç noktalar |
|------|-------------------|
| Kimlik | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout` |
| Müsaitlik | `PATCH /auth/update-availability`, `POST /auth/availability` |
| Randevular | `GET/POST /appointments`, `GET /appointments/available-slots`, `GET /appointments/availability`, `GET /appointments/daily`, `GET /appointments/monthly`, `PATCH /appointments/cancel/:id`, `PUT /appointments/:id`, `DELETE /appointments/:id`, … |
| Kalori | `GET/POST /calorie-records`, `POST /calorie-records/analyze` |
| Bildirimler | `GET /notifications`, … |
| Diyetisyen | `POST /dietitians`, `GET /dietitians/:id/clients` |
| Davet / bağlantı | `POST /invite-code`, `POST /connections` |

Tam liste ve gövde alanları için backend route dosyalarına bakın (`web/backend/routes/`).

## Tasarım

Global renkler `src/index.css` içindeki `:root` değişkenlerinde: sakin arka plan, teal vurgu (güven / sağlık), düşük kontrastlı metin tonları. Bileşen özelinde inline renkler bazı sayfalarda kalmış olabilir; tema değişiminde önce `:root` güncellenir.
