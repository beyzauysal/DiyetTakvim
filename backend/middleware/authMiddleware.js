const jwt = require("jsonwebtoken");
const { mongoIdString } = require("../utils/clientLink");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Yetkisiz erişim. Token bulunamadı.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = mongoIdString(decoded.userId ?? decoded.id);

    if (!userId) {
      return res.status(401).json({
        message: "Geçersiz token: kullanıcı kimliği okunamadı.",
      });
    }

    req.user = {
      ...decoded,
      userId,
      id: userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Geçersiz veya süresi dolmuş token.",
    });
  }
};

module.exports = authMiddleware;
