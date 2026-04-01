const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const CalorieRecord = require("../models/CalorieRecord");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { analyzeMealWithAI } = require("../services/calorieAnalyzer");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error("Yalnızca JPEG, PNG, WebP veya GIF yükleyebilirsiniz."));
  },
});

function optionalMultipartUpload(req, res, next) {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    return upload.single("photo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.message || "Dosya yüklenemedi.",
        });
      }
      next();
    });
  }
  next();
}

function publicUploadUrl(filename) {
  const base =
    process.env.PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 5050}`;
  return `${base.replace(/\/$/, "")}/uploads/${filename}`;
}

function localUploadAbsolutePathFromUrl(urlStr) {
  if (!urlStr || typeof urlStr !== "string") return null;
  let pathname = "";
  try {
    pathname = new URL(urlStr).pathname;
  } catch {
    pathname = urlStr;
  }
  const m = pathname.match(/\/uploads\/([^/?#]+)$/);
  if (!m) return null;
  const name = path.basename(m[1]);
  if (!name || name !== m[1] || name.includes("..")) return null;
  const abs = path.resolve(path.join(uploadDir, name));
  const root = path.resolve(uploadDir);
  if (!abs.startsWith(root + path.sep) && abs !== root) return null;
  return abs;
}

function tryUnlinkQuiet(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Yerel öğün fotoğrafı silinemedi:", err.message || err);
  }
}

async function previewCalorieAnalysis(req, res) {
  try {
    const { mealType, note } = req.body;
    let imageUrl = (req.body.imageUrl || "").trim();

    if (!mealType) {
      return res.status(400).json({
        message: "Öğün tipi zorunludur.",
      });
    }

    const clientUser = await User.findById(req.user.userId);

    if (!clientUser) {
      return res.status(404).json({
        message: "Danışan bulunamadı.",
      });
    }

    if (!clientUser.linkedDietitian) {
      return res.status(400).json({
        message: "Bağlı diyetisyen bulunamadı.",
      });
    }

    let imageForAI = imageUrl || null;

    if (req.file) {
      const buf = fs.readFileSync(req.file.path);
      const b64 = buf.toString("base64");
      const mime = req.file.mimetype || "image/jpeg";
      imageForAI = `data:${mime};base64,${b64}`;
      imageUrl = publicUploadUrl(req.file.filename);
    }

    const noteStr = typeof note === "string" ? note : "";
    if (!noteStr.trim() && !imageForAI) {
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {}
      }
      return res.status(400).json({
        message:
          "Kalori hesabı için en az besin açıklaması veya fotoğraf gerekir.",
      });
    }

    const analysis = await analyzeMealWithAI({
      mealType,
      note: noteStr,
      imageUrl: imageForAI,
    });

    res.status(200).json({
      message: "Kalori hesaplandı. Sonucu kontrol edip kaydedin.",
      foods: analysis.foods,
      totalCalories: analysis.totalCalories,
      imageUrl: imageUrl || "",
    });
  } catch (error) {
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }
    console.error("Kalori önizleme hatası:", error);
    const detail = error.message || String(error);
    res.status(500).json({
      message: `Öğün analizi yapılamadı: ${detail}`,
      error: detail,
    });
  }
}

async function saveCalorieRecordFromPreview(req, res) {
  try {
    const { date, mealType, note, imageUrl, foods, totalCalories } = req.body;

    if (!date || !mealType) {
      return res.status(400).json({
        message: "Tarih ve öğün tipi zorunludur.",
      });
    }

    if (!Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({
        message: "Kayıt için hesaplanmış besin listesi gerekir.",
      });
    }

    const tc = Number(totalCalories);
    if (Number.isNaN(tc) || tc < 0) {
      return res.status(400).json({
        message: "Geçerli bir toplam kalori değeri gerekir.",
      });
    }

    const clientUser = await User.findById(req.user.userId);

    if (!clientUser) {
      return res.status(404).json({
        message: "Danışan bulunamadı.",
      });
    }

    if (!clientUser.linkedDietitian) {
      return res.status(400).json({
        message: "Bağlı diyetisyen bulunamadı.",
      });
    }

    const noteStr = typeof note === "string" ? note : "";
    const imgStr = typeof imageUrl === "string" ? imageUrl.trim() : "";
    const localPhotoPath = localUploadAbsolutePathFromUrl(imgStr);
    const imageUrlToStore = localPhotoPath ? "" : imgStr;

    const newRecord = new CalorieRecord({
      client: clientUser._id,
      dietitian: clientUser.linkedDietitian,
      date,
      mealType,
      foods: foods.map((f) => String(f)),
      note: noteStr || "",
      imageUrl: imageUrlToStore,
      totalCalories: tc,
    });

    await newRecord.save();

    if (localPhotoPath) {
      tryUnlinkQuiet(localPhotoPath);
    }

    res.status(201).json({
      message: "Öğün kaydı oluşturuldu.",
      record: newRecord,
    });
  } catch (error) {
    console.error("Kayıt kaydetme hatası:", error);
    res.status(500).json({
      message: "Kayıt oluşturulamadı.",
      error: error.message,
    });
  }
}

router.get(
  "/meal-setup",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId).select(
        "linkedDietitian pendingDietitian"
      );
      res.status(200).json({
        linkedDietitian: Boolean(user?.linkedDietitian),
        pendingDietitian: Boolean(user?.pendingDietitian),
        openaiKeyConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
      });
    } catch (error) {
      res.status(500).json({ message: "Durum bilgisi alınamadı." });
    }
  }
);

router.post(
  "/preview",
  authMiddleware,
  roleMiddleware("client"),
  optionalMultipartUpload,
  previewCalorieAnalysis
);

router.post(
  "/save",
  authMiddleware,
  roleMiddleware("client"),
  saveCalorieRecordFromPreview
);

router.post(
  "/analyze",
  authMiddleware,
  roleMiddleware("client"),
  (_req, res) => {
    res.status(400).json({
      message:
        "Bu uç nokta kaldırıldı. Önce POST /api/calorie-records/preview ile kalori hesaplayın, ardından POST /api/calorie-records/save ile kaydedin.",
    });
  }
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("client"),
  (_req, res) => {
    res.status(400).json({
      message:
        "Önce /api/calorie-records/preview, sonra /api/calorie-records/save kullanın.",
    });
  }
);

router.get(
  "/my-records",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const records = await CalorieRecord.find({
        client: req.user.userId,
      }).sort({
        date: -1,
        createdAt: -1,
      });

      res.status(200).json({ records });
    } catch (error) {
      console.error("Kayıtlar alınamadı:", error);
      res.status(500).json({
        message: "Kayıtlar alınamadı.",
        error: error.message,
      });
    }
  }
);

const MEAL_TYPES = ["kahvalti", "ara_ogun", "ogle", "aksam", "gece"];

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
        return res.status(400).json({ message: "Geçersiz kayıt kimliği." });
      }

      const record = await CalorieRecord.findById(id);
      if (!record) {
        return res.status(404).json({ message: "Kayıt bulunamadı." });
      }
      if (record.client.toString() !== req.user.userId) {
        return res.status(403).json({
          message: "Bu kaydı düzenleme yetkiniz yok.",
        });
      }

      const { date, mealType, note, imageUrl, foods, totalCalories } = req.body;

      if (date !== undefined) {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ message: "Geçersiz tarih." });
        }
        record.date = d;
      }

      if (mealType !== undefined) {
        if (!MEAL_TYPES.includes(mealType)) {
          return res.status(400).json({ message: "Geçersiz öğün tipi." });
        }
        record.mealType = mealType;
      }

      if (note !== undefined) {
        record.note = typeof note === "string" ? note : "";
      }

      if (imageUrl !== undefined) {
        record.imageUrl = typeof imageUrl === "string" ? imageUrl.trim() : "";
      }

      if (foods !== undefined) {
        if (!Array.isArray(foods)) {
          return res.status(400).json({
            message: "Besin listesi dizi olmalıdır.",
          });
        }
        const cleaned = foods.map((f) => String(f).trim()).filter(Boolean);
        if (cleaned.length === 0) {
          return res.status(400).json({
            message: "En az bir besin satırı gerekir.",
          });
        }
        record.foods = cleaned;
      }

      if (totalCalories !== undefined) {
        const tc = Number(totalCalories);
        if (Number.isNaN(tc) || tc < 0) {
          return res.status(400).json({ message: "Geçersiz kalori değeri." });
        }
        record.totalCalories = tc;
      }

      await record.save();

      res.status(200).json({
        message: "Öğün kaydı güncellendi.",
        record,
      });
    } catch (error) {
      console.error("Kayıt güncellenemedi:", error);
      res.status(500).json({
        message: "Kayıt güncellenemedi.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/client/:clientId",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const { clientId } = req.params;

      const clientUser = await User.findById(clientId);

      if (!clientUser) {
        return res.status(404).json({
          message: "Danışan bulunamadı.",
        });
      }

      if (
        !clientUser.linkedDietitian ||
        clientUser.linkedDietitian.toString() !== req.user.userId
      ) {
        return res.status(403).json({
          message: "Bu danışanın kayıtlarını görüntüleme yetkiniz yok.",
        });
      }

      const records = await CalorieRecord.find({
        client: clientId,
        dietitian: req.user.userId,
      })
        .sort({ date: -1, createdAt: -1 })
        .populate("client", "name email profile");

      res.status(200).json({ records });
    } catch (error) {
      console.error("Danışan kayıtları alınamadı:", error);
      res.status(500).json({
        message: "Danışan kayıtları alınamadı.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
