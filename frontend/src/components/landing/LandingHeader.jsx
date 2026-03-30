import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppLogo from "../brand/AppLogo";

function dashboardPathFor(role) {
  return role === "dietitian" ? "/dietitian/dashboard" : "/client/dashboard";
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconKey() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 2l-1 1m-1 1l-4 4m0 0l-2 5-5 2-2-2 2-5 5-2m0 0l4-4M7.5 10.5a2.121 2.121 0 013-3 2.121 2.121 0 013 3 2.121 2.121 0 01-3 3 2.121 2.121 0 01-3-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingHeader() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const panelPath = user ? dashboardPathFor(user.role) : "/login";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const navActive = (key) => {
    if (key === "panel") {
      return pathname === "/" && hash !== "#basari-hikayeleri";
    }
    if (key === "iletisim") {
      return pathname === "/iletisim";
    }
    if (key === "basari") {
      return pathname === "/" && hash === "#basari-hikayeleri";
    }
    if (key === "test") {
      return pathname === "/register";
    }
    return false;
  };

  const linkClass = (key) =>
    `landing-nav__link${navActive(key) ? " landing-nav__link--active" : ""}`;

  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <Link to="/" className="landing-brand">
          <span className="landing-brand__mark" aria-hidden>
            <AppLogo size={36} />
          </span>
          <span className="landing-brand-text">
            <span className="landing-brand-title">DiyetTakvim</span>
            <span className="landing-brand-tagline">Beslenme · Randevu · Takip</span>
          </span>
        </Link>

        <nav className="landing-nav" aria-label="Sayfa">
          <Link to={panelPath} className={linkClass("panel")}>
            Panel
          </Link>
          <Link to="/iletisim" className={linkClass("iletisim")}>
            İletişim
          </Link>
          <Link to={{ pathname: "/", hash: "basari-hikayeleri" }} className={linkClass("basari")}>
            Başarı Hikayeleri
          </Link>
          <Link to="/register" className={`${linkClass("test")} landing-nav__link--cta`}>
            Test Diyetisyen
          </Link>
        </nav>

        <div className="landing-header__actions">
          {loading ? (
            <span className="landing-top-loading">Yükleniyor…</span>
          ) : user ? (
            <>
              <Link to={panelPath} className="landing-btn-yonet">
                <IconArrowLeft />
                Yönetin
              </Link>
              <Link to={panelPath} className="landing-btn-login landing-btn-name">
                {user.name}
              </Link>
              <button type="button" className="landing-btn-logout" onClick={handleLogout}>
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="landing-btn-yonet">
                <IconArrowLeft />
                Yönetin
              </Link>
              <Link to="/login" className="landing-btn-login">
                <IconKey />
                Giriş Yap
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
