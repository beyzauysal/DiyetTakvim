import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/apiClient";
import {
  readWaterGoalMl,
  readWaterSipMl,
  WATER_PREFS_EVENT,
} from "../../lib/waterPrefs";
import "./WaterWidget.css";

function MiniWaterGlass({ fillPercent, gradId, clipId, shineId }) {
  const waterTopY = 188 - (fillPercent / 100) * 176;
  const waterH = Math.max(0.5, (fillPercent / 100) * 176);

  return (
    <svg
      className="water-widget-mini-svg"
      viewBox="0 0 120 200"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#004494" />
          <stop offset="45%" stopColor="#0369c9" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d="M28 12 L32 188 Q60 198 88 188 L92 12 Q60 8 28 12 Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect
          x="0"
          y="12"
          width="120"
          height="190"
          fill="rgba(186, 230, 253, 0.5)"
        />
        <rect
          x="0"
          y={waterTopY}
          width="120"
          height={waterH}
          fill={`url(#${gradId})`}
        />
        {fillPercent > 0 && (
          <ellipse
            cx="60"
            cy={waterTopY + 5}
            rx="36"
            ry="6"
            fill="rgba(147, 197, 253, 0.85)"
          />
        )}
        <rect
          x="36"
          y="16"
          width="12"
          height="168"
          fill={`url(#${shineId})`}
          opacity="0.85"
        />
      </g>

      <path
        className="water-widget-mini-rim"
        d="M28 12 L32 188 Q60 198 88 188 L92 12 Q60 8 28 12 Z"
        fill="none"
      />
    </svg>
  );
}

function WaterWidget({ totalMl, onTotalChange, variant = "compact", anchorId }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `wg-grad-${uid}`;
  const clipId = `wg-clip-${uid}`;
  const shineId = `wg-shine-${uid}`;

  const [sipMl, setSipMl] = useState(readWaterSipMl);
  const [goalMl, setGoalMl] = useState(readWaterGoalMl);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSipMl(readWaterSipMl());
      setGoalMl(readWaterGoalMl());
    };
    window.addEventListener(WATER_PREFS_EVENT, sync);
    return () => window.removeEventListener(WATER_PREFS_EVENT, sync);
  }, []);

  const fillPercent = useMemo(
    () => Math.min(100, Math.round((totalMl / goalMl) * 100)),
    [totalMl, goalMl]
  );

  const handleAdd = async () => {
    const amountMl = Math.min(
      1000,
      Math.max(25, Math.round(Number(sipMl)) || 200)
    );
    try {
      setAdding(true);
      await apiClient.post("/api/water-intake/add", { amountMl });
      const { data } = await apiClient.get("/api/water-intake/daily");
      onTotalChange?.(Number(data.totalMl) || 0);
    } catch (e) {
      const serverMsg = e.response?.data?.message;
      const net =
        e.code === "ERR_NETWORK" || e.message === "Network Error"
          ? "Sunucuya bağlanılamadı. API’nin çalıştığından emin olun (geliştirmede genelde `npm run` ile backend 5050)."
          : "";
      alert(
        serverMsg || net || e.message || "Su eklenemedi."
      );
    } finally {
      setAdding(false);
    }
  };

  const waterTopY = 188 - (fillPercent / 100) * 176;
  const waterH = Math.max(0.5, (fillPercent / 100) * 176);

  if (variant === "card") {
    return (
      <div
        id={anchorId || undefined}
        className="dashboard-card dashboard-card--water-teaser water-widget-card-wrap"
      >
        <div className="water-widget-card-main">
          <div className="water-widget-card-copy">
            <h3>Bugünkü su</h3>
            <p className="water-widget-card-amount">
              <span className="water-widget-card-total">{totalMl} ml</span>
              <span className="water-widget-card-sep">/</span>
              <span className="water-widget-card-goal">{goalMl} ml</span>
            </p>
            <div className="water-widget-progress water-widget-progress--card">
              <div
                className="water-widget-progress-bar"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
            <p className="water-widget-card-amount-note">
              <Link to="/client/settings" className="water-widget-settings-link">
                Ayarlar
              </Link>
            </p>
          </div>

          <button
            type="button"
            className="water-widget-mini-glass-btn"
            onClick={handleAdd}
            disabled={adding}
            title={
              adding
                ? "Ekleniyor..."
                : `Su ekle (+${sipMl} ml). Yudum boyutu: Ayarlar.`
            }
            aria-label={`${sipMl} mililitre su ekle`}
          >
            <MiniWaterGlass
              fillPercent={fillPercent}
              gradId={gradId}
              clipId={clipId}
              shineId={shineId}
            />
            <span className="water-widget-mini-glass-label" aria-hidden>
              {adding ? "…" : `+${sipMl}`}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const rootClass =
    variant === "panel"
      ? "water-widget water-widget--panel"
      : "water-widget";

  return (
    <div className={rootClass}>
      <div className="water-widget-textblock">
        <p className="water-widget-kicker">Bugünkü su</p>

        <p className="water-widget-amount">
          <strong>{totalMl}</strong>
          <span className="water-widget-sep">/</span>
          <span className="water-widget-goal">{goalMl} ml</span>
        </p>

        <div className="water-widget-progress">
          <div
            className="water-widget-progress-bar"
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        <p className="water-widget-footer">
          Yudum boyutu: <strong>{sipMl} ml</strong> —{" "}
          <Link to="/client/settings" className="water-widget-settings-link">
            Ayarlardan değiştir
          </Link>
        </p>
      </div>

      <button
        type="button"
        className="water-widget-glass"
        onClick={handleAdd}
        disabled={adding}
        title={`Bardaa tıkla — +${sipMl} ml`}
        aria-label={`${sipMl} mililitre su ekle`}
      >
        <div className="water-widget-svg-wrap">
          <svg
            className="water-widget-svg"
            viewBox="0 0 120 200"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#004494" />
                <stop offset="45%" stopColor="#0369c9" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id={shineId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="35%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <clipPath id={clipId}>
                <path d="M28 12 L32 188 Q60 198 88 188 L92 12 Q60 8 28 12 Z" />
              </clipPath>
            </defs>

            <g clipPath={`url(#${clipId})`}>
              <rect
                x="0"
                y="12"
                width="120"
                height="190"
                fill="rgba(186, 230, 253, 0.45)"
              />
              <rect
                x="0"
                y={waterTopY}
                width="120"
                height={Math.max(0.5, waterH)}
                fill={`url(#${gradId})`}
              />
              {fillPercent > 0 && (
                <ellipse
                  cx="60"
                  cy={waterTopY + 5}
                  rx="36"
                  ry="6"
                  fill="rgba(147, 197, 253, 0.85)"
                />
              )}
              <rect
                x="36"
                y="16"
                width="12"
                height="168"
                fill={`url(#${shineId})`}
                opacity="0.85"
              />
            </g>

            <path
              className="water-widget-rim"
              d="M28 12 L32 188 Q60 198 88 188 L92 12 Q60 8 28 12 Z"
              fill="none"
            />
          </svg>
        </div>
        <span className="water-widget-cta">
          {adding ? "Ekleniyor..." : `+ ${sipMl} ml`}
        </span>
      </button>
    </div>
  );
}

export default WaterWidget;
