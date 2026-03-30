import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";
import LandingHeader from "../components/landing/LandingHeader";
import "../styles/landing.css";

const HERO_IMG = "/home-hero-photo.jpg";
const HERO_ALT =
  "Üstten çekilmiş taze Akdeniz salatası: domates, yeşillik, nohut ve limon — sağlıklı beslenme";

function dashboardPathFor(role) {
  return role === "dietitian" ? "/dietitian/dashboard" : "/client/dashboard";
}

function DecoLeaves() {
  return (
    <>
      <svg
        className="landing-deco-leaf landing-deco-leaf--tl"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M40 160c20-80 100-120 150-100-30 50-80 90-150 100z"
          fill="currentColor"
          opacity="0.5"
        />
        <path
          d="M60 140c15-50 55-85 95-95-5 40-35 75-95 95z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="landing-deco-leaf landing-deco-leaf--br"
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M20 120c40-60 90-80 140-70-25 45-70 65-140 70z"
          fill="currentColor"
          opacity="0.45"
        />
      </svg>
    </>
  );
}

function IconCalendar() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M8 13h8M8 17h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconForkKnife() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 3v10M11 14v7M8 3v4a3 3 0 006 0V3M17 3v18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const panelPath = user ? dashboardPathFor(user.role) : "/login";

  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [storyText, setStoryText] = useState("");
  const [storySubmitting, setStorySubmitting] = useState(false);
  const [storyMessage, setStoryMessage] = useState(null);

  const loadTestimonials = useCallback(async () => {
    setTestimonialsLoading(true);
    try {
      const { data } = await apiClient.get("/api/testimonials");
      setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
    } catch {
      setTestimonials([]);
    } finally {
      setTestimonialsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  useEffect(() => {
    if (location.hash === "#basari-hikayeleri") {
      requestAnimationFrame(() => {
        document.getElementById("basari-hikayeleri")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [location.hash, location.pathname]);

  async function handleStorySubmit(e) {
    e.preventDefault();
    setStoryMessage(null);
    const trimmed = storyText.trim();
    if (trimmed.length < 10) {
      setStoryMessage({ type: "err", text: "En az 10 karakter yazın." });
      return;
    }
    if (trimmed.length > 800) {
      setStoryMessage({ type: "err", text: "En fazla 800 karakter." });
      return;
    }
    setStorySubmitting(true);
    try {
      const { data } = await apiClient.post("/api/testimonials", { text: trimmed });
      setStoryText("");
      setStoryMessage({ type: "ok", text: data.message || "Paylaşıldı." });
      if (data.testimonial) {
        setTestimonials((prev) => [data.testimonial, ...prev.filter((t) => t._id !== data.testimonial._id)]);
      } else {
        await loadTestimonials();
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401 ? "Yorum için giriş yapın." : "Gönderilemedi, tekrar deneyin.");
      setStoryMessage({ type: "err", text: msg });
    } finally {
      setStorySubmitting(false);
    }
  }

  return (
    <div className="landing-page">
      <LandingHeader />

      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-hero-title">
          <DecoLeaves />
          <div className="landing-hero__copy">
            <h1 id="landing-hero-title" className="landing-hero__title">
              Sağlıklı Beslenme ve Randevularınızı Kolayca Yönetin
            </h1>
            <p className="landing-hero__lead">
              Diyetisyen randevularınızı takip edin, beslenme sürecinizi kolayca yönetin.
            </p>
            <div className="landing-hero__cta-row">
              <Link to="/register" className="landing-hero__cta">
                Ücretsiz Kaydol
              </Link>
              <span className="landing-hero__cta-note">Ücretsiz ve kullanımı kolay</span>
            </div>
          </div>
          <div className="landing-hero__visual">
            <div className="landing-hero__img-wrap">
              <img
                src={HERO_IMG}
                alt={HERO_ALT}
                width={1200}
                height={669}
                className="landing-hero__img"
                sizes="(min-width: 900px) min(520px, 46vw), 100vw"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>
        </section>

        <section className="landing-cards" aria-label="Özellikler">
          <article className="landing-card landing-card--sage">
            <div className="landing-card__icon" aria-hidden>
              <IconCalendar />
            </div>
            <h2>Randevu Yönetin</h2>
            <p>
              Diyetisyeninizle uygun saatlerden randevu alın, değiştirin veya iptal edin; tüm kayıtlar tek
              panelde düzenli kalsın.
            </p>
            <Link to={panelPath} className="landing-card__more">
              Randevu Kaydı ›
            </Link>
          </article>

          <article className="landing-card landing-card--peach">
            <div className="landing-card__icon" aria-hidden>
              <IconDoc />
            </div>
            <h2>Beslenmenizi Kaydedin</h2>
            <p>
              Öğünlerinizi, günlük su tüketiminizi ve kalori kayıtlarınızı uygulama üzerinden takip edin;
              diyetisyeniniz güncel verilerle yanınızda olsun.
            </p>
            <Link to="/register" className="landing-card__more">
              Kayıt Ol ›
            </Link>
          </article>

          <article className="landing-card landing-card--sky">
            <div className="landing-card__icon" aria-hidden>
              <IconForkKnife />
            </div>
            <h2>Sağlığınızı Takip Edin</h2>
            <p>
              Boy, kilo ve özet bilgilerinizle sürecinizi ölçün; randevu ve beslenme alışkanlıklarınızı bir
              arada değerlendirin.
            </p>
            <Link to="/login" className="landing-card__more">
              Panele Git ›
            </Link>
          </article>
        </section>

        <section
          id="basari-hikayeleri"
          className="landing-stories"
          aria-labelledby="landing-stories-title"
        >
          <h2 id="landing-stories-title" className="landing-stories__title">
            Başarı Hikayeleri
          </h2>
          <p className="landing-stories__intro">
            Deneyiminizi paylaşın; burada gösterilen tüm yorumlar kayıtlı kullanıcılarımızdan gelir.
          </p>

          {user ? (
            <div className="landing-stories__form-wrap">
              <h3 id="landing-story-form-title">Deneyiminizi yazın</h3>
              <p>
                Adınız ve rolünüz (danışan / diyetisyen) profilinizden otomatik eklenir. Yorumunuz herkese
                açık listede görünür.
              </p>
              <form className="landing-stories__form" onSubmit={handleStorySubmit} aria-labelledby="landing-story-form-title">
                <textarea
                  name="story"
                  value={storyText}
                  onChange={(ev) => setStoryText(ev.target.value)}
                  placeholder="DiyetTakvim ile ilgili kısa deneyiminiz…"
                  maxLength={800}
                  rows={4}
                  disabled={storySubmitting}
                />
                <div className="landing-stories__form-actions">
                  <button type="submit" className="landing-stories__submit" disabled={storySubmitting}>
                    {storySubmitting ? "Gönderiliyor…" : "Paylaş"}
                  </button>
                  <span className="landing-stories__char-hint">{storyText.trim().length}/800</span>
                </div>
                {storyMessage ? (
                  <p
                    className={`landing-stories__form-msg landing-stories__form-msg--${storyMessage.type}`}
                    role="status"
                  >
                    {storyMessage.text}
                  </p>
                ) : null}
              </form>
            </div>
          ) : (
            <div className="landing-stories__form-wrap">
              <h3>Yorum eklemek için giriş yapın</h3>
              <p className="landing-stories__cta-lead">
                Başarı hikayesi paylaşmak için <Link to="/login">giriş yapın</Link> veya{" "}
                <Link to="/register">ücretsiz kaydolun</Link>.
              </p>
            </div>
          )}

          <div className="landing-stories__grid">
            {testimonialsLoading ? (
              <p className="landing-stories__empty">Yorumlar yükleniyor…</p>
            ) : testimonials.length === 0 ? (
              <p className="landing-stories__empty">
                Henüz paylaşılmış yorum yok. İlk deneyimi{" "}
                {user ? (
                  "yukarıdaki formdan siz paylaşabilirsiniz."
                ) : (
                  <>
                    siz paylaşmak için{" "}
                    <Link to="/login">giriş yapın</Link>.
                  </>
                )}
              </p>
            ) : (
              testimonials.map((t) => (
                <blockquote key={t._id} className="landing-story">
                  <p>“{t.text}”</p>
                  <footer>
                    — {t.authorName}, {t.roleLabel}
                  </footer>
                </blockquote>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>
          © {new Date().getFullYear()} DiyetTakvim — randevu ve beslenme takibi için web uygulaması.
        </p>
      </footer>
    </div>
  );
}

export default Home;
