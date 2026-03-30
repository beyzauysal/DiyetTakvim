1. **Rol Seçerek Kayıt Olma**
   - **API Metodu:** 'POST /auth/register'
   - **Açıklama:** Kullanıcı, danışan veya diyetisyen rolünü seçerek hesap oluşturur.


2. **Giriş Yapma**
   - **API Metodu:** 'POST /auth/login'
   - **Açıklama:** Kullanıcı, e-posta ve şifre bilgileri ile sisteme giriş yapar.
  

3. **Diyetisyen Profili Oluşturma**
   - **API Metodu:** 'POST /dietitians'
   - **Açıklama:** Diyetisyen, ad, uzmanlık alanı ve şehir bilgilerini girerek profil oluşturur.


4. **Davet Kodu Üretme**
   - **API Metodu:** 'POST /invite-code'
   - **Açıklama:** Sistem, diyetisyen için bir davet kodu oluşturur.
     

5. **Danışanları Listeleme**
   - **API Metodu:** 'GET /dietitians/{id}/clients'
   - **Açıklama:** Diyetisyen, kendisine bağlı danışanların listesini görüntüler.
          
   
6. **Uygun Zaman Aralığı Oluşturma**
   - **API Metodu:** 'POST /availability'
   - **Açıklama:** Diyetisyen, randevu alınabilecek gün ve saat aralığı oluşturur.
          
  
7. **Uygun Zamanları Listeleme**
   - **API Metodu:** 'GET /availability'
   - **Açıklama:** Danışan, seçilen tarihte uygun olan saatleri görüntüler.


8. **Randevu Oluşturma**
   - **API Metodu:** 'POST /appointments'
   - **Açıklama:** Danışan, seçilen tarih ve saat için randevu oluşturur.
  

9. **Günlük Randevuları Listeleme**
    - **API Metodu:** 'GET /appointments/daily'
    - **Açıklama:** Diyetisyen, seçilen güne ait randevuları listeler.


10. **Randevuyu Güncelleme**
    - **API Metodu:** 'PUT /appointments/{id}'
    - **Açıklama:** Randevunun tarih veya saat bilgisi değiştirilir.


11. **Randevuyu İptal Etme**
    - **API Metodu:** 'DELETE /appointments/{id}'
    - **Açıklama:** Randevu iptal edilir.
     

12. **Takvim Yoğunluğu Görüntüleme**
    - **API Metodu:** 'GET /appointments/monthly'
    - **Açıklama:** Diyetisyen, ay içindeki günlerin doluluk durumunu görüntüler.
          
   
13. **AI ile Kalori Hesaplama ve Kaydetme**
    - **API Metodu:** 'POST /calorie-records'
    - **Açıklama:** Danışan yemek fotoğrafını ve içeriğini gönderir. Sistem yapay zeka ile kaloriyi hesaplayıp kaydeder. Diyetisyen danışanın toplam kalorisini görüntüler.

