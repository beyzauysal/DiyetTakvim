import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";

function AvailabilityPage() {
  const [formData, setFormData] = useState({
    workingDays: [],
    workStart: "",
    workEnd: "",
    breakStart: "",
    breakEnd: "",
    slotDuration: 30,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dayOptions = [
    { label: "Pazartesi", value: "Monday" },
    { label: "Salı", value: "Tuesday" },
    { label: "Çarşamba", value: "Wednesday" },
    { label: "Perşembe", value: "Thursday" },
    { label: "Cuma", value: "Friday" },
    { label: "Cumartesi", value: "Saturday" },
    { label: "Pazar", value: "Sunday" },
  ];

  const fetchAvailability = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get("/api/auth/me");
      const availability = response.data.user?.availability || {};

      setFormData({
        workingDays: availability.workingDays || [],
        workStart: availability.workStart || "",
        workEnd: availability.workEnd || "",
        breakStart: availability.breakStart || "",
        breakEnd: availability.breakEnd || "",
        slotDuration: availability.slotDuration || 30,
      });
    } catch (error) {
      console.error(
        "Uygunluk bilgileri alınamadı:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Uygunluk bilgileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleDayToggle = (dayValue) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(dayValue);

      return {
        ...prev,
        workingDays: exists
          ? prev.workingDays.filter((day) => day !== dayValue)
          : [...prev.workingDays, dayValue],
      };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "slotDuration" ? Number(value) : value,
    }));
  };

  const handleSaveAvailability = async () => {
    if (formData.workingDays.length === 0) {
      alert("Lütfen en az bir çalışma günü seçin.");
      return;
    }

    if (!formData.workStart || !formData.workEnd) {
      alert("Lütfen çalışma başlangıç ve bitiş saatlerini girin.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        workingDays: formData.workingDays,
        workStart: formData.workStart,
        workEnd: formData.workEnd,
        breakStart: formData.breakStart,
        breakEnd: formData.breakEnd,
        slotDuration: formData.slotDuration,
      };

      await apiClient.patch("/api/auth/update-availability", payload);

      alert("Uygunluk saatleri güncellendi.");
      fetchAvailability();
    } catch (error) {
      console.error(
        "Uygunluk bilgileri güncellenemedi:",
        error.response?.data || error.message
      );
      alert(
        error.response?.data?.message || "Uygunluk bilgileri güncellenemedi."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedDaysText =
    formData.workingDays.length > 0
      ? dayOptions
          .filter((day) => formData.workingDays.includes(day.value))
          .map((day) => day.label)
          .join(", ")
      : "Henüz gün seçilmedi";

  if (loading) {
    return (
      <AppShell role="dietitian" title="Uygunluk saatleri" subtitle="Yükleniyor…">
        <div className="dashboard-page" />
      </AppShell>
    );
  }

  return (
    <AppShell
      role="dietitian"
      title="Uygunluk saatleri"
      subtitle="Randevu alınabilecek günleri, çalışma saatlerini ve öğle arasını buradan yönetebilirsiniz."
    >
      <div className="dashboard-page">
        <div className="booking-card">
          <label>Çalışma Günleri</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            {dayOptions.map((day) => {
              const selected = formData.workingDays.includes(day.value);

              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: selected
                      ? "1px solid var(--mock-sage-dark)"
                      : "1px solid var(--border)",
                    backgroundColor: selected
                      ? "var(--mock-sage-light)"
                      : "var(--surface)",
                    cursor: "pointer",
                    fontWeight: selected ? "600" : "400",
                    color: "var(--text)",
                  }}
                >
                  {day.label}
                </button>
              );
            })}
          </div>

          <p style={{ marginBottom: "14px" }}>
            <strong>Seçilen Günler:</strong> {selectedDaysText}
          </p>

          <label>Çalışma Başlangıç Saati</label>
          <input
            type="time"
            name="workStart"
            value={formData.workStart}
            onChange={handleChange}
          />

          <label>Çalışma Bitiş Saati</label>
          <input
            type="time"
            name="workEnd"
            value={formData.workEnd}
            onChange={handleChange}
          />

          <label>Öğle Arası Başlangıç</label>
          <input
            type="time"
            name="breakStart"
            value={formData.breakStart}
            onChange={handleChange}
          />

          <label>Öğle Arası Bitiş</label>
          <input
            type="time"
            name="breakEnd"
            value={formData.breakEnd}
            onChange={handleChange}
          />

          <label>Slot Süresi (dakika)</label>
          <select
            name="slotDuration"
            value={formData.slotDuration}
            onChange={handleChange}
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
          </select>

          <button type="button" onClick={handleSaveAvailability} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Uygunluğu Kaydet"}
          </button>
        </div>

        <div className="appointments-list" style={{ marginTop: "24px" }}>
          <div className="appointment-card">
            <div className="appointment-top">
              <h3>Mevcut Uygunluk Özeti</h3>
            </div>

            <p>
              <strong>Çalışma Günleri:</strong> {selectedDaysText}
            </p>
            <p>
              <strong>Çalışma Saatleri:</strong>{" "}
              {formData.workStart && formData.workEnd
                ? `${formData.workStart} - ${formData.workEnd}`
                : "-"}
            </p>
            <p>
              <strong>Öğle Arası:</strong>{" "}
              {formData.breakStart && formData.breakEnd
                ? `${formData.breakStart} - ${formData.breakEnd}`
                : "-"}
            </p>
            <p>
              <strong>Slot Süresi:</strong> {formData.slotDuration} dakika
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default AvailabilityPage;