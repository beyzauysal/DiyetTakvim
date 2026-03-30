import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import NutritionDiarySection from "../../components/nutrition/NutritionDiarySection";
import apiClient from "../../api/apiClient";

function formatApiError(error) {
  if (error.response) {
    const { status, data } = error.response;
    if (typeof data === "string") {
      return `Sunucu (${status}): ${data.slice(0, 280)}`;
    }
    const msg = data?.message;
    const err = data?.error;
    if (msg && err && msg !== err) return `${msg} — ${err}`;
    if (msg) return msg;
    if (err) return err;
    return `İstek başarısız (HTTP ${status}).`;
  }
  if (error.code === "ECONNABORTED" || /timeout/i.test(error.message || "")) {
    return "Zaman aşımı: analiz uzun sürdü. İnternetinizi kontrol edin veya daha küçük fotoğrafla tekrar deneyin.";
  }
  if (error.message === "Network Error") {
    return "Sunucuya bağlanılamadı. Backend’in (genelde 5050) çalıştığından ve giriş yaptığınızdan emin olun.";
  }
  return error.message || "Bilinmeyen hata.";
}

function RecordsPage() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    date: "",
    mealType: "kahvalti",
    note: "",
    imageUrl: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [previewResult, setPreviewResult] = useState(null);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mealSetup, setMealSetup] = useState(null);

  const mealTypeLabels = {
    kahvalti: "Kahvaltı",
    ara_ogun: "Ara Öğün",
    ogle: "Öğle",
    aksam: "Akşam",
    gece: "Gece",
  };

  const invalidatePreview = () => {
    setPreviewResult(null);
    setSuccessMessage("");
  };

  const fetchMyRecords = async () => {
    try {
      setLoading(true);
      setPageError("");

      const response = await apiClient.get("/api/calorie-records/my-records");
      setRecords(response.data.records || []);
    } catch (error) {
      console.error("Kayıtlar alınamadı:", error.response?.data || error.message);
      setPageError(error.response?.data?.message || "Kayıtlar alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRecords();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get("/api/calorie-records/meal-setup");
        if (!cancelled) setMealSetup(data);
      } catch {
        if (!cancelled) setMealSetup(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const hash = location.hash;
    if (hash !== "#beslenme" && hash !== "#beslenme-gunlugu") return;
    const id = hash === "#beslenme-gunlugu" ? "beslenme-gunlugu" : "beslenme";
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [location.hash, loading]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPageError("");
    invalidatePreview();

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setPageError("");
    invalidatePreview();
    e.target.value = "";
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      setPageError("Yalnızca JPEG, PNG, WebP veya GIF seçebilirsiniz.");
      setImageFile(null);
      return;
    }
    setImageFile(file);
  };

  const clearImageFile = () => {
    setImageFile(null);
    setImagePreview("");
    invalidatePreview();
  };

  const validateBeforeCalculate = () => {
    if (!formData.date) {
      return "Tarih seçin.";
    }
    if (!formData.mealType) {
      return "Öğün tipi seçin.";
    }
    if (!formData.note.trim()) {
      return "Besinleri yazın (ne yediğinizi kısaca anlatın).";
    }
    if (!imageFile && !formData.imageUrl.trim()) {
      return "Fotoğraf veya görsel bağlantısı ekleyin.";
    }
    return "";
  };

  const handleCalculateCalories = async (e) => {
    e.preventDefault();
    const err = validateBeforeCalculate();
    if (err) {
      setPageError(err);
      return;
    }

    try {
      setCalculating(true);
      setPageError("");
      setSuccessMessage("");

      const fd = new FormData();
      fd.append("mealType", formData.mealType);
      fd.append("note", formData.note);
      if (formData.imageUrl.trim()) {
        fd.append("imageUrl", formData.imageUrl.trim());
      }
      if (imageFile) {
        fd.append("photo", imageFile);
      }

      const { data } = await apiClient.post("/api/calorie-records/preview", fd);

      setPreviewResult({
        foods: data.foods || [],
        totalCalories: data.totalCalories ?? 0,
        imageUrl: data.imageUrl || "",
      });
      setSuccessMessage("Hesap tamam. İstersen kaydet.");
    } catch (error) {
      console.error("Kalori hesaplanamadı:", error.response?.data || error.message);
      setPageError(formatApiError(error));
      setPreviewResult(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!previewResult) {
      setPageError("Önce «Kalori hesapla» ile sonuç üretin.");
      return;
    }
    if (!formData.date) {
      setPageError("Tarih seçin.");
      return;
    }

    try {
      setSaving(true);
      setPageError("");
      setSuccessMessage("");

      await apiClient.post("/api/calorie-records/save", {
        date: formData.date,
        mealType: formData.mealType,
        note: formData.note,
        imageUrl: previewResult.imageUrl || "",
        foods: previewResult.foods,
        totalCalories: previewResult.totalCalories,
      });

      setFormData({
        date: "",
        mealType: "kahvalti",
        note: "",
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview("");
      setPreviewResult(null);

      await fetchMyRecords();
      setSuccessMessage("Öğün kaydı başarıyla oluşturuldu.");
    } catch (error) {
      console.error("Kayıt oluşturulamadı:", error.response?.data || error.message);
      setPageError(error.response?.data?.message || "Kayıt oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      role="client"
      title="Kayıtlarım"
      subtitle="Öğün ekle, kalori hesapla; geçmiş kayıtlar günlükte."
    >
      <div className="dashboard-page">
        <section
          id="beslenme"
          aria-label="Beslenme kayıtları"
          className="profile-form-card profile-form-card--records-form records-meal-flow"
        >
          <h2 style={{ marginBottom: "8px" }}>Yeni öğün kaydı</h2>

          {mealSetup && mealSetup.pendingDietitian && !mealSetup.linkedDietitian ? (
            <div
              style={{
                marginBottom: "14px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#e8f4fc",
                color: "#1e4d6b",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Diyetisyeniniz bağlantı isteğinizi onaylayana kadar öğün kaydı oluşturamazsınız.
              Bildirimlerden durumu takip edebilirsiniz.
            </div>
          ) : null}

          {mealSetup &&
          !mealSetup.linkedDietitian &&
          !mealSetup.pendingDietitian ? (
            <div
              style={{
                marginBottom: "14px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#fff4e5",
                color: "#9a3412",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Hesabınıza bağlı diyetisyen yok; kalori kaydı oluşturulamaz. Kayıt olurken geçerli bir
              davet kodu kullandığınızdan emin olun veya diyetisyeninizle iletişime geçin.
            </div>
          ) : null}

          {mealSetup && !mealSetup.openaiKeyConfigured ? (
            <div
              style={{
                marginBottom: "14px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#ffe5e5",
                color: "#b42318",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              Sunucuda <code style={{ fontSize: "13px" }}>OPENAI_API_KEY</code> tanımlı değil. Backend
              klasöründeki <code style={{ fontSize: "13px" }}>.env</code> dosyasına anahtarı ekleyip
              sunucuyu yeniden başlatın.
            </div>
          ) : null}

          <p style={{ margin: "0 0 16px", color: "#5e6b4d", fontSize: "14px" }}>
            Fotoğraf ve kısa açıklama yeterli; önce kalori hesapla, uygunsa kaydet.
          </p>

          {pageError && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#ffe5e5",
                color: "#b42318",
                fontWeight: 500,
              }}
            >
              {pageError}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#e8f7ee",
                color: "#157347",
                fontWeight: 500,
              }}
            >
              {successMessage}
            </div>
          )}

          <form
            onSubmit={handleCalculateCalories}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>
                Tarih
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>
                Öğün tipi
              </label>
              <select name="mealType" value={formData.mealType} onChange={handleChange}>
                <option value="kahvalti">Kahvaltı</option>
                <option value="ara_ogun">Ara öğün</option>
                <option value="ogle">Öğle</option>
                <option value="aksam">Akşam</option>
                <option value="gece">Gece</option>
              </select>
            </div>

            <div className="records-meal-flow__photo-block">
              <span style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>
                Öğün fotoğrafı
              </span>
              <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#6b7a66" }}>
                Mobilde kamera, bilgisayarda dosya seçimi.
              </p>
              <div className="records-meal-flow__photo-buttons">
                <label className="btn-secondary records-meal-flow__file-btn">
                  Galeriden seç
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    hidden
                  />
                </label>
              </div>
              {imagePreview && (
                <div style={{ marginTop: "12px" }}>
                  <img
                    src={imagePreview}
                    alt="Önizleme"
                    style={{
                      maxWidth: "240px",
                      maxHeight: "240px",
                      borderRadius: "12px",
                      border: "1px solid #cfd8c1",
                    }}
                  />
                  <div style={{ marginTop: "8px" }}>
                    <button type="button" onClick={clearImageFile}>
                      Fotoğrafı kaldır
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>
                Besin bilgisi / içerik
              </label>
              <textarea
                name="note"
                rows="4"
                placeholder="Örn: 2 haşlanmış yumurta, tam buğday 2 dilim, domates, çay"
                value={formData.note}
                onChange={handleChange}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "700" }}>
                Görsel bağlantısı (isteğe bağlı)
              </label>
              <input
                type="text"
                name="imageUrl"
                placeholder="Harici bir fotoğraf URL’si"
                value={formData.imageUrl}
                onChange={handleChange}
              />
            </div>

            <div>
              <button type="submit" disabled={calculating}>
                {calculating ? "Hesaplanıyor…" : "Kalori hesapla (AI)"}
              </button>
            </div>
          </form>

          {previewResult ? (
            <div
              className="records-meal-flow__preview"
              style={{
                marginTop: "22px",
                padding: "18px",
                borderRadius: "16px",
                border: "2px solid var(--mock-sage-dark, #3d6b4f)",
                background: "rgba(61, 107, 79, 0.06)",
              }}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem" }}>Hesap sonucu</h3>
              <p style={{ margin: "0 0 8px", fontWeight: "800", fontSize: "1.25rem" }}>
                {previewResult.totalCalories} kcal
              </p>
              <p style={{ margin: "0 0 6px", fontWeight: "700", fontSize: "14px" }}>Tahmini içerik</p>
              <p style={{ margin: "0 0 16px", color: "#3d4f3a" }}>
                {previewResult.foods.join(", ")}
              </p>
              <form onSubmit={handleSaveRecord}>
                <button type="submit" disabled={saving}>
                  {saving ? "Kaydediliyor…" : "Kaydı oluştur"}
                </button>
              </form>
            </div>
          ) : null}
        </section>

        {loading ? (
          <div className="record-card">
            <p>Kayıtlar yükleniyor...</p>
          </div>
        ) : (
          <NutritionDiarySection
            id="beslenme-gunlugu"
            records={records}
            mealTypeLabels={mealTypeLabels}
            variant="full"
            heading="Beslenme günlüğü"
            emptyMessage="Henüz öğün kaydı bulunmuyor."
            editable
            onRecordMutated={fetchMyRecords}
            intro={
              records.length > 0 ? (
                <p className="nutrition-diary-intro">
                  Tüm geçmiş kayıtların aşağıda güne göre listelenir; en yeni gün üstte.
                </p>
              ) : null
            }
          />
        )}
      </div>
    </AppShell>
  );
}

export default RecordsPage;
