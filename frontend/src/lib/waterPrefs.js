export const SIP_PRESETS = [100, 150, 200, 250, 300, 500];

export const LS_SIP = "diyettakvim_water_sip_ml";
export const LS_GOAL = "diyettakvim_water_goal_ml";

export const WATER_PREFS_EVENT = "diyettakvim-water-prefs";

export function todayKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function readWaterSipMl() {
  const s = Number(localStorage.getItem(LS_SIP));
  return SIP_PRESETS.includes(s) ? s : 200;
}

export function readWaterGoalMl() {
  const g = Number(localStorage.getItem(LS_GOAL));
  return Number.isFinite(g) && g >= 500 && g <= 5000 ? g : 2000;
}

export function writeWaterPrefs({ sipMl, goalMl }) {
  if (sipMl != null) {
    const s = Number(sipMl);
    if (SIP_PRESETS.includes(s)) {
      localStorage.setItem(LS_SIP, String(s));
    }
  }
  if (goalMl != null) {
    const g = Math.min(5000, Math.max(500, Number(goalMl) || 2000));
    localStorage.setItem(LS_GOAL, String(g));
  }
  window.dispatchEvent(new CustomEvent(WATER_PREFS_EVENT));
}
