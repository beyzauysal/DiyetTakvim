const mongoose = require("mongoose");

function mongoIdString(value) {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (value._id) return String(value._id);
  if (value.id) return String(value.id);
  return String(value);
}

function formatPopulatedUserRef(ref) {
  if (ref == null) return null;

  if (
    typeof ref === "string" ||
    ref instanceof mongoose.Types.ObjectId ||
    !ref.name
  ) {
    const id = mongoIdString(ref);
    return id ? { id } : null;
  }

  const obj = typeof ref.toObject === "function" ? ref.toObject() : ref;
  const id = mongoIdString(obj);

  if (!id) return null;

  return {
    id,
    name: obj.name || "",
    email: obj.email || null,
    inviteCode: obj.inviteCode || null,
    specialty: obj.specialty || "",
    city: obj.city || "",
  };
}

function formatAuthUser(user, { normalizeWaterPrefs } = {}) {
  if (!user) return null;

  const linkedDietitianId = mongoIdString(user.linkedDietitian);
  const pendingDietitianId = mongoIdString(user.pendingDietitian);

  const payload = {
    id: mongoIdString(user._id),
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    role: user.role,
    inviteCode: user.inviteCode || null,
    linkedDietitianId,
    pendingDietitianId,
    linkedDietitian: formatPopulatedUserRef(user.linkedDietitian),
    pendingDietitian: formatPopulatedUserRef(user.pendingDietitian),
    specialty: user.specialty || "",
    city: user.city || "",
    profile: user.profile,
  };

  if (user.role === "client" && typeof normalizeWaterPrefs === "function") {
    payload.waterPreferences = normalizeWaterPrefs(user);
  }

  return payload;
}

module.exports = {
  formatAuthUser,
  formatPopulatedUserRef,
  mongoIdString,
};
