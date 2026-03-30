import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resendVerification, verifyEmail } from "../../api/authApi";
import LandingHeader from "../../components/landing/LandingHeader";
import "../../styles/landing.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const handleCodeChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(v);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email.trim() || code.length !== 6) {
      alert("E-posta adresinizi ve 6 haneli kodu girin.");
      return;
    }
    try {
      setSubmitting(true);
      await verifyEmail({ email: email.trim(), code });
      navigate("/login?verified=1", { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || "Doğrulama başarısız.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      alert("Önce e-posta adresinizi girin.");
      return;
    }
    try {
      setResending(true);
      await resendVerification(email.trim());
      alert("Doğrulama kodu e-postanıza gönderildi.");
    } catch (err) {
      alert(err.response?.data?.message || "Kod gönderilemedi.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="landing-page">
      <LandingHeader />

      <main className="landing-main">
        <div className="landing-auth landing-auth--wide">
          <h1 className="landing-auth__title">E-postayı doğrula</h1>
          <p className="landing-auth__lead">
            Kayıt sırasında kullandığınız adrese 6 haneli bir kod gönderdik. Kodu
            aşağıya yazın; gelmediyse bir dakika sonra yeniden gönderebilirsiniz.
          </p>

          <form className="landing-auth__card" onSubmit={handleVerify}>
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
              aria-label="Doğrulama kodu"
            />

            <button type="submit" disabled={submitting}>
              {submitting ? "Doğrulanıyor..." : "Doğrula"}
            </button>

            <button type="button" disabled={resending} onClick={handleResend}>
              {resending ? "Gönderiliyor..." : "Kodu yeniden gönder"}
            </button>
          </form>

          <p className="landing-auth__switch">
            <Link to="/login">Girişe dön</Link>
            {" · "}
            <Link to="/register">Kayıt</Link>
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

export default VerifyEmail;
