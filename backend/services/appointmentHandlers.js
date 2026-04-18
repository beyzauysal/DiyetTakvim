const { createNotification } = require("./notificationService");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { timeToMinutes } = require("../utils/appointmentTime");
const {
  invalidateAppointmentCachesForDietitianOnDate,
  invalidateAppointmentCachesForDietitianOnDateMove,
} = require("./appointmentCacheInvalidation");

async function cancelAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Randevu bulunamadı.",
      });
    }

    const isClientOwner = appointment.client.toString() === req.user.userId;
    const isDietitianOwner =
      appointment.dietitian.toString() === req.user.userId;

    if (!isClientOwner && !isDietitianOwner) {
      return res.status(403).json({
        message: "Bu randevuyu iptal etme yetkiniz yok.",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    await invalidateAppointmentCachesForDietitianOnDate(
      appointment.dietitian,
      appointment.appointmentDate
    );

    await createNotification({
      user: appointment.client,
      type: "appointment_cancelled",
      title: "Randevu iptal edildi",
      message: "Randevunuz iptal edildi.",
      relatedAppointment: appointment._id,
    });

    await createNotification({
      user: appointment.dietitian,
      type: "appointment_cancelled",
      title: "Randevu iptal edildi",
      message: "Takviminizdeki bir randevu iptal edildi.",
      relatedAppointment: appointment._id,
    });

    res.status(200).json({
      message: "Randevu iptal edildi.",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Randevu iptal edilirken hata oluştu.",
      error: error.message,
    });
  }
}

async function updateAppointment(req, res) {
  try {
    const { appointmentDate, note } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Randevu bulunamadı.",
      });
    }

    const isClientOwner = appointment.client.toString() === req.user.userId;
    const isDietitianOwner =
      appointment.dietitian.toString() === req.user.userId;

    if (!isClientOwner && !isDietitianOwner) {
      return res.status(403).json({
        message: "Bu randevuyu güncelleme yetkiniz yok.",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        message: "İptal edilmiş randevu güncellenemez.",
      });
    }

    const previousAppointmentAt = new Date(appointment.appointmentDate);

    if (appointmentDate) {
      const appointmentDateObj = new Date(appointmentDate);

      if (isNaN(appointmentDateObj.getTime())) {
        return res.status(400).json({
          message: "Geçersiz randevu tarihi.",
        });
      }

      if (appointmentDateObj <= new Date()) {
        return res.status(400).json({
          message: "Geçmiş tarih veya saat için randevu güncellenemez.",
        });
      }

      const dietitian = await User.findById(appointment.dietitian);

      if (!dietitian || dietitian.role !== "dietitian") {
        return res.status(404).json({
          message: "Geçerli bir diyetisyen bulunamadı.",
        });
      }

      const availability = dietitian.availability || {};
      const {
        workingDays = [],
        workStart = "",
        workEnd = "",
        breakStart = "",
        breakEnd = "",
        slotDuration = 30,
      } = availability;

      if (!workStart || !workEnd || !slotDuration) {
        return res.status(400).json({
          message: "Diyetisyenin çalışma saatleri henüz ayarlanmamış.",
        });
      }

      const dayName = appointmentDateObj.toLocaleDateString("en-US", {
        weekday: "long",
      });

      if (!workingDays.includes(dayName)) {
        return res.status(400).json({
          message: "Diyetisyen seçilen günde çalışmıyor.",
        });
      }

      const appointmentHours = String(appointmentDateObj.getHours()).padStart(
        2,
        "0"
      );
      const appointmentMinutes = String(
        appointmentDateObj.getMinutes()
      ).padStart(2, "0");
      const appointmentTime = `${appointmentHours}:${appointmentMinutes}`;

      const appointmentMinutesValue = timeToMinutes(appointmentTime);
      const workStartMinutes = timeToMinutes(workStart);
      const workEndMinutes = timeToMinutes(workEnd);
      const breakStartMinutes = breakStart ? timeToMinutes(breakStart) : null;
      const breakEndMinutes = breakEnd ? timeToMinutes(breakEnd) : null;

      if (
        appointmentMinutesValue < workStartMinutes ||
        appointmentMinutesValue + slotDuration > workEndMinutes
      ) {
        return res.status(400).json({
          message: "Randevu saati çalışma saatleri dışında.",
        });
      }

      const isBreakTime =
        breakStartMinutes !== null &&
        breakEndMinutes !== null &&
        appointmentMinutesValue < breakEndMinutes &&
        appointmentMinutesValue + slotDuration > breakStartMinutes;

      if (isBreakTime) {
        return res.status(400).json({
          message: "Seçilen saat öğle arasına denk geliyor.",
        });
      }

      const slotRemainder =
        (appointmentMinutesValue - workStartMinutes) % slotDuration;

      if (slotRemainder !== 0) {
        return res.status(400).json({
          message: "Seçilen saat uygun slot yapısına uymuyor.",
        });
      }

      const existingAppointmentForSlot = await Appointment.findOne({
        _id: { $ne: appointment._id },
        dietitian: appointment.dietitian,
        appointmentDate: appointmentDateObj,
        status: { $ne: "cancelled" },
      });

      if (existingAppointmentForSlot) {
        return res.status(400).json({
          message: "Bu saat dolu, lütfen başka bir saat seçin.",
        });
      }

      appointment.appointmentDate = appointmentDateObj;
    }

    if (note !== undefined) {
      appointment.note = note;
    }

    await appointment.save();

    await invalidateAppointmentCachesForDietitianOnDateMove(
      appointment.dietitian,
      previousAppointmentAt,
      appointment.appointmentDate
    );

    await createNotification({
      user: appointment.client,
      type: "appointment_updated",
      title: "Randevu güncellendi",
      message: "Randevunuzun tarih veya saat bilgisi güncellendi.",
      relatedAppointment: appointment._id,
    });

    await createNotification({
      user: appointment.dietitian,
      type: "appointment_updated",
      title: "Randevu güncellendi",
      message: "Takviminizdeki bir randevu güncellendi.",
      relatedAppointment: appointment._id,
    });

    res.status(200).json({
      message: "Randevu güncellendi.",
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Randevu güncellenirken hata oluştu.",
      error: error.message,
    });
  }
}

module.exports = {
  cancelAppointment,
  updateAppointment,
};
