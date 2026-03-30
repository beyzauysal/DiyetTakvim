const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendVerificationEmail } = require("./mail");

const CODE_TTL_MS = 15 * 60 * 1000;

function generateSixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function applyVerificationChallenge(user) {
  const code = generateSixDigitCode();
  user.emailVerificationCodeHash = await bcrypt.hash(code, 10);
  user.emailVerificationExpiresAt = new Date(Date.now() + CODE_TTL_MS);
  user.emailVerificationLastSentAt = new Date();
  await user.save();
  try {
    await sendVerificationEmail({ to: user.email, code });
  } catch (err) {
    console.error("Doğrulama e-postası gönderilemedi:", err.message || err);
    throw err;
  }
}

module.exports = {
  applyVerificationChallenge,
  CODE_TTL_MS,
};
