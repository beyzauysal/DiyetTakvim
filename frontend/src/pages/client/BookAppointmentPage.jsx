import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";

function BookAppointmentPage() {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [note, setNote] = useState("");
  const [linkedDietitianId, setLinkedDietitianId] = useState("");
  const [loadingDietitian, setLoadingDietitian] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchClientInfo = async () => {
    try {
      setLoadingDietitian(true);
      setPageError("");

      const response = await apiClient.get("/api/auth/me");
      const user = response.data.user;

      if (user?.pendingDietitian && !user?.linkedDietitian) {
        setPageError(
          "Diyetisyeniniz bağlantı isteğinizi henüz onaylamadı. Onaylandığında randevu alabilirsiniz."
        );
        return;
      }

      if (!user?.linkedDietitian) {
        setPageError("Bu danışan hesabı henüz bir diyetisyene bağlı değil.");
        return;
      }

      if (typeof user.linkedDietitian === "object") {
        setLinkedDietitianId(user.linkedDietitian._id);
      } else {
        setLinkedDietitianId(user.linkedDietitian);
      }
    } catch (error) {
      console.error(
        "Kullanıcı bilgisi alınamadı:",
        error.response?.data || error.message
      );
      setPageError(error.response?.data?.message || "Kullanıcı bilgisi alınamadı.");
    } finally {
      setLoadingDietitian(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      setLoadingSlots(true);
      setSelectedSlot("");
      setPageError("");
      setSuccessMessage("");

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
      setPageError(error.response?.data?.message || "Uygun saatler alınamadı.");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchClientInfo();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlot("");
    }
  }, [selectedDate]);

  const handleCreateAppointment = async () => {
    if (!linkedDietitianId) {
      setPageError("Bağlı diyetisyen bulunamadı.");
      return;
    }

    if (!selectedDate) {
      setPageError("Lütfen tarih seçin.");
      return;
    }

    if (!selectedSlot) {
      setPageError("Lütfen bir saat seçin.");
      return;
    }

    try {
      setSubmitting(true);
      setPageError("");
      setSuccessMessage("");

      const appointmentDate = new Date(`${selectedDate}T${selectedSlot}:00`);

      const payload = {
        dietitianId: linkedDietitianId,
        appointmentDate,
        note,
      };

      await apiClient.post("/api/appointments", payload);

      setSuccessMessage("Randevu başarıyla oluşturuldu.");
      setSelectedSlot("");
      setNote("");

      if (selectedDate) {
        fetchAvailableSlots(selectedDate);
      }
    } catch (error) {
      console.error(
        "Randevu oluşturma hatası:",
        error.response?.data || error.message
      );
      setPageError(
        error.response?.data?.message || "Randevu oluşturulurken hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDietitian) {
    return (
      <AppShell role="client" title="Randevu Al" subtitle="Bilgiler yükleniyor…">
        <div className="dashboard-page" />
      </AppShell>
    );
  }

  return (
    <AppShell
      role="client"
      title="Randevu Al"
      subtitle="Tarih seçip uygun saatlerden randevu oluşturabilirsiniz."
    >
      <div className="dashboard-page">
        <div className="booking-card">
          {pageError && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#ffe5e5",
                color: "#b42318",
                fontWeight: 500,
              }}
            >
              {pageError}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#e8f7ee",
                color: "#157347",
                fontWeight: 500,
              }}
            >
              {successMessage}
            </div>
          )}

          <label>Tarih Seç</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setPageError("");
              setSuccessMessage("");
            }}
          />

          <h3 style={{ marginTop: "20px" }}>Uygun Saatler</h3>

          {loadingSlots ? (
            <p>Uygun saatler yükleniyor...</p>
          ) : availableSlots.length > 0 ? (
            <div className="slot-grid">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  className={`slot-button ${
                    selectedSlot === slot ? "selected-slot" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setSelectedSlot(slot);
                    setPageError("");
                    setSuccessMessage("");
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : selectedDate ? (
            <p>Bu tarih için uygun saat bulunamadı.</p>
          ) : (
            <p>Lütfen önce bir tarih seçin.</p>
          )}

          {selectedSlot && (
            <p className="selected-text">
              Seçilen saat: <strong>{selectedSlot}</strong>
            </p>
          )}

          <label>Not</label>
          <textarea
            placeholder="İsteğe bağlı not ekleyin"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setPageError("");
              setSuccessMessage("");
            }}
            rows="4"
          />

          <button
            type="button"
            onClick={handleCreateAppointment}
            disabled={submitting || !linkedDietitianId}
          >
            {submitting ? "Oluşturuluyor..." : "Randevu Oluştur"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default BookAppointmentPage;