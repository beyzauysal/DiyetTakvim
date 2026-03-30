import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import AppLogo from "../brand/AppLogo";
import "./AppShell.css";

function Icon({ name, className = "" }) {
  const cn = `app-shell-nav-icon ${className}`.trim();
  switch (name) {
    case "panel":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "records":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 4h10a2 2 0 012 2v14l-4-2-4 2-4-2-4 2V6a2 2 0 012-2z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "nutrition":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c-3 4-5 7.5-5 11a5 5 0 0010 0c0-3.5-2-7-5-11z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M12 14v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "water":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21c4.2 0 7-2.8 7-6.5C19 10 12 3 12 3S5 10 5 14.5C5 18.2 7.8 21 12 21z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bell":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "users":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm10 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "clock":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 7v6l3 2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M12 2v2m0 18v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m18 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

const CLIENT_NAV = [
  { to: "/client/dashboard", label: "Panel", icon: "panel", match: "panel" },
  { to: "/client/appointments", label: "Randevular", icon: "calendar", match: "appointments" },
  { to: "/client/records", label: "Kayıtlarım", icon: "records", match: "records" },
  { to: "/client/records#beslenme", label: "Beslenme", icon: "nutrition", match: "beslenme" },
  { to: "/client/dashboard#panel-water", label: "Su Takibi", icon: "water", match: "water" },
  { to: "/client/notifications", label: "Bildirimler", icon: "bell", match: "notifications" },
];

const DIETITIAN_NAV = [
  { to: "/dietitian/dashboard", label: "Panel", icon: "panel", match: "d-dash" },
  { to: "/dietitian/clients", label: "Danışanlar", icon: "users", match: "clients" },
  { to: "/dietitian/appointments", label: "Randevular", icon: "calendar", match: "d-appt" },
  { to: "/dietitian/availability", label: "Uygunluk", icon: "clock", match: "avail" },
  { to: "/dietitian/notifications", label: "Bildirimler", icon: "bell", match: "d-notif" },
  { to: "/dietitian/settings", label: "Ayarlar", icon: "settings", match: "d-settings" },
];

function navItemActive(match, pathname, hash) {
  const h = hash || "";
  switch (match) {
    case "panel":
      return pathname === "/client/dashboard" && h !== "#panel-water";
    case "water":
      return pathname === "/client/dashboard" && h === "#panel-water";
    case "records":
      return pathname === "/client/records" && h !== "#beslenme";
    case "beslenme":
      return pathname === "/client/records" && h === "#beslenme";
    case "appointments":
      return (
        pathname.startsWith("/client/appointments") ||
        pathname.startsWith("/client/book-appointment")
      );
    case "notifications":
      return pathname.startsWith("/client/notifications");
    case "d-dash":
      return pathname === "/dietitian/dashboard";
    case "clients":
      return pathname.startsWith("/dietitian/clients");
    case "d-appt":
      return pathname.startsWith("/dietitian/appointments");
    case "avail":
      return pathname.startsWith("/dietitian/availability");
    case "d-notif":
      return pathname.startsWith("/dietitian/notifications");
    case "d-settings":
      return pathname.startsWith("/dietitian/settings");
    default:
      return false;
  }
}

function AppShell({
  role,
  children,
  title,
  subtitle,
  notificationCount: notificationCountProp,
  showClientBookCta = false,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fetchedNotifCount, setFetchedNotifCount] = useState(0);

  useEffect(() => {
    if (notificationCountProp != null) return undefined;
    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await apiClient.get("/api/notifications", {
          signal: ac.signal,
        });
        setFetchedNotifCount(
          (data.notifications || []).filter((n) => !n.isRead).length
        );
      } catch {
        /* sessiz */
      }
    })();
    return () => ac.abort();
  }, [location.pathname, notificationCountProp]);

  const notificationCount =
    notificationCountProp != null ? notificationCountProp : fetchedNotifCount;

  const navItems = role === "dietitian" ? DIETITIAN_NAV : CLIENT_NAV;

  const settingsPath =
    role === "dietitian" ? "/dietitian/settings" : "/client/settings";

  const photoUrl = user?.profile?.photoUrl?.trim();
  const avatarEmoji = user?.profile?.avatarEmoji?.trim();
  const displayName = (user?.name || user?.email || "Kullanıcı").trim();
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";
  const showEmoji = !photoUrl && avatarEmoji;

  const { pathname, hash } = location;

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <div className={`app-shell${menuOpen ? " app-shell--menu-open" : ""}`}>
      <button
        type="button"
        className="app-shell-burger"
        aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className="app-shell-backdrop"
        aria-hidden
        onClick={() => setMenuOpen(false)}
      />

      <aside className="app-shell-sidebar" aria-label="Ana menü">
        <div className="app-shell-brand">
          <Link to="/" className="app-shell-brand-link" onClick={() => setMenuOpen(false)}>
            <span className="app-shell-brand-mark" aria-hidden>
              <AppLogo size={36} />
            </span>
            <span className="app-shell-brand-text">
              <span className="app-shell-brand-title">DiyetTakvim</span>
              <span className="app-shell-brand-tagline">Beslenme · Randevu · Takip</span>
            </span>
          </Link>
        </div>

        <nav className="app-shell-nav" aria-label="Sayfalar">
          {navItems.map((item) => {
            const active = navItemActive(item.match, pathname, hash);
            return (
              <Link
                key={`${item.label}-${item.to}`}
                to={item.to}
                className={`app-shell-nav-link${active ? " app-shell-nav-link--active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="app-shell-sidebar-footer">
          <div className="app-shell-footer-deco" aria-hidden />
          <div className="app-shell-user">
            <div
              className={`app-shell-user-avatar${showEmoji ? " app-shell-user-avatar--emoji" : ""}`}
              style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
            >
              {photoUrl ? null : showEmoji ? (
                <span>{avatarEmoji}</span>
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="app-shell-user-text">
              <strong>{displayName}</strong>
              <span>{role === "dietitian" ? "Diyetisyen" : "Danışan"}</span>
            </div>
          </div>
          <Link
            to={settingsPath}
            className="app-shell-settings-link"
            onClick={() => setMenuOpen(false)}
          >
            Profil ayarları
            <span aria-hidden>→</span>
          </Link>
          <button type="button" className="app-shell-logout" onClick={handleLogout}>
            Çıkış yap
          </button>
        </div>
      </aside>

      <div className="app-shell-main">
        <header className="app-shell-top">
          <div className="app-shell-top-text">
            {title ? <h1 className="app-shell-title">{title}</h1> : null}
            {subtitle ? <p className="app-shell-subtitle">{subtitle}</p> : null}
          </div>
          <div className="app-shell-top-actions">
            <Link
              to={
                role === "dietitian"
                  ? "/dietitian/notifications"
                  : "/client/notifications"
              }
              className="app-shell-icon-btn"
              aria-label="Bildirimler"
            >
              <Icon name="bell" />
              {notificationCount > 0 ? (
                <span className="app-shell-badge">{notificationCount > 9 ? "9+" : notificationCount}</span>
              ) : null}
            </Link>
            {showClientBookCta && role === "client" ? (
              <Link to="/client/book-appointment" className="app-shell-cta">
                + Yeni Randevu
              </Link>
            ) : null}
          </div>
        </header>

        <div className="app-shell-content">{children}</div>
      </div>
    </div>
  );
}

export default AppShell;
