# API Tasarımı - OpenAPI Specification Örneği

**OpenAPI Spesifikasyon Dosyası:** [diyettakvim.yaml](diyettakvim.yaml)

Bu doküman, OpenAPI Specification (OAS) 3.0 standardına göre hazırlanmış örnek bir API tasarımını içermektedir.

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: DiyetTakvim API'si
  description: |
    Diyetisyen ve danışan kullanıcıları için RESTful API.
    
    ## Özellikler
    - Rol bazlı kullanıcı yönetimi
    - JWT tabanlı kimlik doğrulama
    - Diyetisyen ve danışan bağlantı sistemi
    - Uygunluk ve randevu yönetimi
    - Yapay zeka destekli kalori kaydı
  version: 1.0.0
  contact:
    name: Beyza Uysal
    email: uysalbeyza27@gmail.com
license:
  name: MIT
  url: https://opensource.org/licenses/MIT

servers:
  servers:
  - url: https://api.diyettakvim.com/v1
    description: Production server
  - url: https://staging-api.diyettakvim.com/v1
    description: Staging server
  - url: http://localhost:3000/v1
    description: Development server

tags:
  - name: Kimlik Doğrulama
    description: Kayıt olma ve giriş işlemleri
  - name: Diyetisyenler
    description: Diyetisyen profili ve danışan yönetimi işlemleri
  - name: Bağlantılar
    description: Davet kodu üretme ve danışan-diyetisyen bağlantı işlemleri
  - name: Uygunluk
    description: Uygun zaman aralığı oluşturma ve listeleme işlemleri
  - name: Randevular
    description: Randevu oluşturma, listeleme, güncelleme ve iptal işlemleri
  - name: Kalori Kayıtları
    description: Yapay zeka ile kalori hesaplama ve kayıt işlemleri

security:
  - BearerAuth: []

paths:
  /auth/register:
    post:
      tags:
        - Kimlik Doğrulama
      summary: Rol Seçerek Kayıt Ol
      description: Kullanıcıyı danışan veya diyetisyen rolü ile sisteme kaydeder
      operationId: registerUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterInput'
            examples:
              example1:
                summary: Örnek kullanıcı kaydı
                value:
                  name: Beyza Uysal
                  email: beyza@example.com
                  password: "123456"
                  role: client
      responses:
        '201':
          description: Kullanıcı başarıyla oluşturuldu
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          $ref: '#/components/responses/BadRequest'

  /auth/login:
    post:
      tags:
        - Kimlik Doğrulama
      summary: Giriş Yap
      description: E-posta ve şifre ile giriş yapar
      operationId: loginUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginInput'
            examples:
              example1:
                summary: Örnek giriş isteği
                value:
                  email: beyza@example.com
                  password: "123456"
      responses:
        '200':
          description: Giriş başarılı
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /dietitians:
    post:
      tags:
        - Diyetisyenler
      summary: Diyetisyen Profili Oluştur
      description: Diyetisyen için ad, uzmanlık alanı ve şehir bilgileri ile profil oluşturur
      operationId: createDietitianProfile
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DietitianInput'
            examples:
              example1:
                summary: Örnek diyetisyen profili
                value:
                  name: Dyt. Ayşe Kaya
                  specialization: Kilo Yönetimi
                  city: Isparta
      responses:
        '201':
          description: Diyetisyen profili başarıyla oluşturuldu
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dietitian'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /invite-code:
    post:
      tags:
        - Bağlantılar
      summary: Davet Kodu Üret
      description: Diyetisyen için danışan bağlantısında kullanılacak davet kodu oluşturur
      operationId: generateInviteCode
      security:
        - BearerAuth: []
      responses:
        '201':
          description: Davet kodu başarıyla oluşturuldu
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InviteCodeResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

  /connections:
    post:
      tags:
        - Bağlantılar
      summary: Davet Kodu ile Bağlantı Kur
      description: Danışanı davet kodu kullanarak diyetisyene bağlar
      operationId: createConnection
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConnectionInput'
            examples:
              example1:
                summary: Örnek bağlantı isteği
                value:
                  inviteCode: "INV-AB12CD"
      responses:
        '201':
          description: Bağlantı başarıyla oluşturuldu
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Connection'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /dietitians/{id}/clients:
    get:
      tags:
        - Diyetisyenler
      summary: Danışanları Listele
      description: Belirli bir diyetisyene bağlı danışanların listesini getirir
      operationId: listDietitianClients
      security:
        - BearerAuth: []
      parameters:
        - $ref: '#/components/parameters/DietitianIdParam'
      responses:
        '200':
          description: Danışanlar başarıyla listelendi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Client'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

  /availability:
    post:
      tags:
        - Uygunluk
      summary: Uygun Zaman Aralığı Oluştur
      description: Diyetisyenin randevu alınabilecek tarih ve saat aralığını oluşturur
      operationId: createAvailability
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AvailabilityInput'
            examples:
              example1:
                summary: Örnek uygunluk oluşturma isteği
                value:
                  date: "2026-03-10"
                  startTime: "10:00"
                  endTime: "12:00"
      responses:
        '201':
          description: Uygun zaman aralığı başarıyla oluşturuldu
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Availability'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

    get:
      tags:
        - Uygunluk
      summary: Uygun Zamanları Listele
      description: Belirtilen tarihteki uygun saat aralıklarını listeler
      operationId: listAvailability
      security:
        - BearerAuth: []
      parameters:
        - name: date
          in: query
          description: Uygunlukların listeleneceği tarih
          required: true
          schema:
            type: string
            format: date
          example: "2026-03-10"
      responses:
        '200':
          description: Uygun zamanlar başarıyla listelendi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Availability'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /appointments:
    post:
      tags:
        - Randevular
      summary: Randevu Oluştur
      description: Danışan için seçilen diyetisyen, tarih ve saat bilgisine göre randevu oluşturur
      operationId: createAppointment
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppointmentInput'
            examples:
              example1:
                summary: Örnek randevu oluşturma isteği
                value:
                  dietitianId: "dyt123"
                  date: "2026-03-10"
                  time: "10:30"
      responses:
        '201':
          description: Randevu başarıyla oluşturuldu
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Appointment'
        '400':
          description: Geçersiz istek verisi veya seçilen saat uygun değil
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /appointments/daily:
    get:
      tags:
        - Randevular
      summary: Günlük Randevuları Listele
      description: Seçilen tarihe ait günlük randevuları listeler
      operationId: listDailyAppointments
      security:
        - BearerAuth: []
      parameters:
        - name: date
          in: query
          description: Randevuların listeleneceği gün
          required: true
          schema:
            type: string
            format: date
          example: "2026-03-10"
      responses:
        '200':
          description: Günlük randevular başarıyla listelendi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Appointment'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /appointments/{id}:
    put:
      tags:
        - Randevular
      summary: Randevuyu Güncelle
      description: Mevcut randevunun tarih veya saat bilgisini günceller
      operationId: updateAppointment
      security:
        - BearerAuth: []
      parameters:
        - $ref: '#/components/parameters/AppointmentIdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AppointmentUpdateInput'
            examples:
              example1:
                summary: Örnek randevu güncelleme isteği
                value:
                  date: "2026-03-11"
                  time: "11:00"
      responses:
        '200':
          description: Randevu başarıyla güncellendi
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Appointment'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

    delete:
      tags:
        - Randevular
      summary: Randevuyu İptal Et
      description: Belirli bir randevuyu iptal eder
      operationId: cancelAppointment
      security:
        - BearerAuth: []
      parameters:
        - $ref: '#/components/parameters/AppointmentIdParam'
      responses:
        '204':
          description: Randevu başarıyla iptal edildi
        '401':
          $ref: '#/components/responses/Unauthorized'
        '404':
          $ref: '#/components/responses/NotFound'

  /appointments/monthly:
    get:
      tags:
        - Randevular
      summary: Takvim Yoğunluğu Görüntüle
      description: Belirtilen aya ait randevu yoğunluğu ve doluluk durumunu getirir
      operationId: getMonthlyAppointmentDensity
      security:
        - BearerAuth: []
      parameters:
        - name: month
          in: query
          description: Yoğunluğu görüntülenecek ay bilgisi
          required: true
          schema:
            type: string
            example: "2026-03"
      responses:
        '200':
          description: Aylık takvim yoğunluğu başarıyla getirildi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MonthlyAppointmentStatus'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /calorie-records:
    post:
      tags:
        - Kalori Kayıtları
      summary: AI ile Kalori Hesaplama ve Kaydetme
      description: Yemek fotoğrafı ve açıklamasına göre kalori tahmini yapar ve kaydeder
      operationId: createCalorieRecord
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CalorieRecordInput'
            examples:
              example1:
                summary: Örnek kalori kaydı isteği
                value:
                  imageUrl: "https://example.com/yemek.jpg"
                  description: "1 tabak makarna, 1 kase yoğurt"
      responses:
        '201':
          description: Kalori kaydı başarıyla oluşturuldu
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CalorieRecord'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  securitySchemes:
    BearerAuth:
      type: apiKey
      in: header
      name: Authorization
      description: JWT tabanlı kimlik doğrulama. İstek başlığına "Authorization: Bearer <token>" eklenmelidir.

  parameters:
    DietitianIdParam:
      name: id
      in: path
      required: true
      description: Diyetisyen kimlik numarası
      schema:
        type: string

    AppointmentIdParam:
      name: id
      in: path
      required: true
      description: Randevu kimlik numarası
      schema:
        type: string

  schemas:
    User:
      type: object
      required:
        - _id
        - name
        - email
        - role
      properties:
        _id:
          type: string
          description: Kullanıcının benzersiz kimlik numarası
          example: "usr123"
        name:
          type: string
          description: Kullanıcının adı
          example: "Beyza Uysal"
        email:
          type: string
          format: email
          description: Kullanıcının e-posta adresi
          example: "beyza@example.com"
        role:
          type: string
          enum: [client, dietitian]
          description: Kullanıcının rolü
          example: "client"

    RegisterInput:
      type: object
      required:
        - name
        - email
        - password
        - role
      properties:
        name:
          type: string
          description: Kullanıcının adı
          example: "Beyza Uysal"
        email:
          type: string
          format: email
          example: "beyza@example.com"
        password:
          type: string
          format: password
          example: "123456"
        role:
          type: string
          enum: [client, dietitian]
          example: "client"

    LoginInput:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: "beyza@example.com"
        password:
          type: string
          format: password
          example: "123456"

    AuthResponse:
      type: object
      required:
        - token
        - user
      properties:
        token:
          type: string
          description: JWT erişim anahtarı
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        user:
          $ref: '#/components/schemas/User'

    DietitianInput:
      type: object
      required:
        - name
        - specialization
        - city
      properties:
        name:
          type: string
          description: Diyetisyenin adı
          example: "Dyt. Ayşe Kaya"
        specialization:
          type: string
          description: Diyetisyenin uzmanlık alanı
          example: "Kilo Yönetimi"
        city:
          type: string
          description: Diyetisyenin bulunduğu şehir
          example: "Isparta"

    Dietitian:
      type: object
      required:
        - _id
        - name
        - specialization
        - city
      properties:
        _id:
          type: string
          description: Diyetisyenin benzersiz kimlik numarası
          example: "dyt123"
        name:
          type: string
          description: Diyetisyenin adı
          example: "Dyt. Ayşe Kaya"
        specialization:
          type: string
          description: Uzmanlık alanı
          example: "Kilo Yönetimi"
        city:
          type: string
          description: Şehir bilgisi
          example: "Isparta"

    InviteCodeResponse:
      type: object
      required:
        - code
      properties:
        code:
          type: string
          description: Diyetisyene ait davet kodu
          example: "INV-AB12CD"

    ConnectionInput:
      type: object
      required:
        - inviteCode
      properties:
        inviteCode:
          type: string
          description: Diyetisyen tarafından oluşturulan davet kodu
          example: "INV-AB12CD"

    Connection:
      type: object
      required:
        - _id
        - clientId
        - dietitianId
        - inviteCode
      properties:
        _id:
          type: string
          description: Bağlantının benzersiz kimlik numarası
          example: "con123"
        clientId:
          type: string
          description: Danışanın kimlik numarası
          example: "clt123"
        dietitianId:
          type: string
          description: Diyetisyenin kimlik numarası
          example: "dyt123"
        inviteCode:
          type: string
          description: Kullanılan davet kodu
          example: "INV-AB12CD"

    Client:
      type: object
      required:
        - _id
        - name
        - email
      properties:
        _id:
          type: string
          description: Danışanın benzersiz kimlik numarası
          example: "clt123"
        name:
          type: string
          description: Danışanın adı
          example: "Elif Demir"
        email:
          type: string
          format: email
          description: Danışanın e-posta adresi
          example: "elif@example.com"

    AvailabilityInput:
      type: object
      required:
        - date
        - startTime
        - endTime
      properties:
        date:
          type: string
          format: date
          description: Uygunluk tarihi
          example: "2026-03-10"
        startTime:
          type: string
          description: Başlangıç saati
          example: "10:00"
        endTime:
          type: string
          description: Bitiş saati
          example: "12:00"

    Availability:
      type: object
      required:
        - _id
        - date
        - startTime
        - endTime
      properties:
        _id:
          type: string
          description: Uygunluk kaydının benzersiz kimlik numarası
          example: "avl123"
        date:
          type: string
          format: date
          description: Uygunluk tarihi
          example: "2026-03-10"
        startTime:
          type: string
          description: Başlangıç saati
          example: "10:00"
        endTime:
          type: string
          description: Bitiş saati
          example: "12:00"

    AppointmentInput:
      type: object
      required:
        - dietitianId
        - date
        - time
      properties:
        dietitianId:
          type: string
          description: Randevu alınacak diyetisyenin kimlik numarası
          example: "dyt123"
        date:
          type: string
          format: date
          description: Randevu tarihi
          example: "2026-03-10"
        time:
          type: string
          description: Randevu saati
          example: "10:30"

    AppointmentUpdateInput:
      type: object
      required:
        - date
        - time
      properties:
        date:
          type: string
          format: date
          description: Yeni randevu tarihi
          example: "2026-03-11"
        time:
          type: string
          description: Yeni randevu saati
          example: "11:00"

    Appointment:
      type: object
      required:
        - _id
        - clientId
        - dietitianId
        - date
        - time
        - status
      properties:
        _id:
          type: string
          description: Randevunun benzersiz kimlik numarası
          example: "app456"
        clientId:
          type: string
          description: Danışanın kimlik numarası
          example: "clt123"
        dietitianId:
          type: string
          description: Diyetisyenin kimlik numarası
          example: "dyt123"
        date:
          type: string
          format: date
          description: Randevu tarihi
          example: "2026-03-10"
        time:
          type: string
          description: Randevu saati
          example: "10:30"
        status:
          type: string
          enum: [scheduled, cancelled, completed]
          description: Randevu durumu
          example: "scheduled"

    MonthlyAppointmentStatus:
      type: object
      required:
        - date
        - appointmentCount
        - isFull
      properties:
        date:
          type: string
          format: date
          description: Gün bilgisi
          example: "2026-03-10"
        appointmentCount:
          type: integer
          description: O güne ait randevu sayısı
          example: 4
        isFull:
          type: boolean
          description: Günün dolu olup olmadığı bilgisi
          example: false

    CalorieRecordInput:
      type: object
      required:
        - imageUrl
        - description
      properties:
        imageUrl:
          type: string
          description: Yemek fotoğrafının bağlantısı
          example: "https://example.com/yemek.jpg"
        description:
          type: string
          description: Yemek içeriği açıklaması
          example: "1 tabak makarna, 1 kase yoğurt"

    CalorieRecord:
      type: object
      required:
        - _id
        - clientId
        - imageUrl
        - description
        - estimatedCalories
        - createdAt
      properties:
        _id:
          type: string
          description: Kalori kaydının benzersiz kimlik numarası
          example: "cal123"
        clientId:
          type: string
          description: Danışanın kimlik numarası
          example: "clt123"
        imageUrl:
          type: string
          description: Yemek fotoğrafı bağlantısı
          example: "https://example.com/yemek.jpg"
        description:
          type: string
          description: Yemek açıklaması
          example: "1 tabak makarna, 1 kase yoğurt"
        estimatedCalories:
          type: integer
          description: Yapay zeka tarafından tahmin edilen kalori miktarı
          example: 540
        createdAt:
          type: string
          format: date-time
          description: Kaydın oluşturulma tarihi
          example: "2026-03-06T12:00:00Z"

    Error:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          description: Hata kodu
          example: "VALIDATION_ERROR"
        message:
          type: string
          description: Hata mesajı
          example: "Geçersiz istek verisi"
        details:
          type: array
          description: Detaylı hata bilgileri
          items:
            type: object
            properties:
              field:
                type: string
                example: "email"
              message:
                type: string
                example: "Email formatı geçersiz"

  responses:
    BadRequest:
      description: Geçersiz istek
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "BAD_REQUEST"
            message: "İstek parametreleri geçersiz"

    Unauthorized:
      description: Yetkisiz erişim
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "UNAUTHORIZED"
            message: "Kimlik doğrulama başarısız"

    NotFound:
      description: Kaynak bulunamadı
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "NOT_FOUND"
            message: "İstenen kaynak bulunamadı"

    Forbidden:
      description: Erişim reddedildi
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "FORBIDDEN"
            message: "Bu işlem için yetkiniz bulunmamaktadır"
