const nodemailer = require("nodemailer");

function stripBom(s) {
  return String(s).replace(/^\uFEFF/, "").trim();
}

function smtpAuth() {
  const user = stripBom(process.env.SMTP_USER || "");
  const rawPass = process.env.SMTP_PASS;
  if (!user || rawPass == null || String(rawPass).trim() === "") return null;
  const pass = stripBom(String(rawPass)).replace(/\s+/g, "");
  return { user, pass };
}

function useGmailService() {
  const h = process.env.SMTP_HOST?.trim().toLowerCase() || "";
  const svc = process.env.SMTP_SERVICE?.trim().toLowerCase() || "";
  return svc === "gmail" || h === "smtp.gmail.com";
}

function createTransport() {
  const auth = smtpAuth();

  if (useGmailService()) {
    if (!auth) return null;
    const opts = {
      service: "gmail",
      auth,
    };
    if (process.env.SMTP_FORCE_IPV4 === "1") {
      opts.family = 4;
    }
    return nodemailer.createTransport(opts);
  }

  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: auth || undefined,
    ...(port === 587 && !secure ? { requireTLS: true } : {}),
    ...(process.env.SMTP_FORCE_IPV4 === "1" ? { family: 4 } : {}),
  });
}

async function deliverMail(mailOptions) {
  const transporter = createTransport();
  if (!transporter) {
    console.warn(`[mail:dev] ${mailOptions.to}\n${mailOptions.text}`);
    return;
  }
  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("[mail] Gönderim hatası:", err.message);
    if (err.code) console.error("[mail] code:", err.code);
    if (err.responseCode != null) console.error("[mail] responseCode:", err.responseCode);
    if (err.response) console.error("[mail] smtp response:", err.response);
    if (err.command) console.error("[mail] command:", err.command);
    throw err;
  }
}

async function sendVerificationEmail({ to, code }) {
  const appName = process.env.APP_NAME || "DiyetTakvim";
  const from =
    process.env.MAIL_FROM || `${appName} <noreply@localhost>`;
  const subject = `${appName} — E-posta doğrulama kodu`;
  const text = `${appName} kaydı için doğrulama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir.`;
  const html = `<p>Merhaba,</p><p><strong>${appName}</strong> kaydı için doğrulama kodunuz:</p><p style="font-size:24px;font-weight:800;letter-spacing:6px">${code}</p><p>Bu kod 15 dakika geçerlidir.</p><p>Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`;

  await deliverMail({ from, to, subject, text, html });
}

async function sendPasswordResetEmail({ to, code }) {
  const appName = process.env.APP_NAME || "DiyetTakvim";
  const from =
    process.env.MAIL_FROM || `${appName} <noreply@localhost>`;
  const subject = `${appName} — Şifre sıfırlama kodu`;
  const text = `${appName} şifre sıfırlama kodunuz: ${code}\n\nBu kod 15 dakika geçerlidir. İsteği siz yapmadıysanız bu e-postayı yok sayın.`;
  const html = `<p>Merhaba,</p><p><strong>${appName}</strong> için şifre sıfırlama kodunuz:</p><p style="font-size:24px;font-weight:800;letter-spacing:6px">${code}</p><p>Bu kod 15 dakika geçerlidir.</p><p>Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`;

  await deliverMail({ from, to, subject, text, html });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  createTransport,
};
