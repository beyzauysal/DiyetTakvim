import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppLogo from "../brand/AppLogo";

function Navbar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const avatarEmoji = user?.profile?.avatarEmoji?.trim();
  const displayName = (user?.name || user?.email || "").trim();
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";
  const showEmoji = Boolean(avatarEmoji);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const dietitianLinks = [
    { to: "/dietitian/dashboard", label: "Panel" },
    { to: "/dietitian/clients", label: "Danışanlar" },
    { to: "/dietitian/appointments", label: "Randevular" },
    { to: "/dietitian/availability", label: "Uygunluk" },
    { to: "/dietitian/notifications", label: "Bildirimler" },
    { to: "/dietitian/settings", label: "Ayarlar" },
  ];

  const clientLinks = [
    { to: "/client/dashboard", label: "Panel" },
    { to: "/client/book-appointment", label: "Randevu Al" },
    { to: "/client/appointments", label: "Randevularım" },
    { to: "/client/records", label: "Kayıtlarım" },
    { to: "/client/settings", label: "Ayarlar" },
    { to: "/client/notifications", label: "Bildirimler" },
  ];

  const links = role === "dietitian" ? dietitianLinks : clientLinks;

  const isActiveLink = (to) => {
    if (location.pathname === to) return true;

    if (
      to === "/dietitian/clients" &&
      location.pathname.startsWith("/dietitian/clients/")
    ) {
      return true;
    }

    return false;
  };

  return (
    <header className="site-header">
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/" className="navbar-brand" title="Anasayfa">
            <AppLogo className="navbar-brand-logo" size={36} />
            <span className="navbar-brand-text">
              <span className="navbar-brand-title">DiyetTakvim</span>
              <span className="navbar-brand-tagline">Beslenme · Randevu · Takip</span>
            </span>
          </Link>
        </div>

        <div className="navbar-links">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActiveLink(link.to) ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <div
            className={`navbar-avatar${showEmoji ? " navbar-avatar--emoji" : ""}`}
            title={displayName || "Profil"}
          >
            {showEmoji ? (
              <span className="navbar-avatar-emoji">{avatarEmoji}</span>
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;