const express = require("express");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

function generateInviteCode(name) {
  const cleanName = name.replace(/\s+/g, "").toUpperCase().slice(0, 4);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${randomPart}`;
}

/**
 * POST /invite-code — Gereksinim: diyetisyen için yeni davet kodu
 */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          message: "Kullanıcı bulunamadı.",
        });
      }

      let code = generateInviteCode(user.name);
      let existing = await User.findOne({ inviteCode: code });

      while (existing) {
        code = generateInviteCode(user.name);
        existing = await User.findOne({ inviteCode: code });
      }

      const prev = (user.inviteCode || "").trim().toUpperCase();
      user.inviteCode = code;
      const list = Array.isArray(user.inviteCodes) ? user.inviteCodes : [];
      const next = new Set(
        list
          .map((c) => (typeof c === "string" ? c.trim().toUpperCase() : ""))
          .filter(Boolean)
      );
      // Eski kodlar geçmiş olarak saklanır (kayıtta kullanılmaz); yeni kod zaten inviteCode alanında durur.
      if (prev) next.add(prev);
      user.inviteCodes = Array.from(next);
      await user.save();

      res.status(200).json({
        message: "Yeni davet kodu oluşturuldu.",
        inviteCode: code,
      });
    } catch (error) {
      res.status(500).json({
        message: "Davet kodu oluşturulamadı.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
