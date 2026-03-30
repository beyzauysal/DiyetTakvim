import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import {
  readWaterGoalMl,
  readWaterSipMl,
  SIP_PRESETS,
  writeWaterPrefs,
} from "../../lib/waterPrefs";

const PROFILE_AVATAR_EMOJIS = ["🥗", "🍎", "🥑", "🥤", "💪", "🧘", "🌿", "☀️"];

function ClientSettingsPage() {
  const navigate = useNavigate();
  const { fetchMe, deleteAccount } = useAuth();
  const [sipMl, setSipMl] = useState(readWaterSipMl);
  const [goalMl, setGoalMl] = useState(readWaterGoalMl);
  const [waterSaved, setWaterSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    bmi: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPhone, setAccountPhone] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("");
  const [emojiBusy, setEmojiBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const loadMe = async () => {
    try {
      setLoading(true);
      setPageError("");
      const { data } = await apiClient.get("/api/auth/me");
      const user = data.user;
      setFormData({
        name: user.name || "",
        age: user.profile?.age ?? "",
        gender: user.profile?.gender || "",
        height: user.profile?.height ?? "",
        weight: user.profile?.weight ?? "",
        bmi: user.profile?.bmi ?? "",
      });
      setPhotoUrl(user.profile?.photoUrl || "");
      setAccountEmail(user.email ? String(user.email) : "");
      setAccountPhone(user.phone ? `0${String(user.phone).replace(/^0+/, "")}` : "");
      setAvatarEmoji(user.profile?.avatarEmoji || "");
    } catch (e) {
      setPageError(e.response?.data?.message || "Profil yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSipMl(readWaterSipMl());
    setGoalMl(readWaterGoalMl());
    loadMe();
  }, []);

  const handleWaterSave = (e) => {
    e.preventDefault();
    writeWaterPrefs({ sipMl, goalMl });
    setWaterSaved(true);
    setTimeout(() => setWaterSaved(false), 2500);
  };

  const handleDeleteAccount = async () => {
    setPageError("");
    setSuccessMessage("");
    if (!String(deletePassword).trim()) {
      setPageError("Hesabı silmek için şifrenizi girin.");
      return;
    }
    if (
      !window.confirm(
        "Hesabınız ve randevu, öğün, su ve bildirim kayıtlarınız kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?"
      )
    ) {
      return;
    }
    try {
      setDeletingAccount(true);
      await deleteAccount(deletePassword);
      navigate("/", { replace: true });
    } catch (e) {
      const d = e.response?.data;
      setPageError(
        d?.message || d?.error || e.message || "Hesap silinemedi."
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setSuccessMessage("");
    setPageError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!String(formData.name || "").trim()) {
      setPageError("Ad soyad zorunludur.");
      return;
    }
    if (formData.age !== "" && Number(formData.age) <= 0) {
      setPageError("Yaş 0'dan büyük olmalıdır.");
      return;
    }
    if (formData.height !== "" && Number(formData.height) <= 0) {
      setPageError("Boy 0'dan büyük olmalıdır.");
      return;
    }
    if (formData.weight !== "" && Number(formData.weight) <= 0) {
      setPageError("Kilo 0'dan büyük olmalıdır.");
      return;
    }

    try {
      setSavingProfile(true);
      setPageError("");
      setSuccessMessage("");
      const payload = {
        name: String(formData.name).trim(),
        age: formData.age !== "" ? Number(formData.age) : null,
        gender: formData.gender || "",
        height: formData.height !== "" ? Number(formData.height) : null,
        weight: formData.weight !== "" ? Number(formData.weight) : null,
        avatarEmoji: avatarEmoji || "",
      };
      const { data } = await apiClient.patch("/api/auth/update-profile", payload);
      setFormData((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        age: data.profile?.age ?? "",
        gender: data.profile?.gender || "",
        height: data.profile?.height ?? "",
        weight: data.profile?.weight ?? "",
        bmi: data.profile?.bmi ?? "",
      }));
      setAvatarEmoji(data.profile?.avatarEmoji || "");
      setSuccessMessage("Profil bilgileri kaydedildi.");
      fetchMe();
    } catch (err) {
      setPageError(err.response?.data?.message || "Profil güncellenemedi.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEmojiPick = async (emoji) => {
    try {
      setEmojiBusy(true);
      setPageError("");
      setSuccessMessage("");
      await apiClient.patch("/api/auth/update-profile", { avatarEmoji: emoji });
      setAvatarEmoji(emoji);
      fetchMe();
      setSuccessMessage("Profil simgesi güncellendi (fotoğraf yokken gösterilir).");
    } catch (err) {
      setPageError(err.response?.data?.message || "Simge kaydedilemedi.");
    } finally {
      setEmojiBusy(false);
    }
  };

  const handleClearEmoji = async () => {
    if (!avatarEmoji) return;
    try {
      setEmojiBusy(true);
      setPageError("");
      await apiClient.patch("/api/auth/update-profile", { avatarEmoji: "" });
      setAvatarEmoji("");
      fetchMe();
      setSuccessMessage("Profil simgesi kaldırıldı.");
    } catch (err) {
      setPageError(err.response?.data?.message || "İşlem başarısız.");
    } finally {
      setEmojiBusy(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploadingPhoto(true);
      setPageError("");
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await apiClient.post("/api/auth/profile-photo", fd);
      setPhotoUrl(data.photoUrl || data.profile?.photoUrl || "");
      setSuccessMessage("Profil fotoğrafı güncellendi.");
      fetchMe();
    } catch (err) {
      setPageError(err.response?.data?.message || "Fotoğraf yüklenemedi.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="client" title="Ayarlar" subtitle="Yükleniyor…">
        <div className="dashboard-page settings-page">
          <div className="page-content-narrow" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="client"
      title="Ayarlar"
      subtitle="Profil fotoğrafı ve sağlık ölçüleriniz; su takibinde her bardak tıklamasında eklenecek miktar ve günlük hedef buradan ayarlanır."
    >
      <div className="dashboard-page settings-page">
        <div className="page-content-narrow">
          {pageError && (
            <div className="settings-alert settings-alert--error">{pageError}</div>
          )}
          {successMessage && (
            <div className="settings-alert settings-alert--ok">{successMessage}</div>
          )}

          <section className="settings-section profile-form-card">
            <h2 className="settings-section-title">Profil fotoğrafı</h2>
            <div className="settings-photo-row">
              <div
                className="settings-avatar"
                style={{
                  backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
                }}
              >
                {!photoUrl && <span>?</span>}
              </div>
              <div className="settings-photo-actions">
                <label className="btn-secondary settings-file-label">
                  {uploadingPhoto ? "Yükleniyor..." : "Fotoğraf seç"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhoto}
                    disabled={uploadingPhoto}
                    hidden
                  />
                </label>
                <p className="settings-hint">
                  JPEG, PNG veya WebP. Fotoğraf varken emoji gizlenir; yalnızca
                  yüz simgesi için bu seçenekleri kullanın.
                </p>
              </div>
            </div>

            <div className="settings-emoji-block">
              <p className="settings-emoji-title">Veya emoji simge</p>
              <p className="settings-hint settings-emoji-desc">
                Fotoğraf yüklemediyseniz panel ve menüde bu karakter görünür.
              </p>
              <div className="settings-emoji-grid" role="group" aria-label="Profil emojisi">
                {PROFILE_AVATAR_EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={`settings-emoji-btn${avatarEmoji === em ? " is-picked" : ""}`}
                    onClick={() => handleEmojiPick(em)}
                    disabled={emojiBusy}
                    aria-pressed={avatarEmoji === em}
                  >
                    {em}
                  </button>
                ))}
              </div>
              {avatarEmoji ? (
                <button
                  type="button"
                  className="btn-secondary settings-emoji-clear"
                  onClick={handleClearEmoji}
                  disabled={emojiBusy}
                >
                  Emoji seçimini kaldır
                </button>
              ) : null}
            </div>
          </section>

          <form className="settings-section profile-form-card" onSubmit={handleSaveProfile}>
            <h2 className="settings-section-title">Kişisel bilgiler</h2>
            <label className="form-label">
              Ad soyad
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleProfileChange}
                autoComplete="name"
                placeholder="Adınız ve soyadınız"
                required
              />
            </label>
            <label className="form-label">
              E-posta
              <input
                type="email"
                value={accountEmail}
                readOnly
                disabled
                placeholder="Kayıtta e-posta yok"
                autoComplete="off"
              />
            </label>
            <label className="form-label">
              Telefon
              <input
                type="tel"
                value={accountPhone}
                readOnly
                disabled
                placeholder="Kayıtta telefon yok"
                autoComplete="off"
              />
            </label>
            <label className="form-label">
              Yaş
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleProfileChange}
                min="1"
                placeholder="Yaş"
              />
            </label>
            <label className="form-label">
              Cinsiyet
              <select
                name="gender"
                value={formData.gender}
                onChange={handleProfileChange}
              >
                <option value="">Seçiniz</option>
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
                <option value="other">Diğer</option>
              </select>
            </label>
            <label className="form-label">
              Boy (cm)
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleProfileChange}
                min="1"
                placeholder="Boy"
              />
            </label>
            <label className="form-label">
              Kilo (kg)
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleProfileChange}
                min="1"
                step="0.1"
                placeholder="Kilo"
              />
            </label>
            <label className="form-label">
              BMI
              <input
                type="text"
                value={formData.bmi !== "" ? formData.bmi : "Hesaplanır"}
                disabled
              />
            </label>
            <button type="submit" disabled={savingProfile}>
              {savingProfile ? "Kaydediliyor..." : "Bilgileri kaydet"}
            </button>
          </form>

          <form className="settings-section profile-form-card" onSubmit={handleWaterSave}>
            <h2 className="settings-section-title">Su takibi</h2>
            <p className="settings-hint-block">
              Paneldeki mavi bardaa her tıkladığınızda seçtiğiniz yudum kadar
              su eklenir. Günlük hedef, çubuk ve doluluk için kullanılır.
            </p>

            <label className="form-label">
              Bir yudum (ml)
              <div className="sip-chips settings-sip-chips" role="group">
                {SIP_PRESETS.map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    className={`sip-chip settings-sip-chip ${
                      sipMl === ml ? "sip-chip--active" : ""
                    }`}
                    onClick={() => setSipMl(ml)}
                  >
                    {ml} ml
                  </button>
                ))}
              </div>
            </label>

            <label className="form-label">
              Günlük hedef (ml)
              <input
                type="number"
                min={500}
                max={5000}
                step={100}
                value={goalMl}
                onChange={(e) =>
                  setGoalMl(
                    Math.min(
                      5000,
                      Math.max(500, Number(e.target.value) || 2000)
                    )
                  )
                }
              />
            </label>

            <button type="submit">Su ayarlarını kaydet</button>

            {waterSaved && (
              <p className="settings-inline-ok">
                Su ayarları kaydedildi — panele dönünce bardak güncellenir.
              </p>
            )}
          </form>

          <section
            className="settings-section profile-form-card settings-danger-zone"
            aria-labelledby="client-delete-account-title"
          >
            <h2 id="client-delete-account-title" className="settings-section-title">
              Hesabı sil
            </h2>
            <p className="settings-hint-block">
              Hesabınız veritabanından kaldırılır. Randevularınız, beslenme kayıtlarınız, su girişleriniz
              ve bildirimleriniz de silinir.
            </p>
            <label className="form-label">
              Onay için şifreniz
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </label>
            <button
              type="button"
              className="danger-button"
              disabled={deletingAccount}
              onClick={handleDeleteAccount}
            >
              {deletingAccount ? "Siliniyor…" : "Hesabımı kalıcı olarak sil"}
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

export default ClientSettingsPage;
