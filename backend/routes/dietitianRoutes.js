const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

function mongoIdString(v) {
  if (v == null) return "";
  if (typeof v === "object" && v !== null) {
    if (mongoose.Types.ObjectId.isValid(v)) return String(v);
    if (typeof v.toString === "function") {
      const s = v.toString();
      if (/^[a-f0-9]{24}$/i.test(s)) return s;
    }
  }
  const s = String(v).trim();
  return /^[a-f0-9]{24}$/i.test(s) ? s : "";
}

function sameMongoId(a, b) {
  const sa = mongoIdString(a);
  const sb = mongoIdString(b);
  if (!sa || !sb) return false;
  try {
    return new mongoose.Types.ObjectId(sa).equals(new mongoose.Types.ObjectId(sb));
  } catch {
    return false;
  }
}

router.post(
  "/",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const { name, specialty, city } = req.body;

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          message: "Kullanıcı bulunamadı.",
        });
      }

      if (name !== undefined && String(name).trim()) {
        user.name = String(name).trim();
      }
      if (specialty !== undefined) {
        user.specialty = String(specialty).trim();
      }
      if (city !== undefined) {
        user.city = String(city).trim();
      }

      await user.save();

      res.status(200).json({
        message: "Diyetisyen profili kaydedildi.",
        dietitian: {
          id: user._id,
          name: user.name,
          email: user.email || null,
          phone: user.phone || null,
          specialty: user.specialty,
          city: user.city,
          inviteCode: user.inviteCode || null,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Profil kaydedilemedi.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/:id/clients",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const paramId = mongoIdString(req.params.id);
      const tokenUserId = mongoIdString(req.user?.userId ?? req.user?.id);
      if (!paramId || !tokenUserId || !sameMongoId(paramId, tokenUserId)) {
        return res.status(403).json({
          message: "Yalnızca kendi danışan listenizi görüntüleyebilirsiniz.",
        });
      }

      const clients = await User.find({
        role: "client",
        linkedDietitian: tokenUserId,
      })
        .select("name email profile createdAt")
        .sort({ createdAt: -1 });

      res.status(200).json({
        message: "Diyetisyene bağlı danışanlar getirildi.",
        clients,
      });
    } catch (error) {
      res.status(500).json({
        message: "Danışanlar alınırken hata oluştu.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
