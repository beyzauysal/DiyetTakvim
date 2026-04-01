const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const Appointment = require("../models/Appointment");
const CalorieRecord = require("../models/CalorieRecord");
const WaterEntry = require("../models/WaterEntry");
const Notification = require("../models/Notification");
const Testimonial = require("../models/Testimonial");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { isProbablyEmail } = require("../utils/phoneNormalize");
const { applyVerificationChallenge } = require("../services/emailVerification");
const { applyPasswordResetChallenge } = require("../services/passwordReset");
const { createNotification } = require("../services/notificationService");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const profilePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `profile-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const profilePhotoUpload = multer({
  storage: profilePhotoStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error("Yalnızca JPEG, PNG veya WebP yükleyebilirsiniz."));
  },
});

function publicUploadUrl(filename) {
  const base =
    process.env.PUBLIC_API_URL ||
    `http://localhost:${process.env.PORT || 5050}`;
  return `${base.replace(/\/$/, "")}/uploads/${filename}`;
}

function tryRemoveLocalProfilePhoto(photoUrl) {
  if (!photoUrl || typeof photoUrl !== "string") return;
  try {
    const marker = "/uploads/";
    const idx = photoUrl.indexOf(marker);
    if (idx === -1) return;
    let name = photoUrl.slice(idx + marker.length).split("?")[0];
    if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return;
    const fp = path.join(uploadDir, path.basename(name));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch {
  }
}

function generateInviteCode(name) {
  const cleanName = name
    .replace(/\s+/g, "")
    .toUpperCase()
    .slice(0, 4);

  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `${cleanName}${randomPart}`;
}

function calculateBmi(height, weight) {
  if (!height || !weight) return null;
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return Number(bmi.toFixed(2));
}

function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      email: user.email || "",
      phone: user.phone || "",
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
}

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
  };
}

async function saveRefreshToken(userId, token) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await RefreshToken.create({
    user: userId,
    token,
    expiresAt,
  });
}

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      inviteCode,
      age,
      gender,
      height,
      weight,
      specialty,
      city,
    } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({
        message: "İsim, şifre ve rol zorunludur.",
      });
    }

    const emailRaw = email != null ? String(email).trim().toLowerCase() : "";
    const emailNorm = emailRaw && isProbablyEmail(emailRaw) ? emailRaw : "";

    if (!emailNorm) {
      return res.status(400).json({
        message: "Geçerli bir e-posta adresi zorunludur.",
      });
    }

    const existingUser = await User.findOne({ email: emailNorm });

    if (existingUser) {
      return res.status(400).json({
        message: "Bu e-posta ile kayıtlı kullanıcı zaten var.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let generatedInviteCode = null;
    let pendingDietitian = null;

    if (role === "dietitian") {
      let isUnique = false;

      while (!isUnique) {
        const newCode = generateInviteCode(name);
        const existingCode = await User.findOne({ inviteCode: newCode });

        if (!existingCode) {
          generatedInviteCode = newCode;
          isUnique = true;
        }
      }
    }

    if (role === "client") {
      if (!inviteCode) {
        return res.status(400).json({
          message: "Danışan kaydı için davet kodu zorunludur.",
        });
      }

      const invite = inviteCode.trim().toUpperCase();
      const dietitianUser = await User.findOne({
        role: "dietitian",
        inviteCode: invite,
      });

      if (!dietitianUser) {
        return res.status(404).json({
          message: "Geçerli bir davet kodu bulunamadı.",
        });
      }

      pendingDietitian = dietitianUser._id;
    }

    const bmi = calculateBmi(height, weight);

    const newUser = new User({
      name,
      email: emailNorm,
      emailVerified: false,
      password: hashedPassword,
      role,
      inviteCode: role === "dietitian" ? generatedInviteCode : undefined,
      inviteCodes: role === "dietitian" && generatedInviteCode ? [generatedInviteCode] : [],
      linkedDietitian: null,
      pendingDietitian: role === "client" ? pendingDietitian : null,
      specialty:
        role === "dietitian" && specialty !== undefined
          ? String(specialty).trim()
          : "",
      city:
        role === "dietitian" && city !== undefined ? String(city).trim() : "",
      profile: {
        age: age || null,
        gender: gender || "",
        height: height || null,
        weight: weight || null,
        bmi,
        photoUrl: "",
      },
    });

    await newUser.save();

    if (role === "client" && pendingDietitian) {
      try {
        await createNotification({
          user: pendingDietitian,
          type: "client_link_request",
          title: "Yeni danışan bağlantı isteği",
          message: `${name} (${emailNorm}) kayıt oldu ve sizinle çalışmak istiyor. Onaylarsanız hesabı bağlanır; reddederseniz danışan bilgilendirilir.`,
          relatedUser: newUser._id,
        });
      } catch (notifErr) {
        console.error("Bağlantı bildirimi:", notifErr.message || notifErr);
      }
    }

    let emailSendFailed = false;
    try {
      await applyVerificationChallenge(newUser);
    } catch (sendErr) {
      emailSendFailed = true;
      console.error("Kayıt sonrası doğrulama e-postası:", sendErr.message || sendErr);
    }

    const clientMsg = emailSendFailed
      ? "Hesabınız oluşturuldu; doğrulama e-postası gönderilemedi. Aşağıdan kodu yeniden isteyin."
      : "Kayıt oluşturuldu. E-postanıza gönderilen 6 haneli kodu girerek adresinizi doğrulayın.";
    const clientExtra =
      role === "client" && pendingDietitian
        ? " Diyetisyeniniz isteği onayladığında bağlantı tamamlanır."
        : "";

    return res.status(201).json({
      message: clientMsg + clientExtra,
      userId: String(newUser._id),
      requiresEmailVerification: true,
      email: emailNorm,
      emailSendFailed,
    });
  } catch (error) {
    res.status(500).json({
      message: "Kayıt sırasında sunucu hatası oluştu.",
      error: error.message,
    });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    const emailRaw =
      req.body.email != null ? String(req.body.email).trim().toLowerCase() : "";
    const codeRaw = req.body.code != null ? String(req.body.code).trim() : "";

    const emailNorm = emailRaw && isProbablyEmail(emailRaw) ? emailRaw : "";
    if (!emailNorm || !/^\d{6}$/.test(codeRaw)) {
      return res.status(400).json({
        message: "Geçerli e-posta ve 6 haneli kod girin.",
      });
    }

    const user = await User.findOne({ email: emailNorm }).select(
      "+emailVerificationCodeHash +emailVerificationExpiresAt"
    );

    if (!user) {
      return res.status(400).json({
        message: "Kod geçersiz veya süresi dolmuş.",
      });
    }

    if (user.emailVerified !== false) {
      return res.status(400).json({
        message: "Bu e-posta adresi zaten doğrulanmış.",
      });
    }

    if (
      !user.emailVerificationCodeHash ||
      !user.emailVerificationExpiresAt ||
      new Date(user.emailVerificationExpiresAt) < new Date()
    ) {
      return res.status(400).json({
        message: "Kod geçersiz veya süresi dolmuş. Yeni kod isteyebilirsiniz.",
      });
    }

    const valid = await bcrypt.compare(codeRaw, user.emailVerificationCodeHash);
    if (!valid) {
      return res.status(400).json({
        message: "Kod hatalı.",
      });
    }

    await User.findByIdAndUpdate(user._id, {
      $set: { emailVerified: true },
      $unset: {
        emailVerificationCodeHash: 1,
        emailVerificationExpiresAt: 1,
        emailVerificationLastSentAt: 1,
      },
    });

    res.status(200).json({
      message: "E-posta adresiniz doğrulandı. Giriş yapabilirsiniz.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Doğrulama sırasında sunucu hatası oluştu.",
      error: error.message,
    });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const emailRaw =
      req.body.email != null ? String(req.body.email).trim().toLowerCase() : "";
    const emailNorm = emailRaw && isProbablyEmail(emailRaw) ? emailRaw : "";

    if (!emailNorm) {
      return res.status(400).json({
        message: "Geçerli bir e-posta adresi girin.",
      });
    }

    const user = await User.findOne({ email: emailNorm }).select(
      "+emailVerificationLastSentAt"
    );

    if (!user) {
      return res.status(200).json({
        message:
          "Bu e-posta ile kayıtlı doğrulanmamış hesap varsa kısa süre içinde kod gönderilir.",
      });
    }

    if (user.emailVerified !== false) {
      return res.status(400).json({
        message: "Bu e-posta adresi zaten doğrulandı. Giriş yapabilirsiniz.",
      });
    }

    const last = user.emailVerificationLastSentAt;
    if (last && Date.now() - new Date(last).getTime() < 60_000) {
      return res.status(429).json({
        message: "Lütfen yeni kod için yaklaşık bir dakika bekleyin.",
      });
    }

    await applyVerificationChallenge(user);

    res.status(200).json({
      message: "Doğrulama kodu e-postanıza gönderildi.",
    });
  } catch (error) {
    console.error("resend-verification:", error.message || error);
    res.status(503).json({
      message: "E-posta gönderilemedi. Bir süre sonra tekrar deneyin.",
    });
  }
});

async function handlePasswordResetCodeRequest(req, res) {
  try {
    const emailRaw =
      req.body.email != null ? String(req.body.email).trim().toLowerCase() : "";
    const emailNorm = emailRaw && isProbablyEmail(emailRaw) ? emailRaw : "";

    if (!emailNorm) {
      return res.status(400).json({
        message: "Geçerli bir e-posta adresi girin.",
      });
    }

    const user = await User.findOne({ email: emailNorm }).select(
      "+passwordResetLastSentAt"
    );

    if (!user) {
      return res.status(200).json({
        message:
          "Bu e-posta ile kayıtlı hesap varsa kısa süre içinde şifre sıfırlama kodu gönderilir.",
      });
    }

    const last = user.passwordResetLastSentAt;
    if (last && Date.now() - new Date(last).getTime() < 60_000) {
      return res.status(429).json({
        message: "Lütfen yeni kod için yaklaşık bir dakika bekleyin.",
      });
    }

    await applyPasswordResetChallenge(user);

    return res.status(200).json({
      message: "Şifre sıfırlama kodu e-postanıza gönderildi.",
    });
  } catch (error) {
    console.error("password-reset request:", error.message || error);
    return res.status(503).json({
      message: "E-posta gönderilemedi. Bir süre sonra tekrar deneyin.",
    });
  }
}

router.post("/forgot-password", handlePasswordResetCodeRequest);
router.post("/resend-password-reset", handlePasswordResetCodeRequest);

router.post("/reset-password", async (req, res) => {
  try {
    const emailRaw =
      req.body.email != null ? String(req.body.email).trim().toLowerCase() : "";
    const codeRaw = req.body.code != null ? String(req.body.code).trim() : "";
    const newPassword =
      req.body.newPassword != null ? String(req.body.newPassword) : "";

    const emailNorm = emailRaw && isProbablyEmail(emailRaw) ? emailRaw : "";
    if (!emailNorm || !/^\d{6}$/.test(codeRaw)) {
      return res.status(400).json({
        message: "Geçerli e-posta ve 6 haneli kod girin.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Yeni şifre en az 6 karakter olmalıdır.",
      });
    }

    const user = await User.findOne({ email: emailNorm }).select(
      "+passwordResetCodeHash +passwordResetExpiresAt"
    );

    if (
      !user ||
      !user.passwordResetCodeHash ||
      !user.passwordResetExpiresAt ||
      new Date(user.passwordResetExpiresAt) < new Date()
    ) {
      return res.status(400).json({
        message: "Kod geçersiz veya süresi dolmuş. Yeni kod isteyebilirsiniz.",
      });
    }

    const valid = await bcrypt.compare(codeRaw, user.passwordResetCodeHash);
    if (!valid) {
      return res.status(400).json({
        message: "Kod hatalı.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, {
      $set: { password: hashedPassword },
      $unset: {
        passwordResetCodeHash: 1,
        passwordResetExpiresAt: 1,
        passwordResetLastSentAt: 1,
      },
    });

    await RefreshToken.deleteMany({ user: user._id });

    res.status(200).json({
      message: "Şifreniz güncellendi. Giriş yapabilirsiniz.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Şifre güncellenirken sunucu hatası oluştu.",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const emailInput = String(email ?? "").trim();

    if (!emailInput || !password || !role) {
      return res.status(400).json({
        message: "E-posta, şifre ve rol zorunludur.",
      });
    }

    const emailNorm = emailInput.toLowerCase();
    if (!isProbablyEmail(emailNorm)) {
      return res.status(400).json({
        message: "Geçerli bir e-posta adresi girin.",
      });
    }

    const user = await User.findOne({ email: emailNorm, role })
      .populate("linkedDietitian", "name email inviteCode specialty city")
      .populate("pendingDietitian", "name email inviteCode specialty city");

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Şifre hatalı.",
      });
    }

    if (
      user.email &&
      user.emailVerified === false
    ) {
      return res.status(403).json({
        message: "E-posta adresinizi doğrulamanız gerekiyor.",
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    await RefreshToken.deleteMany({ user: user._id });
    await saveRefreshToken(user._id, refreshToken);

    res
      .cookie("refreshToken", refreshToken, refreshCookieOptions())
      .status(200)
      .json({
        message: "Giriş başarılı",
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email || null,
          phone: user.phone || null,
          role: user.role,
          inviteCode: user.inviteCode || null,
          linkedDietitian: user.linkedDietitian || null,
          pendingDietitian: user.pendingDietitian || null,
          specialty: user.specialty || "",
          city: user.city || "",
          profile: user.profile,
        },
      });
  } catch (error) {
    res.status(500).json({
      message: "Giriş sırasında sunucu hatası oluştu.",
      error: error.message,
    });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token bulunamadı.",
      });
    }

    const existingToken = await RefreshToken.findOne({ token: refreshToken });

    if (!existingToken) {
      return res.status(401).json({
        message: "Geçersiz refresh token.",
      });
    }

    if (existingToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: existingToken._id });
      return res.status(401).json({
        message: "Refresh token süresi dolmuş.",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decoded.userId)
      .populate("linkedDietitian", "name email inviteCode specialty city")
      .populate("pendingDietitian", "name email inviteCode specialty city");

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    const newAccessToken = createAccessToken(user);

    res.status(200).json({
      message: "Token yenilendi.",
      token: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email || null,
        phone: user.phone || null,
        role: user.role,
        inviteCode: user.inviteCode || null,
        linkedDietitian: user.linkedDietitian || null,
        pendingDietitian: user.pendingDietitian || null,
        specialty: user.specialty || "",
        city: user.city || "",
        profile: user.profile,
      },
    });
  } catch (error) {
    res.status(401).json({
      message: "Refresh işlemi başarısız.",
      error: error.message,
    });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    res
      .clearCookie("refreshToken", refreshCookieOptions())
      .status(200)
      .json({ message: "Çıkış başarılı." });
  } catch (error) {
    res.status(500).json({
      message: "Çıkış sırasında hata oluştu.",
      error: error.message,
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("linkedDietitian", "name email inviteCode specialty city")
      .populate("pendingDietitian", "name email inviteCode specialty city");

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    res.status(200).json({
      message: "Korumalı endpoint çalışıyor",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Kullanıcı bilgisi alınırken hata oluştu.",
      error: error.message,
    });
  }
});

router.post(
  "/client-link/:clientId/approve",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const { clientId } = req.params;
      if (!/^[a-fA-F0-9]{24}$/.test(clientId)) {
        return res.status(400).json({ message: "Geçersiz istek." });
      }

      const client = await User.findById(clientId);
      if (!client || client.role !== "client") {
        return res.status(404).json({ message: "Danışan bulunamadı." });
      }
      if (
        !client.pendingDietitian ||
        client.pendingDietitian.toString() !== String(req.user.userId)
      ) {
        return res.status(403).json({
          message: "Bu danışan sizin için bekleyen bir bağlantı isteğinde değil.",
        });
      }

      await User.findByIdAndUpdate(clientId, {
        $set: { linkedDietitian: req.user.userId },
        $unset: { pendingDietitian: "" },
      });

      const dietitian = await User.findById(req.user.userId).select("name");

      await createNotification({
        user: clientId,
        type: "client_link_approved",
        title: "Diyetisyen bağlantınız onaylandı",
        message: `${dietitian?.name || "Diyetisyeniniz"} sizinle çalışmayı kabul etti. Randevu ve beslenme kayıtlarını kullanabilirsiniz.`,
        relatedUser: req.user.userId,
      });

      await Notification.deleteMany({
        user: req.user.userId,
        type: "client_link_request",
        relatedUser: clientId,
      });

      res.status(200).json({
        message: "Danışan bağlantısı onaylandı.",
        clientId,
      });
    } catch (error) {
      console.error("client-link approve:", error);
      res.status(500).json({
        message: "Onay işlemi başarısız.",
        error: error.message,
      });
    }
  }
);

router.post(
  "/client-link/:clientId/reject",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const { clientId } = req.params;
      if (!/^[a-fA-F0-9]{24}$/.test(clientId)) {
        return res.status(400).json({ message: "Geçersiz istek." });
      }

      const client = await User.findById(clientId);
      if (!client || client.role !== "client") {
        return res.status(404).json({ message: "Danışan bulunamadı." });
      }
      if (
        !client.pendingDietitian ||
        client.pendingDietitian.toString() !== String(req.user.userId)
      ) {
        return res.status(403).json({
          message: "Bu danışan sizin için bekleyen bir bağlantı isteğinde değil.",
        });
      }

      await User.findByIdAndUpdate(clientId, {
        $unset: { pendingDietitian: "" },
      });

      const dietitian = await User.findById(req.user.userId).select("name");

      await createNotification({
        user: clientId,
        type: "client_link_rejected",
        title: "Bağlantı isteği reddedildi",
        message: `${dietitian?.name || "Diyetisyen"} bağlantı isteğinizi kabul etmedi. Farklı bir diyetisyenin davet koduyla yeni kayıt veya destek ile iletişime geçebilirsiniz.`,
        relatedUser: req.user.userId,
      });

      await Notification.deleteMany({
        user: req.user.userId,
        type: "client_link_request",
        relatedUser: clientId,
      });

      res.status(200).json({
        message: "Bağlantı isteği reddedildi.",
        clientId,
      });
    } catch (error) {
      console.error("client-link reject:", error);
      res.status(500).json({
        message: "Red işlemi başarısız.",
        error: error.message,
      });
    }
  }
);

async function handleDeleteAccount(req, res) {
  try {
    const { password } = req.body || {};
    const passwordStr =
      typeof password === "string" ? password : password != null ? String(password) : "";
    if (!passwordStr.trim()) {
      return res.status(400).json({
        message: "Hesabı silmek için şifrenizi göndermelisiniz.",
      });
    }

    const userId = String(req.user.userId || req.user.id || "");
    if (!userId) {
      return res.status(401).json({ message: "Oturum geçersiz." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    if (!user.password) {
      return res.status(500).json({
        message: "Hesap silinemedi: şifre kaydı eksik.",
      });
    }

    const ok = await bcrypt.compare(passwordStr, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Şifre hatalı." });
    }

    const photoUrl = user.profile?.photoUrl || "";

    const appointments = await Appointment.find({
      $or: [{ client: userId }, { dietitian: userId }],
    }).select("_id");
    const appointmentIds = appointments.map((a) => a._id);

    await Notification.deleteMany({
      $or: [
        { user: userId },
        { relatedAppointment: { $in: appointmentIds } },
        { relatedUser: userId },
      ],
    });
    await Appointment.deleteMany({
      $or: [{ client: userId }, { dietitian: userId }],
    });
    await CalorieRecord.deleteMany({
      $or: [{ client: userId }, { dietitian: userId }],
    });
    await WaterEntry.deleteMany({ user: userId });
    await RefreshToken.deleteMany({ user: userId });
    await Testimonial.deleteMany({ user: userId });

    if (user.role === "dietitian") {
      await User.updateMany(
        { linkedDietitian: userId },
        { $set: { linkedDietitian: null } }
      );
      await User.updateMany(
        { pendingDietitian: userId },
        { $unset: { pendingDietitian: "" } }
      );
    }

    tryRemoveLocalProfilePhoto(photoUrl);
    await User.findByIdAndDelete(userId);

    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    res
      .clearCookie("refreshToken", refreshCookieOptions())
      .status(200)
      .json({ message: "Hesabınız ve ilişkili veriler silindi." });
  } catch (error) {
    console.error("delete-account:", error);
    res.status(500).json({
      message: "Hesap silinirken hata oluştu.",
      error: error.message,
    });
  }
}

router.post("/me/delete", authMiddleware, handleDeleteAccount);
router.post("/delete-account", authMiddleware, handleDeleteAccount);
router.delete("/me", authMiddleware, handleDeleteAccount);

router.get(
  "/dietitian-only",
  authMiddleware,
  roleMiddleware("dietitian"),
  (req, res) => {
    res.status(200).json({
      message: "Sadece diyetisyen erişebildi.",
      user: req.user,
    });
  }
);

router.get(
  "/client-only",
  authMiddleware,
  roleMiddleware("client"),
  (req, res) => {
    res.status(200).json({
      message: "Sadece danışan erişebildi.",
      user: req.user,
    });
  }
);

async function handleAvailabilityUpdate(req, res) {
  try {
    const {
      workingDays,
      workStart,
      workEnd,
      breakStart,
      breakEnd,
      slotDuration,
    } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "Kullanıcı bulunamadı.",
      });
    }

    user.availability = {
      workingDays: workingDays || [],
      workStart: workStart || "",
      workEnd: workEnd || "",
      breakStart: breakStart || "",
      breakEnd: breakEnd || "",
      slotDuration: slotDuration || 30,
    };

    await user.save();

    res.status(200).json({
      message: "Çalışma saatleri güncellendi.",
      availability: user.availability,
    });
  } catch (error) {
    res.status(500).json({
      message: "Çalışma saatleri güncellenirken hata oluştu.",
      error: error.message,
    });
  }
}

router.patch(
  "/update-availability",
  authMiddleware,
  roleMiddleware("dietitian"),
  handleAvailabilityUpdate
);

router.post(
  "/availability",
  authMiddleware,
  roleMiddleware("dietitian"),
  handleAvailabilityUpdate
);

router.patch(
  "/update-profile",
  authMiddleware,
  async (req, res) => {
    try {
      const { age, gender, height, weight, avatarEmoji, name } = req.body;

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          message: "Kullanıcı bulunamadı.",
        });
      }

      if (name !== undefined) {
        const trimmed = String(name).trim();
        if (!trimmed) {
          return res.status(400).json({
            message: "Ad soyad boş olamaz.",
          });
        }
        user.name = trimmed;
      }

      const prev = user.profile || {};
      const updatedAge = age !== undefined ? age : prev.age;
      const updatedGender =
        gender !== undefined ? gender : prev.gender || "";
      const updatedHeight =
        height !== undefined ? height : prev.height;
      const updatedWeight =
        weight !== undefined ? weight : prev.weight;
      const updatedEmoji =
        avatarEmoji !== undefined
          ? String(avatarEmoji).trim().slice(0, 8)
          : prev.avatarEmoji || "";

      user.profile = {
        age: updatedAge || null,
        gender: updatedGender || "",
        height: updatedHeight || null,
        weight: updatedWeight || null,
        bmi: calculateBmi(updatedHeight, updatedWeight),
        photoUrl: prev.photoUrl || "",
        avatarEmoji: updatedEmoji,
      };

      await user.save();

      res.status(200).json({
        message: "Profil bilgileri güncellendi.",
        name: user.name,
        profile: user.profile,
      });
    } catch (error) {
      res.status(500).json({
        message: "Profil güncellenirken hata oluştu.",
        error: error.message,
      });
    }
  }
);

router.post(
  "/profile-photo",
  authMiddleware,
  (req, res, next) => {
    profilePhotoUpload.single("photo")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.message || "Dosya yüklenemedi.",
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Fotoğraf seçin.",
        });
      }

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          message: "Kullanıcı bulunamadı.",
        });
      }

      const prev = user.profile || {};
      const url = publicUploadUrl(req.file.filename);

      user.profile = {
        age: prev.age || null,
        gender: prev.gender || "",
        height: prev.height || null,
        weight: prev.weight || null,
        bmi: prev.bmi ?? calculateBmi(prev.height, prev.weight),
        photoUrl: url,
        avatarEmoji: prev.avatarEmoji || "",
      };

      await user.save();

      res.status(200).json({
        message: "Profil fotoğrafı güncellendi.",
        profile: user.profile,
        photoUrl: url,
      });
    } catch (error) {
      res.status(500).json({
        message: "Fotoğraf kaydedilemedi.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/dietitian-clients",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const clients = await User.find({
        role: "client",
        linkedDietitian: req.user.userId,
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