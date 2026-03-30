import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";
import "./AppointmentsPage.css";

function AppointmentsPage() {
  const navigate = useNavigate();
  const filterMenuRef = useRef(null);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [viewMode, setViewMode] = useState("month");

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseDateKey = (dateKey) => {
    const [year, month, day] = dateKey.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const formatMonthTitle = (date) => {
    return date.toLocaleDateString("tr-TR", {
      month: "long",
      year: "numeric",
    });
  };

  const getDateLabel = (dateKey) => {
    if (!dateKey) return "";

    const date = parseDateKey(dateKey);

    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        "/api/appointments/dietitian-appointments"
      );

      const fetchedAppointments = response.data.appointments || [];
      setAppointments(fetchedAppointments);

      if (fetchedAppointments.length > 0 && !selectedDateKey) {
        const firstDate = new Date(fetchedAppointments[0].appointmentDate);
        setSelectedDateKey(formatDateKey(firstDate));
      }
    } catch (error) {
      console.error(
        "Diyetisyen randevuları alınamadı:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message || "Randevular alınırken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusLabel = (status) => {
    if (status === "scheduled") return "Planlandı";
    if (status === "cancelled") return "İptal Edildi";
    if (status === "completed") return "Tamamlandı";
    return status || "Bilinmiyor";
  };

  const getStatusClassName = (appointment) => {
    if (appointment.status === "cancelled") {
      return "appointment-status appointment-status-cancelled";
    }

    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();

    if (appointmentDate < now) {
      return "appointment-status appointment-status-past";
    }

    return "appointment-status appointment-status-upcoming";
  };

  const startEditing = (appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);

    setEditingAppointmentId(appointment._id);
    setEditDate(formatDateKey(appointmentDate));
    setEditTime(
      appointmentDate.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  };

  const cancelEditing = () => {
    setEditingAppointmentId(null);
    setEditDate("");
    setEditTime("");
  };

  const handleSaveUpdate = async (appointmentId) => {
    if (!editDate || !editTime) {
      alert("Lütfen tarih ve saat seçin.");
      return;
    }

    try {
      const newDateTime = new Date(`${editDate}T${editTime}:00`);

      await apiClient.patch(`/api/appointments/update/${appointmentId}`, {
        appointmentDate: newDateTime,
      });

      alert("Randevu güncellendi.");
      cancelEditing();
      fetchAppointments();
    } catch (error) {
      console.error(
        "Randevu güncellenemedi:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Randevu güncellenemedi.");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Bu randevuyu iptal etmek istediğinize emin misiniz?"
    );
    if (!confirmed) return;

    try {
      await apiClient.patch(`/api/appointments/cancel/${appointmentId}`);
      alert("Randevu iptal edildi.");
      fetchAppointments();
    } catch (error) {
      console.error(
        "Randevu iptal edilemedi:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Randevu iptal edilemedi.");
    }
  };

  const handleGoToClientDetail = (clientId) => {
    if (!clientId) {
      alert("Danışan detayı açılamadı.");
      return;
    }

    navigate(`/dietitian/clients/${clientId}`);
  };

  const filteredAppointments = useMemo(() => {
    const now = new Date();

    const sortedAppointments = [...appointments].sort((a, b) => {
      return new Date(a.appointmentDate) - new Date(b.appointmentDate);
    });

    if (activeFilter === "all") return sortedAppointments;

    if (activeFilter === "cancelled") {
      return sortedAppointments.filter(
        (appointment) => appointment.status === "cancelled"
      );
    }

    if (activeFilter === "upcoming") {
      return sortedAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointment.status !== "cancelled" && appointmentDate >= now;
      });
    }

    if (activeFilter === "past") {
      return sortedAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointment.status !== "cancelled" && appointmentDate < now;
      });
    }

    return sortedAppointments;
  }, [appointments, activeFilter]);

  const groupedAppointments = useMemo(() => {
    return filteredAppointments.reduce((groups, appointment) => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateKey = formatDateKey(appointmentDate);

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(appointment);
      return groups;
    }, {});
  }, [filteredAppointments]);

  const counts = useMemo(() => {
    const now = new Date();

    return {
      all: appointments.length,
      upcoming: appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointment.status !== "cancelled" && appointmentDate >= now;
      }).length,
      past: appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointment.status !== "cancelled" && appointmentDate < now;
      }).length,
      cancelled: appointments.filter(
        (appointment) => appointment.status === "cancelled"
      ).length,
    };
  }, [appointments]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDay =
      firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let i = 0; i < startDay; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [currentMonth]);

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDateKey) return [];
    return groupedAppointments[selectedDateKey] || [];
  }, [groupedAppointments, selectedDateKey]);

  const selectedDateLabel = useMemo(() => {
    return getDateLabel(selectedDateKey);
  }, [selectedDateKey]);

  const selectedDate = useMemo(() => {
    return selectedDateKey ? parseDateKey(selectedDateKey) : new Date();
  }, [selectedDateKey]);

  const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const selectedWeekDays = useMemo(() => {
    const baseDate = selectedDate;
    const jsDay = baseDate.getDay();
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + mondayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);

      const dateKey = formatDateKey(date);

      return {
        date,
        dateKey,
        label: date.toLocaleDateString("tr-TR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }),
        appointments: groupedAppointments[dateKey] || [],
        isToday: formatDateKey(new Date()) === dateKey,
        isSelected: selectedDateKey === dateKey,
      };
    });
  }, [selectedDate, groupedAppointments, selectedDateKey]);

  const dailyTimelineAppointments = useMemo(() => {
    return [...selectedDayAppointments].sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime()
    );
  }, [selectedDayAppointments]);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToPreviousWeek = () => {
    const base = selectedDateKey ? parseDateKey(selectedDateKey) : new Date();
    const previous = new Date(base);
    previous.setDate(base.getDate() - 7);
    setSelectedDateKey(formatDateKey(previous));
    setCurrentMonth(new Date(previous.getFullYear(), previous.getMonth(), 1));
  };

  const goToNextWeek = () => {
    const base = selectedDateKey ? parseDateKey(selectedDateKey) : new Date();
    const next = new Date(base);
    next.setDate(base.getDate() + 7);
    setSelectedDateKey(formatDateKey(next));
    setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const goToPreviousDay = () => {
    const base = selectedDateKey ? parseDateKey(selectedDateKey) : new Date();
    const previous = new Date(base);
    previous.setDate(base.getDate() - 1);
    setSelectedDateKey(formatDateKey(previous));
    setCurrentMonth(new Date(previous.getFullYear(), previous.getMonth(), 1));
  };

  const goToNextDay = () => {
    const base = selectedDateKey ? parseDateKey(selectedDateKey) : new Date();
    const next = new Date(base);
    next.setDate(base.getDate() + 1);
    setSelectedDateKey(formatDateKey(next));
    setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(formatDateKey(today));
  };

  const getFilterLabel = () => {
    if (activeFilter === "all") return `Tümü (${counts.all})`;
    if (activeFilter === "upcoming") return `Yaklaşan (${counts.upcoming})`;
    if (activeFilter === "past") return `Geçmiş (${counts.past})`;
    if (activeFilter === "cancelled") return `İptal (${counts.cancelled})`;
    return "Filtre";
  };

  const filterOptions = [
    { key: "all", label: `Tümü (${counts.all})` },
    { key: "upcoming", label: `Yaklaşan (${counts.upcoming})` },
    { key: "past", label: `Geçmiş (${counts.past})` },
    { key: "cancelled", label: `İptal (${counts.cancelled})` },
  ];

  const renderAppointmentCard = (appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const isEditing = editingAppointmentId === appointment._id;

    return (
      <div key={appointment._id} className="appointment-item">
        <div className="appointment-item-top">
          <div>
            <h3>{appointment.client?.name || "Danışan"}</h3>
            <p>{appointment.client?.email || "-"}</p>
          </div>

          <span className={getStatusClassName(appointment)}>
            {getStatusLabel(appointment.status)}
          </span>
        </div>

        <div className="appointment-meta-grid">
          <div className="meta-box">
            <strong>Saat</strong>
            <span>
              {appointmentDate.toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="meta-box">
            <strong>Not</strong>
            <span>{appointment.note || "Yok"}</span>
          </div>
        </div>

        <div className="appointment-actions">
          <button
            className="secondary-btn"
            onClick={() => handleGoToClientDetail(appointment.client?._id)}
          >
            Danışan Detayı
          </button>

          {appointment.status !== "cancelled" && (
            <>
              <button
                className="primary-btn"
                onClick={() => startEditing(appointment)}
              >
                Güncelle
              </button>

              <button
                className="danger-btn"
                onClick={() => handleCancelAppointment(appointment._id)}
              >
                İptal Et
              </button>
            </>
          )}
        </div>

        {isEditing && (
          <div className="edit-panel">
            <div className="edit-grid">
              <div>
                <label>Yeni Tarih</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>

              <div>
                <label>Yeni Saat</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
            </div>

            <div className="edit-actions">
              <button
                className="save-btn"
                onClick={() => handleSaveUpdate(appointment._id)}
              >
                Kaydet
              </button>

              <button className="secondary-btn" onClick={cancelEditing}>
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AppShell role="dietitian" title="Randevular" subtitle="Yükleniyor…">
        <div className="appointments-page">
          <div className="appointments-loading">Yükleniyor...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="dietitian"
      title="Randevular"
      subtitle="Takvim ve liste görünümünde randevularınızı yönetin."
    >
      <div className="appointments-page">
        <div
          className="appointments-toolbar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={viewMode === "month" ? "primary-btn" : "secondary-btn"}
            >
              Ay
            </button>

            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={viewMode === "week" ? "primary-btn" : "secondary-btn"}
            >
              Hafta
            </button>

            <button
              type="button"
              onClick={() => setViewMode("day")}
              className={viewMode === "day" ? "primary-btn" : "secondary-btn"}
            >
              Gün
            </button>
          </div>

          <div className="filter-menu-wrapper" ref={filterMenuRef}>
            <button
              className="filter-menu-button"
              onClick={() => setShowFilterMenu((prev) => !prev)}
            >
              ☰ {getFilterLabel()}
            </button>

            {showFilterMenu && (
              <div className="filter-menu-dropdown">
                {filterOptions.map((option) => (
                  <button
                    key={option.key}
                    className={`filter-menu-item ${
                      activeFilter === option.key ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveFilter(option.key);
                      setShowFilterMenu(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {viewMode === "month" && (
          <>
            <div className="appointments-calendar-card">
              <div className="calendar-topbar-modern">
                <h2>{formatMonthTitle(currentMonth)}</h2>

                <div className="calendar-controls">
                  <button className="today-button" onClick={goToToday}>
                    Bugün
                  </button>
                  <button className="icon-button" onClick={goToPreviousMonth}>
                    ‹
                  </button>
                  <button className="icon-button" onClick={goToNextMonth}>
                    ›
                  </button>
                </div>
              </div>

              <div className="calendar-weekdays">
                {weekDays.map((day) => (
                  <div key={day} className="calendar-weekday">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-grid modern-calendar-grid">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="calendar-empty modern-empty"
                      />
                    );
                  }

                  const dateKey = formatDateKey(date);
                  const dayAppointments = groupedAppointments[dateKey] || [];
                  const appointmentCount = dayAppointments.length;
                  const isSelected = selectedDateKey === dateKey;
                  const isToday = formatDateKey(new Date()) === dateKey;

                  let dayClassName = "calendar-day modern-calendar-day";
                  if (appointmentCount >= 4) dayClassName += " busy-high";
                  else if (appointmentCount >= 2) dayClassName += " busy-medium";
                  if (isSelected) dayClassName += " selected";

                  return (
                    <button
                      key={dateKey}
                      className={dayClassName}
                      onClick={() => setSelectedDateKey(dateKey)}
                    >
                      <div className="calendar-day-date-row">
                        <span className={isToday ? "day-number today" : "day-number"}>
                          {date.getDate()}
                        </span>
                      </div>

                      <div className="calendar-day-events">
                        {appointmentCount > 0 ? (
                          <div className="calendar-event-pill">
                            {appointmentCount} randevu
                          </div>
                        ) : (
                          <div className="calendar-empty-text">Boş</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="appointments-detail-card">
              <div className="detail-header">
                <h2>{selectedDateLabel || "Gün seçilmedi"}</h2>
              </div>

              {!selectedDateKey ? (
                <div className="empty-state">Lütfen takvimden bir gün seç.</div>
              ) : selectedDayAppointments.length === 0 ? (
                <div className="empty-state">
                  Bu gün için gösterilecek randevu yok.
                </div>
              ) : (
                <div className="appointment-list">
                  {selectedDayAppointments.map(renderAppointmentCard)}
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === "week" && (
          <>
            <div className="appointments-calendar-card">
              <div className="calendar-topbar-modern">
                <h2>
                  {selectedWeekDays[0]?.date.toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  -{" "}
                  {selectedWeekDays[6]?.date.toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>

                <div className="calendar-controls">
                  <button className="today-button" onClick={goToToday}>
                    Bugün
                  </button>
                  <button className="icon-button" onClick={goToPreviousWeek}>
                    ‹
                  </button>
                  <button className="icon-button" onClick={goToNextWeek}>
                    ›
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: "12px",
                }}
              >
                {selectedWeekDays.map((day) => (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(day.dateKey)}
                    style={{
                      border: day.isSelected
                        ? "2px solid var(--mock-sage-dark)"
                        : "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: day.isToday ? "var(--mock-sage-light)" : "var(--surface)",
                      padding: "14px 12px",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-soft)",
                        marginBottom: "8px",
                        fontWeight: "600",
                      }}
                    >
                      {day.label}
                    </div>

                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "700",
                        color: "var(--text)",
                        marginBottom: "10px",
                      }}
                    >
                      {day.date.getDate()}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color:
                          day.appointments.length > 0
                            ? "var(--danger-dark)"
                            : "var(--text-soft)",
                      }}
                    >
                      {day.appointments.length > 0
                        ? `${day.appointments.length} randevu`
                        : "Boş"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="appointments-detail-card">
              <div className="detail-header">
                <h2>{selectedDateLabel || "Gün seçilmedi"}</h2>
              </div>

              {!selectedDateKey ? (
                <div className="empty-state">Lütfen bir gün seç.</div>
              ) : selectedDayAppointments.length === 0 ? (
                <div className="empty-state">
                  Seçilen gün için randevu bulunmuyor.
                </div>
              ) : (
                <div className="appointment-list">
                  {selectedDayAppointments.map(renderAppointmentCard)}
                </div>
              )}
            </div>
          </>
        )}

        {viewMode === "day" && (
          <>
            <div className="appointments-calendar-card">
              <div className="calendar-topbar-modern">
                <h2>{selectedDateLabel || "Gün seçilmedi"}</h2>

                <div className="calendar-controls">
                  <button className="today-button" onClick={goToToday}>
                    Bugün
                  </button>
                  <button className="icon-button" onClick={goToPreviousDay}>
                    ‹
                  </button>
                  <button className="icon-button" onClick={goToNextDay}>
                    ›
                  </button>
                </div>
              </div>

              {!selectedDateKey ? (
                <div className="empty-state">Lütfen bir gün seç.</div>
              ) : dailyTimelineAppointments.length === 0 ? (
                <div className="empty-state">
                  Bu gün için zamanlanmış randevu yok.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                  }}
                >
                  {dailyTimelineAppointments.map((appointment) => {
                    const appointmentDate = new Date(appointment.appointmentDate);

                    return (
                      <div
                        key={appointment._id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "90px 1fr",
                          gap: "14px",
                          alignItems: "start",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-lg)",
                          backgroundColor: "var(--surface)",
                          padding: "16px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "700",
                            color: "var(--mock-sage-dark)",
                            fontSize: "16px",
                            paddingTop: "4px",
                          }}
                        >
                          {appointmentDate.toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div>{renderAppointmentCard(appointment)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default AppointmentsPage;