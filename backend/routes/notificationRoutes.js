const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/authMiddleware");

router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      message: "Tüm bildirimler okundu olarak işaretlendi.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      message: "Bildirimler güncellenemedi.",
      error: error.message,
    });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .populate("relatedAppointment")
      .populate("relatedUser", "name email");

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({
      message: "Bildirimler alınamadı.",
      error: error.message,
    });
  }
});

router.patch("/read/:id", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Bildirim bulunamadı.",
      });
    }

    if (notification.user.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Bu bildirimi güncelleme yetkiniz yok.",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      message: "Bildirim okundu olarak işaretlendi.",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      message: "Bildirim güncellenemedi.",
      error: error.message,
    });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        message: "Bildirim bulunamadı.",
      });
    }

    if (notification.user.toString() !== req.user.userId) {
      return res.status(403).json({
        message: "Bu bildirimi silme yetkiniz yok.",
      });
    }

    await Notification.deleteOne({ _id: req.params.id });

    res.status(200).json({
      message: "Bildirim silindi.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Bildirim silinemedi.",
      error: error.message,
    });
  }
});

module.exports = router;