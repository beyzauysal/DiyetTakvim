function normalizeTurkishMobile(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return null;

  let d = digits;
  if (d.length >= 12 && d.startsWith("90")) {
    d = d.slice(2);
  }
  if (d.startsWith("0")) {
    d = d.slice(1);
  }
  if (d.length > 10) {
    d = d.slice(-10);
  }
  if (d.length === 10 && /^5[0-9]{9}$/.test(d)) {
    return d;
  }
  return null;
}

function isProbablyEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());
}

module.exports = { normalizeTurkishMobile, isProbablyEmail };
