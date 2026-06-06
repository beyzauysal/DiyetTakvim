import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import PendingClientApprovals from "../../components/dietitian/PendingClientApprovals";
import apiClient from "../../api/apiClient";

function PendingApprovalsPage() {
  const [pendingClients, setPendingClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/api/auth/pending-clients");
      setPendingClients(data.pendingClients || []);
    } catch (error) {
      alert(error.response?.data?.message || "Bağlantı istekleri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  return (
    <AppShell
      role="dietitian"
      title="Bağlantı istekleri"
      subtitle="Davet kodunuzla kayıt olan danışanları onaylayın veya reddedin."
    >
      <div className="dashboard-page">
        {loading ? (
          <p>Yükleniyor…</p>
        ) : pendingClients.length === 0 ? (
          <div className="booking-card">
            <p style={{ margin: 0 }}>Şu an onay bekleyen danışan yok.</p>
          </div>
        ) : (
          <PendingClientApprovals
            pendingClients={pendingClients}
            onUpdated={loadPending}
          />
        )}
      </div>
    </AppShell>
  );
}

export default PendingApprovalsPage;
