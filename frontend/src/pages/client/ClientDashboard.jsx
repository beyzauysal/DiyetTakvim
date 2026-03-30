import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import WaterWidget from "../../components/water/WaterWidget";
import NutritionDiarySection from "../../components/nutrition/NutritionDiarySection";
import apiClient from "../../api/apiClient";
import { todayKey } from "../../lib/waterPrefs";
import { useAuth } from "../../context/AuthContext";

const MEAL_LABELS = {
  kahvalti: "Kahvaltı",
  ara_ogun: "Ara öğün",
  ogle: "Öğle yemeği",
  aksam: "Akşam yemeği",
  gece: "Gece atıştırması",
};

function ClientDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [waterTodayMl, setWaterTodayMl] = useState(0);
  const [availableSlotsCount, setAvailableSlotsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const calendarDayRef = useRef(todayKey());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [appointmentsRes, recordsRes, notificationsRes, waterRes] =
        await Promise.all([
          apiClient.get("/api/appointments/my-appointments"),
          apiClient.get("/api/calorie-records/my-records"),
          apiClient.get("/api/notifications"),
          apiClient.get("/api/water-intake/daily").catch(() => ({ data: {} })),
        ]);

      const appointmentsData = appointmentsRes.data.appointments || [];
      const recordsData = recordsRes.data.records || [];
      const notificationsData = notificationsRes.data.notifications || [];

      setAppointments(appointmentsData);
      setRecords(recordsData);
      setNotifications(notificationsData);
      const wm = Number(waterRes.data?.totalMl) || 0;
      setWaterTodayMl(wm);
      calendarDayRef.current = todayKey();

      const upcomingAppointment = appointmentsData
        .filter(
          (appointment) =>
            appointment.status !== "cancelled" &&
            new Date(appointment.appointmentDate) > new Date()
        )
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime()
        )[0];

      if (upcomingAppointment) {
        const dateKey = new Date(upcomingAppointment.appointmentDate)
          .toISOString()
          .split("T")[0];

        try {
          const availableSlotsRes = await apiClient.get(
            `/api/appointments/available-slots?date=${dateKey}`
          );
          setAvailableSlotsCount(
            (availableSlotsRes.data.availableSlots || []).length
          );
        } catch (error) {
          setAvailableSlotsCount(0);
        }
      } else {
        setAvailableSlotsCount(0);
      }
    } catch (error) {
      console.error(
        "Danışan dashboard verileri alınamadı:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message || "Danışan panel verileri alınamadı."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (location.hash !== "#panel-water") return;
    const t = window.setTimeout(() => {
      document
        .getElementById("panel-water")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, [location.hash, loading]);

  useEffect(() => {
    const checkNewDay = () => {
      const t = todayKey();
      if (t !== calendarDayRef.current) {
        calendarDayRef.current = t;
        fetchDashboardData();
      }
    };
    const intervalId = setInterval(checkNewDay, 60_000);
    document.addEventListener("visibilitychange", checkNewDay);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", checkNewDay);
    };
  }, []);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          appointment.status !== "cancelled" &&
          new Date(appointment.appointmentDate) > new Date()
      )
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      );
  }, [appointments]);

  const nextAppointment = upcomingAppointments[0] || null;

  const weeklyRecordsCount = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    return records.filter((record) => {
      const recordDate = new Date(record.createdAt || record.date);
      return recordDate >= weekAgo && recordDate <= now;
    }).length;
  }, [records]);

  const totalCalorieEntries = records.length;

  const unreadNotifications = useMemo(() => {
    return notifications.filter((notification) => !notification.isRead).length;
  }, [notifications]);

  const latestNotifications = useMemo(() => {
    return [...notifications]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 4);
  }, [notifications]);

  const todayRecord = useMemo(() => {
    const t = todayKey();
    const sorted = [...records].sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime()
    );
    return sorted.find((r) => {
      const d = new Date(r.createdAt || r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return key === t;
    });
  }, [records]);

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

  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "Merhaba";

  const shellTitle = loading
    ? "Panel"
    : `Hoş geldin, ${firstName}! 🍃`;
  const shellSubtitle = loading
    ? "Veriler yükleniyor…"
    : "Bugün sağlıklı alışkanlıklarınıza bir adım daha yaklaşabilirsiniz.";

  return (
    <AppShell
      role="client"
      title={shellTitle}
      subtitle={shellSubtitle}
      showClientBookCta
      notificationCount={unreadNotifications}
    >
      <div className="dashboard-page">
        {loading ? (
          <p className="dashboard-loading-msg">Yükleniyor…</p>
        ) : (
          <>
            {user?.pendingDietitian && !user?.linkedDietitian ? (
              <div
                className="profile-form-card"
                style={{
                  marginBottom: "18px",
                  padding: "14px 18px",
                  background: "linear-gradient(135deg, #e8f4fc 0%, #dceef8 100%)",
                  border: "1px solid rgba(30, 77, 107, 0.2)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: "#1e4d6b" }}>
                  Bağlantı onayı bekleniyor
                </p>
                <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#2d5a7a", lineHeight: 1.5 }}>
                  Diyetisyeniniz davet kodunuzla gelen isteği onayladığında randevu ve beslenme
                  kayıtları açılır. Bildirimler sayfasını kontrol edin.
                </p>
              </div>
            ) : null}
            {user?.linkedDietitian && typeof user.linkedDietitian === "object" ? (
              <div
                className="profile-form-card"
                style={{
                  marginBottom: "18px",
                  padding: "14px 18px",
                  background: "linear-gradient(135deg, #f1fbf7 0%, #e7f7f0 100%)",
                  border: "1px solid rgba(32, 87, 67, 0.18)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 800, color: "#205743" }}>
                  Bağlı diyetisyeniniz
                </p>
                <p style={{ margin: "8px 0 0", color: "#244b3d", lineHeight: 1.55 }}>
                  <strong>{user.linkedDietitian?.name || "Diyetisyen"}</strong>
                  {user.linkedDietitian?.specialty
                    ? ` · ${user.linkedDietitian.specialty}`
                    : ""}
                </p>
                {user.linkedDietitian?.city ? (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-soft)" }}>
                    Şehir: {user.linkedDietitian.city}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="dashboard-mock-top">
              <div className="mock-card mock-card--sage">
                <span className="mock-card-kicker">Yaklaşan randevu</span>
                {nextAppointment ? (
                  <>
                    <h3>
                      {new Date(nextAppointment.appointmentDate).toLocaleDateString(
                        "tr-TR",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        }
                      )}
                    </h3>
                    <p className="mock-card-meta">
                      {new Date(nextAppointment.appointmentDate).toLocaleTimeString(
                        "tr-TR",
                        { hour: "2-digit", minute: "2-digit" }
                      )}{" "}
                      · {nextAppointment.dietitian?.name || "Diyetisyen"}
                    </p>
                    <span
                      className="mock-tag"
                      style={{ alignSelf: "flex-start", marginTop: 4 }}
                    >
                      Görüşme
                    </span>
                    <Link
                      to="/client/appointments"
                      className="mock-card-btn"
                    >
                      Randevuyu görüntüle
                    </Link>
                    {availableSlotsCount > 0 ? (
                      <p
                        className="mock-card-meta"
                        style={{ fontSize: 12, marginTop: 4 }}
                      >
                        Aynı gün {availableSlotsCount} uygun saat
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <h3>Henüz randevu yok</h3>
                    <p className="mock-card-meta">
                      Uzmanınızdan uygun bir zaman seçerek hemen randevu
                      oluşturabilirsiniz.
                    </p>
                    <Link
                      to="/client/book-appointment"
                      className="mock-card-btn"
                    >
                      + Randevu al
                    </Link>
                  </>
                )}
              </div>

              <div className="mock-card mock-card--peach">
                <span className="mock-card-kicker">Bugünkü öğün</span>
                <h3>
                  {todayRecord
                    ? MEAL_LABELS[todayRecord.mealType] || "Öğün kaydı"
                    : "Öğününü kaydet"}
                </h3>
                <p>
                  {todayRecord
                    ? [
                        ...(todayRecord.foods || []).slice(0, 3),
                        todayRecord.note,
                      ]
                        .filter(Boolean)
                        .join(" · ") ||
                      `${todayRecord.totalCalories || 0} kcal`
                    : "Günlük beslenmenizi kayıtlara ekleyerek diyetisyeninizle paylaşın."}
                </p>
                <Link
                  to="/client/records#beslenme"
                  className="mock-card-btn"
                >
                  ✓ Öğünü kaydet
                </Link>
              </div>

              <WaterWidget
                variant="card"
                anchorId="panel-water"
                totalMl={waterTodayMl}
                onTotalChange={setWaterTodayMl}
              />
            </div>

            <section
              className="dashboard-section nutrition-diary-dashboard"
              aria-label="Beslenme günlüğü"
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
                  Beslenme günlüğü
                </h2>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <Link
                    to="/client/records#beslenme-gunlugu"
                    style={{
                      fontWeight: 800,
                      color: "var(--mock-sage-dark)",
                      fontSize: "14px",
                    }}
                  >
                    Detaylı liste →
                  </Link>
                  <Link
                    to="/client/records#beslenme"
                    style={{
                      fontWeight: 800,
                      color: "var(--mock-sage-dark)",
                      fontSize: "14px",
                    }}
                  >
                    Öğün ekle →
                  </Link>
                </div>
              </div>
              <p
                style={{
                  margin: "0 0 14px 0",
                  color: "var(--text-soft)",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                Tüm geçmiş öğün kayıtların güne göre gruplanır; aşağı kaydırarak
                inceleyebilirsin.
              </p>
              <div className="nutrition-diary-dashboard-scroll">
                <NutritionDiarySection
                  records={records}
                  mealTypeLabels={MEAL_LABELS}
                  variant="compact"
                  showHeading={false}
                  emptyMessage="Henüz öğün kaydı yok."
                />
              </div>
            </section>

            <div className="dashboard-mock-bottom">
              <div className="dashboard-section">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
                    Bildirimler
                  </h2>
                  <Link
                    to="/client/notifications"
                    style={{
                      fontWeight: 800,
                      color: "var(--mock-sage-dark)",
                      fontSize: "14px",
                    }}
                  >
                    Tümünü aç →
                  </Link>
                </div>

                {latestNotifications.length === 0 ? (
                  <div className="list-card">
                    <div className="list-row">
                      <span>Henüz bildirim yok.</span>
                    </div>
                  </div>
                ) : (
                  <div className="list-card">
                    {latestNotifications.map((notification, index) => (
                      <div
                        key={notification._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "14px 0",
                          borderBottom:
                            index !== latestNotifications.length - 1
                              ? "1px solid var(--border)"
                              : "none",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              margin: "0 0 6px 0",
                              fontWeight: notification.isRead ? "500" : "700",
                              color: "var(--text)",
                            }}
                          >
                            {notification.title || "Yeni Bildirim"}
                          </p>
                          <p
                            style={{
                              margin: "0 0 8px 0",
                              color: "var(--text-soft)",
                              lineHeight: "1.5",
                            }}
                          >
                            {notification.message || "-"}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: "13px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                        {notification.isRead ? (
                          <span
                            className="read-badge"
                            title="Okundu"
                            style={{ flexShrink: 0 }}
                          >
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

              <div className="mock-summary-card">
                <h3>Haftalık özet</h3>
                <div className="mock-summary-row">
                  <span>Bu hafta kayıt</span>
                  <strong>{weeklyRecordsCount}</strong>
                  <span className="mock-tag">Aktif takip</span>
                </div>
                <div className="mock-summary-row">
                  <span>Toplam öğün kaydı</span>
                  <strong>{totalCalorieEntries}</strong>
                  <span>Tüm zamanlar</span>
                </div>
                <div className="mock-summary-row">
                  <span>Yaklaşan randevu</span>
                  <strong>{upcomingAppointments.length}</strong>
                  <span>Planlanmış</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default ClientDashboard;
