const express = require("express");
const router = express.Router();
const Testimonial = require("../models/Testimonial");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", async (req, res) => {
  try {
    const testimonials = await Testimonial.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select("text authorName roleLabel createdAt")
      .lean();

    res.status(200).json({ testimonials });
  } catch (error) {
    res.status(500).json({
      message: "Yorumlar alınamadı.",
      error: error.message,
    });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const raw = typeof req.body.text === "string" ? req.body.text.trim() : "";
    if (raw.length < 10 || raw.length > 800) {
      return res.status(400).json({
        message: "Yorum 10–800 karakter arasında olmalıdır.",
      });
    }

    const user = await User.findById(req.user.userId).select("name role");
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const roleLabel = user.role === "dietitian" ? "diyetisyen" : "danışan";

    const doc = await Testimonial.create({
      text: raw,
      authorName: user.name,
      roleLabel,
      user: user._id,
    });

    res.status(201).json({
      message: "Teşekkürler, deneyiminiz paylaşıldı.",
      testimonial: {
        _id: doc._id,
        text: doc.text,
        authorName: doc.authorName,
        roleLabel: doc.roleLabel,
        createdAt: doc.createdAt,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const msg = Object.values(error.errors)
        .map((e) => e.message)
        .join(" ");
      return res.status(400).json({ message: msg || "Geçersiz veri." });
    }
    res.status(500).json({
      message: "Yorum kaydedilemedi.",
      error: error.message,
    });
  }
});

module.exports = router;
