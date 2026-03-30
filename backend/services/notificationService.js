const Notification = require("../models/Notification");

async function createNotification({
  user,
  type,
  title,
  message,
  relatedAppointment = null,
  relatedUser = null,
}) {
  const notification = new Notification({
    user,
    type,
    title,
    message,
    relatedAppointment,
    relatedUser,
  });

  await notification.save();
  return notification;
}

module.exports = {
  createNotification,
};