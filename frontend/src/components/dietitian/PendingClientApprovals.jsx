import { useState } from "react";
import apiClient from "../../api/apiClient";

function clientIdOf(client) {
  return client?.id || client?._id || null;
}

export default function PendingClientApprovals({
  pendingClients,
  onUpdated,
  compact = false,
}) {
  const [busyId, setBusyId] = useState(null);

  if (!pendingClients?.length) {
    return null;
  }

  const approveClient = async (clientId) => {
    try {
      setBusyId(clientId);
      await apiClient.post(`/api/auth/client-link/${clientId}/approve`);
      await onUpdated?.();
    } catch (error) {
      alert(error.response?.data?.message || "Onaylanamadı.");
    } finally {
      setBusyId(null);
    }
  };

  const rejectClient = async (clientId) => {
    if (
      !window.confirm(
        "Bu danışanın bağlantı isteğini reddetmek istediğinize emin misiniz?"
      )
    ) {
      return;
    }
    try {
      setBusyId(`reject-${clientId}`);
      await apiClient.post(`/api/auth/client-link/${clientId}/reject`);
      await onUpdated?.();
    } catch (error) {
      alert(error.response?.data?.message || "Reddedilemedi.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="booking-card"
      style={{
        marginBottom: compact ? 0 : 20,
        border: "2px solid #f59e0b",
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      }}
    >
      <h2 style={{ margin: "0 0 8px", color: "#92400e", fontSize: compact ? 18 : 22 }}>
        Onay bekleyen danışanlar ({pendingClients.length})
      </h2>
      <p style={{ margin: "0 0 16px", color: "#78350f", lineHeight: 1.5 }}>
        Davet kodunuzla kayıt olan danışanları buradan onaylayın. Onaylamadan randevu ve
        kayıt özellikleri açılmaz.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {pendingClients.map((client) => {
          const id = clientIdOf(client);
          return (
            <div
              key={id}
              style={{
                background: "#fff",
                border: "1px solid #fcd34d",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 16 }}>
                {client.name || "Danışan"}
              </p>
              <p style={{ margin: "0 0 12px", color: "var(--text-soft)", fontSize: 14 }}>
                {client.email || "E-posta yok"}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="mock-card-btn"
                  style={{ width: "auto", minWidth: 120 }}
                  disabled={!id || busyId === id}
                  onClick={() => approveClient(id)}
                >
                  {busyId === id ? "Onaylanıyor…" : "Onayla"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "auto", minWidth: 120 }}
                  disabled={!id || busyId === `reject-${id}`}
                  onClick={() => rejectClient(id)}
                >
                  {busyId === `reject-${id}` ? "Reddediliyor…" : "Reddet"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
