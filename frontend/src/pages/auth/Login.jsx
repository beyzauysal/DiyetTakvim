import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { loginUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import LandingHeader from "../../components/landing/LandingHeader";
import "../../styles/landing.css";

function dashboardPathFor(role) {
  return role === "dietitian" ? "/dietitian/dashboard" : "/client/dashboard";
}

function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading, login, logout } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let msg = "";
    if (searchParams.get("verified") === "1") {
      msg = "E-postanız doğrulandı. Şimdi giriş yapabilirsiniz.";
      next.delete("verified");
    }
    if (searchParams.get("reset") === "1") {
      msg = "Şifreniz güncellendi. Giriş yapabilirsiniz.";
      next.delete("reset");
    }
    if (!msg) return;
    setNotice(msg);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  if (!loading && user) {
    return <Navigate to={dashboardPathFor(user.role)} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password || !formData.role) {
      alert("E-posta, şifre ve rol zorunludur.");
      return;
    }

    try {
      setSubmitting(true);

      logout();

      const data = await loginUser(formData);

      if (!data?.token || !data?.user) {
        alert("Giriş verisi alınamadı.");
        return;
      }

      login(data.token, data.user);

      const savedUser = data.user;

      if (savedUser.role === "dietitian") {
        navigate("/dietitian/dashboard", { replace: true });
      } else if (savedUser.role === "client") {
        navigate("/client/dashboard", { replace: true });
      } else {
        logout();
        alert("Rol bilgisi alınamadı.");
      }
    } catch (error) {
      logout();
      const res = error.response;
      if (res?.status === 403 && res.data?.requiresEmailVerification && res.data?.email) {
        navigate(
          `/verify-email?email=${encodeURIComponent(res.data.email)}`,
          { replace: true }
        );
        return;
      }
      const backendMsg = res?.data?.message || res?.data?.error;
      const networkHint =
        error.code === "ERR_NETWORK" || error.message === "Network Error"
          ? "Sunucuya ulaşılamıyor. Backend’i (npm run dev, port 5050) çalıştırın; frontend’i de npm run dev ile açın."
          : null;
      alert(
        backendMsg ||
          networkHint ||
          error.message ||
          "Giriş yapılırken hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      <LandingHeader />

      <main className="landing-main">
        <div className="landing-auth">
          <h1 className="landing-auth__title">Giriş Yap</h1>
          <p className="landing-auth__lead">
            Kayıtlı e-posta adresiniz ile giriş yapın.
          </p>

          {notice ? (
            <p
              className="landing-auth__lead"
              style={{
                marginTop: "-8px",
                marginBottom: "12px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "rgba(61, 107, 79, 0.12)",
                color: "var(--mock-sage-dark, #2d4a38)",
                fontWeight: 600,
              }}
            >
              {notice}
            </p>
          ) : null}

          <form className="landing-auth__card" onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              placeholder="E-posta"
              value={formData.email}
              onChange={handleChange}
              autoComplete="username"
            />

            <input
              type="password"
              name="password"
              placeholder="Şifre"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />

            <select name="role" value={formData.role} onChange={handleChange} aria-label="Rol">
              <option value="">Rol Seç</option>
              <option value="dietitian">Diyetisyen</option>
              <option value="client">Danışan</option>
            </select>

            <p className="landing-auth__forgot">
              <Link to="/forgot-password">Şifremi unuttum</Link>
            </p>

            <button type="submit" disabled={submitting}>
              {submitting ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="landing-auth__switch">
            Hesabın yok mu? <Link to="/register">Kayıt Ol</Link>
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

export default Login;
