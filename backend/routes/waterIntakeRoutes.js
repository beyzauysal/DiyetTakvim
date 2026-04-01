const express = require("express");
const router = express.Router();
const WaterEntry = require("../models/WaterEntry");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

function parseDateKey(value) {
  if (!value || typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const d = new Date(`${value.trim()}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : value.trim();
}

async function handleAddWater(req, res) {
  try {
    const rawAmount = Number(req.body.amountMl);
    const dateKey =
      parseDateKey(req.body.date) ||
      (() => {
        const n = new Date();
        const y = n.getFullYear();
        const m = String(n.getMonth() + 1).padStart(2, "0");
        const day = String(n.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      })();

    if (!Number.isFinite(rawAmount) || rawAmount < 25 || rawAmount > 1000) {
      return res.status(400).json({
        message: "amountMl 25 ile 1000 ml arasında olmalıdır.",
      });
    }

    const entry = await WaterEntry.create({
      user: req.user.userId,
      dateKey,
      amountMl: Math.round(rawAmount),
    });

    const entries = await WaterEntry.find({
      user: req.user.userId,
      dateKey,
    }).sort({ createdAt: -1 });

    const totalMl = entries.reduce((s, e) => s + e.amountMl, 0);

    res.status(201).json({
      message: "Su kaydı eklendi.",
      entry,
      totalMl,
      entries,
      dateKey,
    });
  } catch (error) {
    res.status(500).json({
      message: "Su kaydı eklenemedi.",
      error: error.message,
    });
  }
}

router.post("/", authMiddleware, roleMiddleware("client"), handleAddWater);
router.post("/add", authMiddleware, roleMiddleware("client"), handleAddWater);

router.handleAddWater = handleAddWater;

router.get(
  "/daily",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const n = new Date();
      const defaultKey = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
      const dateKey = parseDateKey(req.query.date) || defaultKey;

      const entries = await WaterEntry.find({
        user: req.user.userId,
        dateKey,
      }).sort({ createdAt: -1 });

      const totalMl = entries.reduce((s, e) => s + e.amountMl, 0);

      res.status(200).json({
        message: "Günlük su kaydı getirildi.",
        dateKey,
        totalMl,
        entries,
      });
    } catch (error) {
      res.status(500).json({
        message: "Su kayıtları alınamadı.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/client/:clientId/daily",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await User.findById(clientId).select(
        "linkedDietitian role"
      );

      if (!client || client.role !== "client") {
        return res.status(404).json({
          message: "Danışan bulunamadı.",
        });
      }

      if (String(client.linkedDietitian) !== String(req.user.userId)) {
        return res.status(403).json({
          message: "Bu danışanın su kayıtlarını görüntüleme yetkiniz yok.",
        });
      }

      const n = new Date();
      const defaultKey = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
      const dateKey = parseDateKey(req.query.date) || defaultKey;

      const entries = await WaterEntry.find({
        user: clientId,
        dateKey,
      }).sort({ createdAt: -1 });

      const totalMl = entries.reduce((s, e) => s + e.amountMl, 0);

      res.status(200).json({
        message: "Danışan günlük su kaydı getirildi.",
        dateKey,
        totalMl,
        entries,
      });
    } catch (error) {
      res.status(500).json({
        message: "Su kayıtları alınamadı.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
