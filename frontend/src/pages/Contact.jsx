import { Link } from "react-router-dom";
import LandingHeader from "../components/landing/LandingHeader";
import "../styles/landing.css";

function Contact() {
  return (
    <div className="landing-page">
      <LandingHeader />

      <main className="landing-main landing-contact">
        <h1>İletişim</h1>
        <p className="landing-contact__lead">
          Sorularınız, önerileriniz veya iş birliği talepleriniz için bize yazabilirsiniz. En kısa sürede
          dönüş yapmaya çalışırız.
        </p>

        <div className="landing-contact__box">
          <p>
            <strong>E-posta:</strong>{" "}
            <a href="mailto:destek@diyettakvim.com">destek@diyettakvim.com</a>
          </p>
          <p>
            Kurumsal veya klinik entegrasyonlar için aynı adrese &quot;Kurumsal&quot; başlığı ile
            mesaj gönderebilirsiniz.
          </p>
        </div>

        <p style={{ marginTop: "28px", textAlign: "center" }}>
          <Link to="/" className="landing-card__more">
            ← Anasayfaya dön
          </Link>
        </p>
      </main>

      <footer className="landing-footer">
        <p>
          © {new Date().getFullYear()} DiyetTakvim — randevu ve beslenme takibi için web uygulaması.
        </p>
      </footer>
    </div>
  );
}

export default Contact;
