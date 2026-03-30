import { useEffect, useLayoutEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import NutritionDiarySection from "../../components/nutrition/NutritionDiarySection";
import apiClient from "../../api/apiClient";

function ClientDetailPage() {
  const { id } = useParams();

  const [client, setClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [waterDate, setWaterDate] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  });
  const [waterTotalMl, setWaterTotalMl] = useState(0);
  const [waterEntries, setWaterEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const mealTypeLabels = {
    kahvalti: "Kahvaltı",
    ara_ogun: "Ara Öğün",
    ogle: "Öğle",
    aksam: "Akşam",
    gece: "Gece",
  };

  const fetchClientData = async () => {
    try {
      setLoading(true);

      const clientsResponse = await apiClient.get("/api/auth/dietitian-clients");
      const foundClient = (clientsResponse.data.clients || []).find(
        (item) => item._id === id
      );

      if (!foundClient) {
        alert("Danışan bulunamadı.");
        return;
      }

      setClient(foundClient);

      const appointmentsResponse = await apiClient.get(
        "/api/appointments/dietitian-appointments"
      );

      const clientAppointments = (appointmentsResponse.data.appointments || [])
        .filter((appointment) => appointment.client?._id === id)
        .sort(
          (a, b) =>
            new Date(a.appointmentDate).getTime() -
            new Date(b.appointmentDate).getTime()
        );

      setAppointments(clientAppointments);

      const recordsResponse = await apiClient.get(
        `/api/calorie-records/client/${id}`
      );

      setRecords(recordsResponse.data.records || []);

      const waterRes = await apiClient.get(
        `/api/water-intake/client/${id}/daily?date=${encodeURIComponent(waterDate)}`
      );
      setWaterTotalMl(waterRes.data.totalMl || 0);
      setWaterEntries(waterRes.data.entries || []);
    } catch (error) {
      console.error(
        "Danışan detayları alınamadı:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Danışan detayları alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    const n = new Date();
    setWaterDate(
      `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`
    );
  }, [id]);

  useEffect(() => {
    fetchClientData();
  }, [id, waterDate]);

  if (loading) {
    return (
      <AppShell role="dietitian" title="Danışan detayı" subtitle="Yükleniyor…">
        <div className="dashboard-page" />
      </AppShell>
    );
  }

  if (!client) {
    return (
      <AppShell role="dietitian" title="Danışan detayı" subtitle="Danışan bulunamadı.">
        <div className="dashboard-page" />
      </AppShell>
    );
  }

  return (
    <AppShell
      role="dietitian"
      title={client.name}
      subtitle="Profil, randevu ve öğün bilgileri"
    >
      <div className="dashboard-page">
        <div className="booking-card">
          <h3>{client.name}</h3>
          <p>
            <strong>Email:</strong> {client.email}
          </p>
          <p>
            <strong>Yaş:</strong> {client.profile?.age || "-"}
          </p>
          <p>
            <strong>Cinsiyet:</strong> {client.profile?.gender || "-"}
          </p>
          <p>
            <strong>Boy:</strong> {client.profile?.height || "-"}
          </p>
          <p>
            <strong>Kilo:</strong> {client.profile?.weight || "-"}
          </p>
          <p>
            <strong>BMI:</strong> {client.profile?.bmi || "-"}
          </p>
        </div>

        <div className="dashboard-header" style={{ marginTop: "24px" }}>
          <h2>Günlük su takibi</h2>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--text-muted)" }}>
            Danışanın seçtiği güne ait toplam ve kayıtlar.
          </p>
        </div>

        <div className="booking-card">
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontWeight: 700,
              fontSize: "13px",
              color: "var(--text-soft)",
              marginBottom: "14px",
              maxWidth: "280px",
            }}
          >
            Tarih
            <input
              type="date"
              value={waterDate}
              onChange={(e) => setWaterDate(e.target.value)}
            />
          </label>
          <p style={{ marginBottom: "10px" }}>
            <strong>Toplam:</strong> {waterTotalMl} ml
          </p>
          {waterEntries.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>
              Bu gün için su kaydı yok.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {waterEntries.map((e) => (
                <li
                  key={e._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontWeight: 800, color: "var(--water-deep)" }}>
                    +{e.amountMl} ml
                  </span>
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {new Date(e.createdAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dashboard-header" style={{ marginTop: "24px" }}>
          <h2>Bu Danışanın Randevuları</h2>
        </div>

        {appointments.length === 0 ? (
          <div className="booking-card">
            <p>Bu danışana ait randevu bulunmuyor.</p>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map((appointment) => {
              const dateObj = new Date(appointment.appointmentDate);

              return (
                <div key={appointment._id} className="appointment-card">
                  <h3>{client.name}</h3>
                  <p>
                    <strong>Tarih:</strong>{" "}
                    {dateObj.toLocaleDateString("tr-TR")}
                  </p>
                  <p>
                    <strong>Saat:</strong>{" "}
                    {dateObj.toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>
                    <strong>Durum:</strong> {appointment.status}
                  </p>
                  <p>
                    <strong>Not:</strong> {appointment.note || "-"}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="dashboard-header" style={{ marginTop: "24px" }}>
          <h2>Bu Danışanın Beslenme Günlüğü</h2>
        </div>

        {records.length === 0 ? (
          <div className="booking-card">
            <p>Bu danışana ait öğün kaydı bulunmuyor.</p>
          </div>
        ) : (
          <NutritionDiarySection
            records={records}
            mealTypeLabels={mealTypeLabels}
            variant="full"
            showHeading={false}
            intro={
              <p className="nutrition-diary-intro">
                Tüm geçmiş kayıtlar güne göre listelenir; en yeni gün üstte.
              </p>
            }
          />
        )}
      </div>
    </AppShell>
  );
}

export default ClientDetailPage;