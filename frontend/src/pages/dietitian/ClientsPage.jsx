import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import apiClient from "../../api/apiClient";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [pendingClients, setPendingClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/auth/dietitian-clients");
      setClients(response.data.clients || []);
      setPendingClients(response.data.pendingClients || []);
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

  const approveClient = async (clientId) => {
    try {
      setBusyId(clientId);
      await apiClient.post(`/api/auth/client-link/${clientId}/approve`);
      await fetchClients();
    } catch (error) {
      alert(error.response?.data?.message || "Onaylanamadı.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectClient = async (clientId) => {
    if (!window.confirm("Bu danışanın bağlantı isteğini reddetmek istiyor musunuz?")) {
      return;
    }
    try {
      setBusyId(`reject-${clientId}`);
      await apiClient.post(`/api/auth/client-link/${clientId}/reject`);
      await fetchClients();
    } catch (error) {
      alert(error.response?.data?.message || "Reddedilemedi.");
    } finally {
      setBusyId(null);
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
        ) : clients.length === 0 && pendingClients.length === 0 ? (
          <div className="booking-card">
            <p>Henüz size bağlı danışan bulunmuyor.</p>
          </div>
        ) : (
          <>
            {pendingClients.length > 0 ? (
              <div className="appointments-list" style={{ marginBottom: 24 }}>
                <h2 style={{ marginBottom: 12 }}>Onay bekleyen danışanlar</h2>
                {pendingClients.map((client) => (
                  <div key={client.id || client._id} className="appointment-card">
                    <h3>{client.name}</h3>
                    <p>
                      <strong>Email:</strong> {client.email}
                    </p>
                    <p className="water-muted">
                      Bağlantı isteği gönderildi.
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        className="mock-card-btn"
                        disabled={busyId === (client.id || client._id)}
                        onClick={() => approveClient(client.id || client._id)}
                      >
                        {busyId === (client.id || client._id) ? "…" : "Onayla"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busyId === `reject-${client.id || client._id}`}
                        onClick={() => rejectClient(client.id || client._id)}
                      >
                        {busyId === `reject-${client.id || client._id}` ? "…" : "Reddet"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {clients.length > 0 ? (
              <div className="appointments-list">
                <h2 style={{ marginBottom: 12 }}>Bağlı danışanlar</h2>
                {clients.map((client) => (
                  <div key={client.id || client._id} className="appointment-card">
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
                  onClick={() => navigate(`/dietitian/clients/${client.id || client._id}`)}
                >
                  Detayları Gör
                </button>
              </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}

export default ClientsPage;