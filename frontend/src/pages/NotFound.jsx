import { Link } from "react-router-dom";
import LandingHeader from "../components/landing/LandingHeader";
import "../styles/landing.css";

function NotFound() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <main className="landing-main">
        <div className="landing-auth">
          <h1 className="landing-auth__title">Sayfa bulunamadı</h1>
          <p className="landing-auth__lead">
            Aradığınız adres mevcut değil veya taşınmış olabilir.
          </p>

          <div className="landing-auth__card" style={{ display: "block", textAlign: "center" }}>
            <Link to="/" className="landing-hero__cta" style={{ display: "inline-flex" }}>
              Ana sayfaya dön
            </Link>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <p>
          © {new Date().getFullYear()} DiyetTakvim — randevu ve beslenme takibi için web uygulaması.
        </p>
      </footer>
    </div>
  );
}

export default NotFound;
