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


5. **Davet Kodu Üretme**
   - **API Metodu:** 'POST /connections'
   - **Açıklama:** Sistem, diyetisyen için bir davet kodu oluşturur.
     

6. **Danışanları Listeleme**
   - **API Metodu:** 'GET /dietitians/{id}/clients'
   - **Açıklama:** Diyetisyen, kendisine bağlı danışanların listesini görüntüler.
          
   
7. **Uygun Zaman Aralığı Oluşturma**
   - **API Metodu:** 'POST /availability'
   - **Açıklama:** Diyetisyen, randevu alınabilecek gün ve saat aralığı oluşturur.
          
  
8. **Uygun Zamanları Listeleme**
   - **API Metodu:** 'GET /availability'
   - **Açıklama:** Danışan, seçilen tarihte uygun olan saatleri görüntüler.


9. **Randevu Oluşturma**
   - **API Metodu:** 'POST /appointments'
   - **Açıklama:** Danışan, seçilen tarih ve saat için randevu oluşturur.
  

10. **Günlük Randevuları Listeleme**
    - **API Metodu:** 'GET /appointments/daily'
    - **Açıklama:** Diyetisyen, seçilen güne ait randevuları listeler.


11. **Randevuyu Güncelleme**
    - **API Metodu:** 'PUT /appointments/{id}'
    - **Açıklama:** Randevunun tarih veya saat bilgisi değiştirilir.


12. **Randevuyu İptal Etme**
    - **API Metodu:** 'DELETE /appointments/{id}'
    - **Açıklama:** Randevu iptal edilir.
     

13. **Takvim Yoğunluğu Görüntüleme**
    - **API Metodu:** 'GET /appointments/monthly'
    - **Açıklama:** Diyetisyen, ay içindeki günlerin doluluk durumunu görüntüler.
          
   
14. **Beslenme Kaydı Ekleme**
    - **API Metodu:** 'POST /nutrition'
    - **Açıklama:** Danışan, günlük veya haftalık beslenme bilgisi ekler.

               
15. **Aylık Randevu Tahmini Oluşturma**
    - **API Metodu:** 'POST /appointments/prediction'
    - **Açıklama:** Sistem, geçmiş randevu bilgileri ve hava durumu verilerini kullanarak gelecek ay için tahmini toplam randevu sayısını hesaplar ve sonucu diyetisyen panelinde gösterir.
