import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/auth/dietitian-clients");
      setClients(response.data.clients || []);
    } catch (error) {
      console.error(
        "Danışanlar alınamadı:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.message || "Danışanlar alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <AppShell
      role="dietitian"
      title="Danışanlar"
      subtitle="Size bağlı danışanların listesini buradan görüntüleyebilirsiniz."
    >
      <div className="dashboard-page">
        {loading ? (
          <p>Danışanlar yükleniyor...</p>
        ) : clients.length === 0 ? (
          <div className="booking-card">
            <p>Henüz size bağlı danışan bulunmuyor.</p>
          </div>
        ) : (
          <div className="appointments-list">
            {clients.map((client) => (
              <div key={client._id} className="appointment-card">
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

                <button
                  type="button"
                  onClick={() => navigate(`/dietitian/clients/${client._id}`)}
                >
                  Detayları Gör
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default ClientsPage;