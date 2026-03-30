import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import LandingHeader from "../../components/landing/LandingHeader";
import "../../styles/landing.css";

function dashboardPathFor(role) {
  return role === "dietitian" ? "/dietitian/dashboard" : "/client/dashboard";
}

function Register() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    inviteCode: "",
  });

  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to={dashboardPathFor(user.role)} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "inviteCode") {
      const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.password || !formData.role) {
      alert("Ad soyad, şifre ve rol zorunludur.");
      return;
    }

    if (!formData.email.trim()) {
      alert("E-posta adresi zorunludur.");
      return;
    }

    if (formData.role === "client" && !formData.inviteCode.trim()) {
      alert("Danışan kaydı için davet kodu zorunludur.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "client") {
        payload.inviteCode = formData.inviteCode.trim().toUpperCase();
      }

      const data = await registerUser(payload);

      if (data?.requiresEmailVerification && data?.email) {
        navigate(
          `/verify-email?email=${encodeURIComponent(data.email)}`,
          { replace: true }
        );
        return;
      }

      alert(data?.message || "Kayıt yanıtı alınamadı. Lütfen tekrar deneyin.");
    } catch (error) {
      alert(error.response?.data?.message || "Kayıt olurken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      <LandingHeader />

      <main className="landing-main">
        <div className="landing-auth landing-auth--wide">
          <h1 className="landing-auth__title">Kayıt Ol</h1>
          <p className="landing-auth__lead">
            E-posta ile kayıt; adresinize doğrulama kodu gider.
          </p>

          <form className="landing-auth__card" onSubmit={handleRegister}>
            <input
              type="text"
              name="name"
              placeholder="Ad Soyad"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
            />

            <input
              type="email"
              name="email"
              placeholder="E-posta"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <input
              type="password"
              name="password"
              placeholder="Şifre"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
            />

            <select name="role" value={formData.role} onChange={handleChange} aria-label="Rol">
              <option value="">Rol Seç</option>
              <option value="dietitian">Diyetisyen</option>
              <option value="client">Danışan</option>
            </select>

            {formData.role === "client" && (
              <div className="landing-invite-box">
                <label className="landing-invite-box__label" htmlFor="register-invite-code">
                  Diyetisyen davet kodu
                </label>
                <input
                  id="register-invite-code"
                  type="text"
                  name="inviteCode"
                  placeholder="Örn. AYŞE4821"
                  value={formData.inviteCode}
                  onChange={handleChange}
                  autoComplete="off"
                  inputMode="text"
                  aria-required="true"
                />
                <p className="landing-invite-box__hint">
                  Diyetisyen isteği bildirimden onayladığında bağlantı tamamlanır.
                </p>
              </div>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="landing-auth__switch">
            Zaten hesabın var mı? <Link to="/login">Giriş Yap</Link>
          </p>
        </div>
      </main>

      <footer className="landing-footer">
        <p>
          © {new Date().getFullYear()} DiyetTakvim — randevu ve beslenme takibi için web
          uygulaması.
        </p>
      </footer>
    </div>
  );
}

export default Register;
