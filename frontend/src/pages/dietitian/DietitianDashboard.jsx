import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";

function DietitianDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const monthNames = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [
        appointmentsRes,
        clientsRes,
        monthlySummaryRes,
        notificationsRes,
      ] = await Promise.all([
        apiClient.get("/api/appointments/dietitian-appointments"),
        apiClient.get("/api/auth/dietitian-clients"),
        apiClient.get(
          `/api/appointments/monthly-summary?year=${currentYear}&month=${currentMonth}`
        ),
        apiClient.get("/api/notifications"),
      ]);

      setAppointments(appointmentsRes.data.appointments || []);
      setClients(clientsRes.data.clients || []);
      setMonthlySummary(monthlySummaryRes.data.summary || []);
      setNotifications(notificationsRes.data.notifications || []);

      try {
        const meRes = await apiClient.get("/api/auth/me");
        setInviteCode(meRes.data.user?.inviteCode || "");
      } catch {
        setInviteCode("");
      }
    } catch (error) {
      console.error(
        "Dashboard verileri alınamadı:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Dashboard verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const activeAppointments = useMemo(() => {
    return appointments.filter((appointment) => appointment.status !== "cancelled");
  }, [appointments]);

  const todayAppointments = useMemo(() => {
    return activeAppointments
      .filter((appointment) => {
        const dateObj = new Date(appointment.appointmentDate);
        const key = `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1
        ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

        return key === todayKey;
      })
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      );
  }, [activeAppointments, todayKey]);

  const upcomingAppointments = useMemo(() => {
    return activeAppointments
      .filter(
        (appointment) => new Date(appointment.appointmentDate).getTime() > Date.now()
      )
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      );
  }, [activeAppointments]);

  const nextAppointment = upcomingAppointments[0] || null;
  const totalClients = clients.length;

  const thisMonthTotalAppointments = monthlySummary.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const busiestDayCount = monthlySummary.length
    ? Math.max(...monthlySummary.map((item) => item.count))
    : 0;

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const latestNotifications = [...notifications]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 2);

  const monthlyCalendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const totalDays = lastDay.getDate();

    const days = [];

    for (let day = 1; day <= totalDays; day += 1) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;

      const summaryItem = monthlySummary.find((item) => item.date === dateKey);

      days.push({
        day,
        dateKey,
        count: summaryItem ? summaryItem.count : 0,
        isToday: dateKey === todayKey,
      });
    }

    return {
      firstWeekday: firstDay.getDay(),
      days,
    };
  }, [currentYear, currentMonth, monthlySummary, todayKey]);

  const getDayCellStyle = (count, isToday) => {
    let background = "var(--surface)";
    if (count > 0) {
      const intensity = Math.min(count / 5, 1);
      const core = 0.12 + intensity * 0.32;
      const mid = core * 0.42;
      background = `radial-gradient(ellipse 130% 115% at 50% 102%, rgba(210, 72, 62, ${core}) 0%, rgba(210, 72, 62, ${mid}) 36%, rgba(210, 72, 62, 0) 64%), var(--surface)`;
    }
    return {
      background,
      outline: isToday ? "2px solid var(--mock-sage-dark)" : "none",
      outlineOffset: isToday ? "-2px" : "0px",
    };
  };

  const formatNotificationDate = (dateString) => {
    if (!dateString) return "";

    const dateObj = new Date(dateString);

    return dateObj.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <AppShell role="dietitian" title="Diyetisyen paneli" subtitle="Yükleniyor…">
        <div className="dashboard-page" />
      </AppShell>
    );
  }

  return (
    <AppShell
      role="dietitian"
      title="Diyetisyen paneli"
      subtitle="Bugünün programı, danışan özeti ve aylık takvim burada."
      notificationCount={unreadNotificationsCount}
    >
      <div className="dashboard-page">
        <div className="invite-code-banner">
          <div className="invite-code-banner__text">
            <strong>Danışan davet kodunuz</strong>
            <div className="invite-code-banner__row">
              <span className="invite-code-banner__code">
                {inviteCode || "—"}
              </span>
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 13,
                color: "var(--text-muted)",
                lineHeight: 1.45,
              }}
            >
              Danışanlar kayıt ekranında bu kodu girerek size bağlanır. Kopyalayıp paylaşın veya
              ayarlardan yeni kod üretin.
            </p>
          </div>
          <div className="invite-code-banner__actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (inviteCode) {
                  navigator.clipboard.writeText(inviteCode);
                }
              }}
              disabled={!inviteCode}
            >
              Kopyala
            </button>
            <Link
              to="/dietitian/settings"
              className="btn-secondary invite-code-banner__link"
            >
              Kod ve ayarlar
            </Link>
          </div>
        </div>

        <div className="dashboard-grid dashboard-grid--client-metrics appointments-summary-grid">
          <div className="dashboard-card dashboard-stat-card">
            <h3>Bugünkü Randevular</h3>
            <p className="dashboard-number">{todayAppointments.length}</p>
          </div>

          <div className="dashboard-card dashboard-stat-card">
            <h3>Toplam Danışan</h3>
            <p className="dashboard-number">{totalClients}</p>
          </div>

          <div className="dashboard-card dashboard-stat-card">
            <h3>Bu Ay Randevu</h3>
            <p className="dashboard-number">{thisMonthTotalAppointments}</p>
          </div>

          <div className="dashboard-card dashboard-stat-card">
            <h3>Okunmamış Bildirim</h3>
            <p className="dashboard-number dashboard-number--alert">
              {unreadNotificationsCount}
            </p>
          </div>
        </div>

        <div className="dashboard-split-2">
          <div className="dietitian-section-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ margin: "0 0 6px 0" }}>Bugünün Programı</h2>
                <p style={{ margin: 0, color: "var(--text-soft)" }}>
                  Gün içindeki aktif randevular
                </p>
              </div>

              <div
                style={{
                  backgroundColor: "var(--mock-sage-light)",
                  color: "var(--mock-sage-dark)",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                {todayAppointments.length} kayıt
              </div>
            </div>

            {todayAppointments.length === 0 ? (
              <div
                style={{
                  border: "1px dashed var(--border-strong)",
                  borderRadius: "var(--radius-md)",
                  padding: "22px",
                  textAlign: "center",
                  color: "var(--text-soft)",
                  backgroundColor: "var(--surface-soft)",
                }}
              >
                Bugün için randevu bulunmuyor.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {todayAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      backgroundColor: "var(--surface-soft)",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "var(--text)",
                        }}
                      >
                        {appointment.client?.name || "Danışan"}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "var(--text-soft)",
                        }}
                      >
                        Planlanan birebir görüşme
                      </p>
                    </div>

                    <div
                      style={{
                        minWidth: "84px",
                        textAlign: "center",
                        backgroundColor: "var(--mock-sage-dark)",
                        color: "#fff",
                        padding: "10px 12px",
                        borderRadius: "12px",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {formatTime(appointment.appointmentDate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dietitian-section-card">
            <div style={{ marginBottom: "18px" }}>
              <h2 style={{ margin: "0 0 6px 0" }}>Yaklaşan İlk Randevu</h2>
              <p style={{ margin: 0, color: "var(--text-soft)" }}>
                En yakın planlanan görüşme
              </p>
            </div>

            {nextAppointment ? (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px",
                  background:
                    "linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "var(--text)",
                  }}
                >
                  {nextAppointment.client?.name || "Danışan"}
                </p>

                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    fontSize: "14px",
                    color: "var(--text-soft)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <span>Tarih</span>
                    <strong>
                      {new Date(nextAppointment.appointmentDate).toLocaleDateString(
                        "tr-TR"
                      )}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <span>Saat</span>
                    <strong>{formatTime(nextAppointment.appointmentDate)}</strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <span>Durum</span>
                    <strong style={{ color: "var(--mock-sage-dark)" }}>
                      {nextAppointment.status || "scheduled"}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: "1px dashed var(--border-strong)",
                  borderRadius: "var(--radius-md)",
                  padding: "22px",
                  textAlign: "center",
                  color: "var(--text-soft)",
                  backgroundColor: "var(--surface-soft)",
                }}
              >
                Yaklaşan randevu bulunmuyor.
              </div>
            )}
          </div>
        </div>

        <div className="dietitian-section-card dietitian-section-card--mb">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 6px 0" }}>Bildirimler</h2>
              <p style={{ margin: 0, color: "var(--text-soft)" }}>
                Randevu hareketleri — tam liste için aşağıdaki bağlantıyı kullanın
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div
                style={{
                  backgroundColor: unreadNotificationsCount > 0 ? "#fef2f2" : "var(--info-soft)",
                  color: unreadNotificationsCount > 0 ? "#b91c1c" : "var(--accent-dark)",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "700",
                }}
              >
                {unreadNotificationsCount} okunmamış
              </div>
              <Link
                to="/dietitian/notifications"
                style={{
                  fontWeight: 800,
                  color: "var(--accent-dark)",
                  fontSize: "14px",
                }}
              >
                Tümünü aç →
              </Link>
            </div>
          </div>

          {latestNotifications.length === 0 ? (
            <div
              style={{
                border: "1px dashed var(--border-strong)",
                borderRadius: "var(--radius-md)",
                padding: "22px",
                textAlign: "center",
                color: "var(--text-soft)",
                backgroundColor: "var(--surface-soft)",
              }}
            >
              Henüz bildirim bulunmuyor.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {latestNotifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "16px",
                    backgroundColor: notification.isRead ? "var(--surface)" : "var(--surface-elevated)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontWeight: notification.isRead ? "500" : "700",
                        color: "var(--text)",
                        lineHeight: "1.5",
                      }}
                    >
                      {notification.message || "Yeni bildirim"}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "var(--text-soft)",
                      }}
                    >
                      {formatNotificationDate(notification.createdAt)}
                    </p>
                  </div>
                  {notification.isRead ? (
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
                    </span>
                  ) : (
                    <span className="new-badge">Yeni</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dietitian-section-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 6px 0" }}>
                {monthNames[currentMonth - 1]} {currentYear}
              </h2>
              <p style={{ margin: 0, color: "var(--text-soft)" }}>
                Aylık randevu yoğunluğu
              </p>
            </div>

            <div
              style={{
                backgroundColor: "var(--mock-peach)",
                color: "#5c4033",
                padding: "8px 12px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              En yoğun gün: {busiestDayCount}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--surface-soft)",
              }}
            >
              {["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"].map((label) => (
                <div
                  key={label}
                  style={{
                    padding: "12px 6px",
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "var(--text-soft)",
                    borderRight: "1px solid var(--border)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
              }}
            >
              {Array.from({ length: monthlyCalendarDays.firstWeekday }).map(
                (_, index) => (
                  <div
                    key={`empty-${index}`}
                    style={{
                      minHeight: "108px",
                      borderRight: "1px solid var(--border)",
                      borderBottom: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  />
                )
              )}

              {monthlyCalendarDays.days.map((item) => (
                <div
                  key={item.dateKey}
                  className="dietitian-calendar-day"
                  style={{
                    ...getDayCellStyle(item.count, item.isToday),
                    minHeight: "108px",
                    padding: "10px",
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "999px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: item.isToday ? "700" : "600",
                        color: item.isToday ? "#fff" : "var(--text)",
                        backgroundColor: item.isToday ? "var(--mock-sage-dark)" : "transparent",
                      }}
                    >
                      {item.day}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "flex-end",
                    }}
                  >
                    {item.count > 0 ? (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--danger-dark)",
                          fontWeight: "700",
                        }}
                      >
                        {item.count} randevu
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                        }}
                      >
                        -
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default DietitianDashboard;