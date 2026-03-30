import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  requestPasswordReset,
  resendPasswordReset,
  resetPassword,
} from "../../api/authApi";
import LandingHeader from "../../components/landing/LandingHeader";
import "../../styles/landing.css";

function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = searchParams.get("email") || "";

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleCodeChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(v);
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      alert("Kayıtlı e-posta adresinizi girin.");
      return;
    }
    try {
      setSending(true);
      await requestPasswordReset(email.trim());
      setStep("reset");
    } catch (err) {
      alert(err.response?.data?.message || "Kod gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    try {
      setResending(true);
      await resendPasswordReset(email.trim());
      alert("Kod yeniden gönderildi.");
    } catch (err) {
      alert(err.response?.data?.message || "Gönderilemedi.");
    } finally {
      setResending(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      alert("6 haneli kodu girin.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Yeni şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Şifreler eşleşmiyor.");
      return;
    }
    try {
      setSubmitting(true);
      await resetPassword({
        email: email.trim(),
        code,
        newPassword,
      });
      navigate("/login?reset=1", { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Şifre güncellenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      <LandingHeader />

      <main className="landing-main">
        <div className="landing-auth landing-auth--wide">
          <h1 className="landing-auth__title">Şifremi unuttum</h1>
          <p className="landing-auth__lead">
            {step === "request"
              ? "Hesabınıza kayıtlı e-posta adresinizi yazın; size 6 haneli bir kod göndeririz."
              : "E-postanızdaki kodu ve yeni şifrenizi girin. Kod 15 dakika geçerlidir."}
          </p>

          {step === "request" ? (
            <form className="landing-auth__card" onSubmit={handleSendCode}>
              <input
                type="email"
                name="email"
                placeholder="Kayıtlı e-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <button type="submit" disabled={sending}>
                {sending ? "Gönderiliyor..." : "Kodu e-postaya gönder"}
              </button>
            </form>
          ) : (
            <form className="landing-auth__card" onSubmit={handleReset}>
              <input
                type="email"
                name="email"
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />

              <input
                type="text"
                inputMode="numeric"
                name="code"
                placeholder="6 haneli kod"
                value={code}
                onChange={handleCodeChange}
                maxLength={6}
                autoComplete="one-time-code"
                aria-label="Şifre sıfırlama kodu"
              />

              <input
                type="password"
                name="newPassword"
                placeholder="Yeni şifre (en az 6 karakter)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Yeni şifre (tekrar)"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />

              <button type="submit" disabled={submitting}>
                {submitting ? "Kaydediliyor..." : "Yeni şifreyi kaydet"}
              </button>

              <button type="button" disabled={resending} onClick={handleResend}>
                {resending ? "Gönderiliyor..." : "Kodu yeniden gönder"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Farklı e-posta kullan
              </button>
            </form>
          )}

          <p className="landing-auth__switch">
            <Link to="/login">Girişe dön</Link>
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

export default ForgotPassword;
