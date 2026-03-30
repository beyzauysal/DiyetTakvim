import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

function NotificationsPage({ role }) {
  const { fetchMe } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const home =
    role === "dietitian" ? "/dietitian/dashboard" : "/client/dashboard";

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/api/notifications");
      setNotifications(data.notifications || []);
    } catch (e) {
      alert(e.response?.data?.message || "Bildirimler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (role === "client") {
      void fetchMe();
    }
  }, [role, fetchMe]);

  const markRead = async (id) => {
    try {
      setBusyId(id);
      await apiClient.patch(`/api/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      alert(e.response?.data?.message || "İşlem başarısız.");
    } finally {
      setBusyId(null);
    }
  };

  const linkRequestClientId = (n) => {
    const ru = n.relatedUser;
    if (ru && typeof ru === "object" && ru._id) return ru._id;
    if (typeof ru === "string") return ru;
    return null;
  };

  const approveClientLink = async (n) => {
    const clientId = linkRequestClientId(n);
    if (!clientId) return;
    try {
      setBusyId(`approve-${n._id}`);
      await apiClient.post(`/api/auth/client-link/${clientId}/approve`);
      await fetchAll();
      await fetchMe();
    } catch (e) {
      alert(e.response?.data?.message || "Onaylanamadı.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectClientLink = async (n) => {
    const clientId = linkRequestClientId(n);
    if (!clientId) return;
    if (
      !window.confirm(
        "Bu danışanın bağlantı isteğini reddetmek istediğinize emin misiniz?"
      )
    ) {
      return;
    }
    try {
      setBusyId(`reject-${n._id}`);
      await apiClient.post(`/api/auth/client-link/${clientId}/reject`);
      await fetchAll();
      await fetchMe();
    } catch (e) {
      alert(e.response?.data?.message || "Reddedilemedi.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    try {
      setMarkingAll(true);
      await apiClient.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      alert(e.response?.data?.message || "İşlem başarısız.");
    } finally {
      setMarkingAll(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell
      role={role}
      title="Bildirimler"
      subtitle="Randevu ve güncellemeler burada listelenir. Okunanlar tik ile işaretlenir."
      notificationCount={unread}
    >
      <div className="dashboard-page notifications-page">
        <div className="notifications-toolbar">
          <Link to={home} className="notifications-back">
            ← Panele dön
          </Link>
          {unread > 0 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={markAllRead}
              disabled={markingAll}
            >
              {markingAll ? "İşleniyor..." : "Tümünü okundu işaretle"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="booking-card">
            <p>Yükleniyor...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="booking-card">
            <p className="water-muted">Henüz bildirim yok.</p>
          </div>
        ) : (
          <ul className="notifications-list">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`notification-item ${
                  n.isRead ? "notification-item--read" : ""
                }`}
              >
                <div className="notification-item-main">
                  <div className="notification-item-head">
                    <h3
                      className={
                        n.isRead
                          ? "notification-title"
                          : "notification-title notification-title--unread"
                      }
                    >
                      {n.title || "Bildirim"}
                    </h3>
                    <div className="notification-status">
                      {n.isRead ? (
                        <span className="read-badge" title="Okundu">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path
                              d="M20 6L9 17l-5-5"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Okundu
                        </span>
                      ) : (
                        <span className="new-badge">Yeni</span>
                      )}
                    </div>
                  </div>
                  <p className="notification-body">{n.message || "-"}</p>
                  <p className="notification-time">{formatDateTime(n.createdAt)}</p>
                  {role === "dietitian" &&
                  n.type === "client_link_request" &&
                  linkRequestClientId(n) ? (
                    <div className="notification-link-actions">
                      <button
                        type="button"
                        className="mock-card-btn"
                        style={{ marginTop: 12, width: "auto" }}
                        disabled={busyId === `approve-${n._id}` || busyId === `reject-${n._id}`}
                        onClick={() => approveClientLink(n)}
                      >
                        {busyId === `approve-${n._id}` ? "…" : "Onayla"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ marginTop: 12, width: "auto" }}
                        disabled={busyId === `approve-${n._id}` || busyId === `reject-${n._id}`}
                        onClick={() => rejectClientLink(n)}
                      >
                        {busyId === `reject-${n._id}` ? "…" : "Reddet"}
                      </button>
                    </div>
                  ) : null}
                </div>
                {!n.isRead && (
                  <div className="notification-actions">
                    <button
                      type="button"
                      className="btn-mark-read"
                      onClick={() => markRead(n._id)}
                      disabled={
                        busyId === n._id ||
                        busyId === `approve-${n._id}` ||
                        busyId === `reject-${n._id}`
                      }
                    >
                      {busyId === n._id ? "…" : "Okundu yap"}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

export default NotificationsPage;
