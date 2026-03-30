import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

function ProfilePage() {
  const navigate = useNavigate();
  const { fetchMe, deleteAccount } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageOk, setPageOk] = useState("");
  const [regeneratingInvite, setRegeneratingInvite] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setPageError("");
      const response = await apiClient.get("/api/auth/me");
      const u = response.data.user;
      setProfile(u);
      setName(u?.name || "");
      setSpecialty(u?.specialty || "");
      setCity(u?.city || "");
      setPhotoUrl(u?.profile?.photoUrl || "");
    } catch (error) {
      alert(
        error.response?.data?.message || "Profil bilgileri alınamadı."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setPageError("");
      setPageOk("");
      const { data } = await apiClient.post("/api/dietitians", {
        name: name.trim(),
        specialty: specialty.trim(),
        city: city.trim(),
      });
      const d = data.dietitian;
      setProfile((prev) => ({
        ...prev,
        name: d.name,
        email: d.email ?? prev?.email,
        phone: d.phone ?? prev?.phone,
        specialty: d.specialty,
        city: d.city,
      }));
      setPageOk("Profil bilgileri kaydedildi.");
      fetchMe();
    } catch (error) {
      setPageError(error.response?.data?.message || "Profil kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setUploadingPhoto(true);
      setPageError("");
      setPageOk("");
      const fd = new FormData();
      fd.append("photo", file);
      const { data } = await apiClient.post("/api/auth/profile-photo", fd);
      const url = data.photoUrl || data.profile?.photoUrl || "";
      setPhotoUrl(url);
      setPageOk("Profil fotoğrafı güncellendi.");
      fetchMe();
    } catch (error) {
      setPageError(error.response?.data?.message || "Fotoğraf yüklenemedi.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const copyInviteCode = () => {
    if (!profile?.inviteCode) return;
    navigator.clipboard.writeText(profile.inviteCode);
    setPageOk("Davet kodu panoya kopyalandı.");
    setPageError("");
  };

  const handleDeleteAccount = async () => {
    setPageError("");
    setPageOk("");
    if (!String(deletePassword).trim()) {
      setPageError("Hesabı silmek için şifrenizi girin.");
      return;
    }
    if (
      !window.confirm(
        "Hesabınız, randevularınız, danışan kayıtlarınıza ait bağlantılar (davet kodu) ve bildirimler kalıcı olarak silinir veya temizlenir. Geri alınamaz. Devam edilsin mi?"
      )
    ) {
      return;
    }
    try {
      setDeletingAccount(true);
      await deleteAccount(deletePassword);
      navigate("/", { replace: true });
    } catch (error) {
      const d = error.response?.data;
      setPageError(
        d?.message || d?.error || error.message || "Hesap silinemedi."
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const regenerateInviteCode = async () => {
    if (
      !window.confirm(
        "Yeni kod oluşturulunca yeni danışanlar için yeni kodu paylaşmanız önerilir. Eski kodla daha önce kayıt olan danışanlar kaybolmaz. Devam edilsin mi?"
      )
    ) {
      return;
    }
    try {
      setRegeneratingInvite(true);
      setPageError("");
      setPageOk("");
      const { data } = await apiClient.post("/api/invite-code");
      const code = data.inviteCode;
      setProfile((prev) => ({ ...prev, inviteCode: code }));
      setPageOk(data.message || "Yeni davet kodu oluşturuldu.");
      fetchMe();
    } catch (error) {
      setPageError(
        error.response?.data?.message || "Yeni davet kodu oluşturulamadı."
      );
    } finally {
      setRegeneratingInvite(false);
    }
  };

  if (loading) {
    return (
      <AppShell role="dietitian" title="Ayarlar" subtitle="Yükleniyor…">
        <div className="dashboard-page settings-page">
          <div className="page-content-narrow" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="dietitian"
      title="Ayarlar"
      subtitle="Profil bilgileriniz ve danışanlarınızla paylaşacağınız davet kodu."
    >
      <div className="dashboard-page settings-page">
        <div className="page-content-narrow">
          {pageError && (
            <div className="settings-alert settings-alert--error">{pageError}</div>
          )}
          {pageOk && (
            <div className="settings-alert settings-alert--ok">{pageOk}</div>
          )}

          <section className="invite-code-panel" aria-labelledby="invite-code-heading">
            <p className="invite-code-panel__kicker">Danışan bağlantısı</p>
            <h2 id="invite-code-heading" className="invite-code-panel__title">
              Davet kodunuz
            </h2>
            <p className="invite-code-panel__desc">
              Danışanlar kayıt olurken &quot;Danışan&quot; rolünü seçip bu kodu girerek doğrudan sizin
              listenize eklenir. Kodu mesaj veya e-posta ile paylaşabilirsiniz.
            </p>
            <div className="invite-code-display">
              <div className="invite-code-display__value" title="Kodu seçip kopyalayabilirsiniz">
                {profile?.inviteCode || "Kod yükleniyor…"}
              </div>
            </div>
            <div className="invite-code-panel__actions">
              <button type="button" onClick={copyInviteCode} disabled={!profile?.inviteCode}>
                Kopyala
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={regeneratingInvite}
                onClick={regenerateInviteCode}
              >
                {regeneratingInvite ? "Oluşturuluyor…" : "Yeni kod üret"}
              </button>
            </div>
          </section>

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
                <p className="settings-hint">JPEG, PNG veya WebP, en fazla 3 MB.</p>
              </div>
            </div>
          </section>

          <form className="profile-form-card" onSubmit={handleSave}>
            <h2 className="settings-section-title">Hesap bilgileri</h2>

            <label className="form-label">
              Ad Soyad
              <input
                type="text"
                placeholder="Ad Soyad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="form-label">
              E-posta
              <input
                type="email"
                placeholder="Kayıtta e-posta yok"
                value={profile?.email ? String(profile.email) : ""}
                readOnly
                disabled
                autoComplete="off"
              />
            </label>

            <label className="form-label">
              Telefon
              <input
                type="tel"
                placeholder="Kayıtta telefon yok"
                value={
                  profile?.phone
                    ? `0${String(profile.phone).replace(/^0+/, "")}`
                    : ""
                }
                readOnly
                disabled
                autoComplete="off"
              />
            </label>

            <label className="form-label">
              Uzmanlık alanı
              <input
                type="text"
                placeholder="Örn. Spor diyeteti, klinik beslenme"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </label>

            <label className="form-label">
              Şehir
              <input
                type="text"
                placeholder="Örn. İstanbul"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>

            <label className="form-label">
              Rol
              <input
                type="text"
                value={profile?.role === "dietitian" ? "Diyetisyen" : profile?.role || ""}
                readOnly
                disabled
              />
            </label>

            <div className="profile-actions-row">
              <button type="submit" disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>

          <section
            className="settings-section profile-form-card settings-danger-zone"
            aria-labelledby="dietitian-delete-account-title"
          >
            <h2 id="dietitian-delete-account-title" className="settings-section-title">
              Hesabı sil
            </h2>
            <p className="settings-hint-block">
              Hesabınız veritabanından kaldırılır. Randevularınız ve kayıtlı bildirimleriniz silinir;
              danışan hesapları kalır ancak sizinle olan bağlantıları (bağlı diyetisyen) kaldırılır.
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

export default ProfilePage;
