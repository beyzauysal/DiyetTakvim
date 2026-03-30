import { useEffect, useMemo, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [editModeId, setEditModeId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editSlot, setEditSlot] = useState("");
  const [editNote, setEditNote] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/appointments/my-appointments");
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error(
        "Randevular alınamadı:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Randevular alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      setLoadingSlots(true);
      const response = await apiClient.get(
        `/api/appointments/available-slots?date=${date}`
      );
      setAvailableSlots(response.data.availableSlots || []);
    } catch (error) {
      console.error(
        "Uygun saatler alınamadı:",
        error.response?.data || error.message
      );
      setAvailableSlots([]);
      alert(error.response?.data?.message || "Uygun saatler alınamadı.");
    } finally {
      setLoadingSlots(false);
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

  const handleOpenEdit = async (appointment) => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const localDate = `${appointmentDate.getFullYear()}-${String(
      appointmentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(appointmentDate.getDate()).padStart(2, "0")}`;
    const localTime = `${String(appointmentDate.getHours()).padStart(
      2,
      "0"
    )}:${String(appointmentDate.getMinutes()).padStart(2, "0")}`;

    setEditModeId(appointment._id);
    setEditDate(localDate);
    setEditSlot(localTime);
    setEditNote(appointment.note || "");

    await fetchAvailableSlots(localDate);
  };

  const handleDateChange = async (value) => {
    setEditDate(value);
    setEditSlot("");

    if (value) {
      await fetchAvailableSlots(value);
    } else {
      setAvailableSlots([]);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!editModeId) return;

    if (!editDate) {
      alert("Lütfen tarih seçin.");
      return;
    }

    if (!editSlot) {
      alert("Lütfen saat seçin.");
      return;
    }

    try {
      setUpdatingId(editModeId);

      const payload = {
        appointmentDate: `${editDate}T${editSlot}:00`,
        note: editNote,
      };

      await apiClient.patch(`/api/appointments/update/${editModeId}`, payload);

      alert("Randevu güncellendi.");
      setEditModeId("");
      setEditDate("");
      setEditSlot("");
      setEditNote("");
      setAvailableSlots([]);
      fetchAppointments();
    } catch (error) {
      console.error(
        "Randevu güncellenemedi:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Randevu güncellenemedi.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleCloseEdit = () => {
    setEditModeId("");
    setEditDate("");
    setEditSlot("");
    setEditNote("");
    setAvailableSlots([]);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime()
    );
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const now = new Date();

    if (filter === "upcoming") {
      return sortedAppointments.filter(
        (appointment) =>
          appointment.status !== "cancelled" &&
          new Date(appointment.appointmentDate) >= now
      );
    }

    if (filter === "past") {
      return sortedAppointments.filter(
        (appointment) =>
          appointment.status !== "cancelled" &&
          new Date(appointment.appointmentDate) < now
      );
    }

    if (filter === "cancelled") {
      return sortedAppointments.filter(
        (appointment) => appointment.status === "cancelled"
      );
    }

    return sortedAppointments;
  }, [sortedAppointments, filter]);

  const upcomingCount = useMemo(() => {
    const now = new Date();
    return appointments.filter(
      (appointment) =>
        appointment.status !== "cancelled" &&
        new Date(appointment.appointmentDate) >= now
    ).length;
  }, [appointments]);

  const cancelledCount = appointments.filter(
    (appointment) => appointment.status === "cancelled"
  ).length;

  const nextAppointment = useMemo(() => {
    const now = new Date();
    return sortedAppointments.find(
      (appointment) =>
        appointment.status !== "cancelled" &&
        new Date(appointment.appointmentDate) >= now
    );
  }, [sortedAppointments]);

  const formatStatus = (status) => {
    if (status === "scheduled") return "Planlandı";
    if (status === "cancelled") return "İptal";
    return status;
  };

  const getStatusClassName = (status) => {
    if (status === "scheduled") return "status-badge approved";
    if (status === "cancelled") return "status-badge pending";
    return "status-badge";
  };

  if (loading) {
    return (
      <AppShell
        role="client"
        title="Randevularım"
        subtitle="Yükleniyor…"
      >
        <div className="dashboard-page" />
      </AppShell>
    );
  }

  return (
    <AppShell
      role="client"
      title="Randevularım"
      subtitle="Yaklaşan ve geçmiş randevularınızı filtreleyin, güncelleyin veya iptal edin."
    >
      <div className="dashboard-page">
        <header className="appointments-page-head appointments-page-head--toolbar">
          <div className="appointment-filters-bar">
            <div
              className="appointment-filters-track"
              role="group"
              aria-label="Randevu filtresi"
            >
              <button
                type="button"
                className={`btn-filter-chip${filter === "all" ? " is-active" : ""}`}
                onClick={() => setFilter("all")}
              >
                Tümü
              </button>

              <button
                type="button"
                className={`btn-filter-chip${filter === "upcoming" ? " is-active" : ""}`}
                onClick={() => setFilter("upcoming")}
              >
                Yaklaşan
              </button>

              <button
                type="button"
                className={`btn-filter-chip${filter === "past" ? " is-active" : ""}`}
                onClick={() => setFilter("past")}
              >
                Geçmiş
              </button>

              <button
                type="button"
                className={`btn-filter-chip${filter === "cancelled" ? " is-active" : ""}`}
                onClick={() => setFilter("cancelled")}
              >
                İptal Edilen
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-grid appointments-summary-grid">
          <div className="dashboard-card">
            <h3>Toplam Randevu</h3>
            <p className="dashboard-number">{appointments.length}</p>
          </div>

          <div className="dashboard-card">
            <h3>Yaklaşan Randevu</h3>
            <p className="dashboard-number">{upcomingCount}</p>
          </div>

          <div className="dashboard-card">
            <h3>İptal Edilen</h3>
            <p className="dashboard-number">{cancelledCount}</p>
          </div>

          <div className="dashboard-card">
            <h3>En Yakın Görüşme</h3>
            <p className="dashboard-number dashboard-number--date">
              {nextAppointment
                ? new Date(nextAppointment.appointmentDate).toLocaleDateString(
                    "tr-TR"
                  )
                : "-"}
            </p>
          </div>
        </div>

        <div className="appointments-list">
          {filteredAppointments.length === 0 ? (
            <div className="appointment-card">
              <p>Bu filtre için gösterilecek randevu yok.</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const appointmentDate = new Date(appointment.appointmentDate);
              const isEditing = editModeId === appointment._id;
              const isCancelled = appointment.status === "cancelled";

              return (
                <div
                  key={appointment._id}
                  className="appointment-card"
                  style={{
                    borderRadius: "18px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
                  }}
                >
                  <div
                    className="appointment-top"
                    style={{
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ marginBottom: "6px" }}>
                        {appointment.dietitian?.name || "Diyetisyen"}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          color: "#6b7280",
                          fontSize: "14px",
                        }}
                      >
                        Bireysel görüşme kaydı
                      </p>
                    </div>

                    <span className={getStatusClassName(appointment.status)}>
                      {formatStatus(appointment.status)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                      marginTop: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#f8faf8",
                        borderRadius: "12px",
                        padding: "12px",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: "6px" }}>
                        Tarih
                      </strong>
                      <span>{appointmentDate.toLocaleDateString("tr-TR")}</span>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#f8faf8",
                        borderRadius: "12px",
                        padding: "12px",
                      }}
                    >
                      <strong style={{ display: "block", marginBottom: "6px" }}>
                        Saat
                      </strong>
                      <span>
                        {appointmentDate.toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: "#fcfcfc",
                      border: "1px solid #eef2f0",
                      borderRadius: "12px",
                      padding: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "6px" }}>
                      Not
                    </strong>
                    <span style={{ color: "#374151" }}>
                      {appointment.note || "Not bulunmuyor"}
                    </span>
                  </div>

                  {!isCancelled && (
                    <div className="appointment-actions">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(appointment)}
                      >
                        Güncelle
                      </button>

                      <button
                        className="danger-button"
                        onClick={() => handleCancelAppointment(appointment._id)}
                      >
                        İptal Et
                      </button>
                    </div>
                  )}

                  {isEditing && !isCancelled && (
                    <div
                      style={{
                        marginTop: "18px",
                        paddingTop: "18px",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <label>Yeni Tarih</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                      />

                      <h4 style={{ marginTop: "16px", marginBottom: "10px" }}>
                        Uygun Saatler
                      </h4>

                      {loadingSlots ? (
                        <p>Uygun saatler yükleniyor...</p>
                      ) : availableSlots.length > 0 ? (
                        <div className="slot-grid">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              className={`slot-button ${
                                editSlot === slot ? "selected-slot" : ""
                              }`}
                              onClick={() => setEditSlot(slot)}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p>Bu tarih için uygun saat bulunamadı.</p>
                      )}

                      <label style={{ marginTop: "14px" }}>Not</label>
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Not güncelle"
                      />

                      <div className="appointment-actions">
                        <button
                          type="button"
                          onClick={handleUpdateAppointment}
                          disabled={updatingId === appointment._id}
                        >
                          {updatingId === appointment._id
                            ? "Güncelleniyor..."
                            : "Kaydet"}
                        </button>

                        <button type="button" onClick={handleCloseEdit}>
                          Vazgeç
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default AppointmentsPage;