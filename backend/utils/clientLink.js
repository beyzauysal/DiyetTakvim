const mongoose = require("mongoose");
const User = require("../models/User");

function mongoIdString(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const s = value.trim();
    return /^[a-f0-9]{24}$/i.test(s) ? s : null;
  }
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (value._id) return mongoIdString(value._id);
  if (value.id) return mongoIdString(value.id);
  const s = String(value).trim();
  return /^[a-f0-9]{24}$/i.test(s) ? s : null;
}

function getAuthUserId(req) {
  return mongoIdString(req?.user?.userId ?? req?.user?.id);
}

async function resolveClientDietitianLink(clientUserOrId) {
  let client = clientUserOrId;

  if (!client || typeof client.role !== "string") {
    const clientId = mongoIdString(clientUserOrId);
    if (!clientId) {
      return {
        ok: false,
        status: 404,
        code: "CLIENT_NOT_FOUND",
        message: "Danışan bulunamadı.",
      };
    }
    client = await User.findById(clientId).select(
      "role linkedDietitian pendingDietitian"
    );
  }

  if (!client || client.role !== "client") {
    return {
      ok: false,
      status: 404,
      code: "CLIENT_NOT_FOUND",
      message: "Danışan bulunamadı.",
    };
  }

  const linkedDietitianId = mongoIdString(client.linkedDietitian);
  const pendingDietitianId = mongoIdString(client.pendingDietitian);

  if (linkedDietitianId) {
    const dietitian = await User.findById(linkedDietitianId).select(
      "name email specialty city inviteCode role availability"
    );

    if (!dietitian || dietitian.role !== "dietitian") {
      return {
        ok: false,
        status: 404,
        code: "LINKED_DIETITIAN_MISSING",
        message:
          "Bağlı diyetisyen hesabı bulunamadı. Diyetisyeninizle yeniden bağlantı kurun.",
        linkedDietitianId,
      };
    }

    return {
      ok: true,
      status: "linked",
      linkedDietitianId,
      dietitian,
    };
  }

  if (pendingDietitianId) {
    const pendingDietitian = await User.findById(pendingDietitianId).select(
      "name email specialty city"
    );

    return {
      ok: false,
      status: 403,
      code: "PENDING_APPROVAL",
      message:
        "Diyetisyeniniz bağlantı isteğinizi henüz onaylamadı. Onay sonrası randevu alabilirsiniz.",
      pendingDietitianId,
      pendingDietitian,
    };
  }

  return {
    ok: false,
    status: 404,
    code: "NO_LINK",
    message:
      "Bağlı diyetisyen bulunamadı. Kayıt olurken geçerli bir davet kodu kullanın.",
  };
}

function sendLinkError(res, linkResult) {
  return res.status(linkResult.status).json({
    message: linkResult.message,
    code: linkResult.code,
    linkedDietitianId: linkResult.linkedDietitianId || null,
    pendingDietitianId: linkResult.pendingDietitianId || null,
  });
}

module.exports = {
  mongoIdString,
  getAuthUserId,
  resolveClientDietitianLink,
  sendLinkError,
};
