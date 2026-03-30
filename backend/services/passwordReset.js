const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendPasswordResetEmail } = require("./mail");

const CODE_TTL_MS = 15 * 60 * 1000;

function generateSixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function applyPasswordResetChallenge(user) {
  const code = generateSixDigitCode();
  user.passwordResetCodeHash = await bcrypt.hash(code, 10);
  user.passwordResetExpiresAt = new Date(Date.now() + CODE_TTL_MS);
  user.passwordResetLastSentAt = new Date();
  await user.save();
  try {
    await sendPasswordResetEmail({ to: user.email, code });
  } catch (err) {
    console.error("Şifre sıfırlama e-postası gönderilemedi:", err.message || err);
    throw err;
  }
}

module.exports = {
  applyPasswordResetChallenge,
  CODE_TTL_MS,
};
