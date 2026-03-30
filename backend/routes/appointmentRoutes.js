const { createNotification } = require("../services/notificationService");
const express = require("express");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { timeToMinutes, minutesToTime } = require("../utils/appointmentTime");
const {
  cancelAppointment,
  updateAppointment,
} = require("../services/appointmentHandlers");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const { dietitianId, appointmentDate, note } = req.body;

      if (!dietitianId || !appointmentDate) {
        return res.status(400).json({
          message: "Diyetisyen ve randevu tarihi zorunludur.",
        });
      }

      const dietitian = await User.findById(dietitianId);

      if (!dietitian || dietitian.role !== "dietitian") {
        return res.status(404).json({
          message: "Geçerli bir diyetisyen bulunamadı.",
        });
      }

      const clientUser = await User.findById(req.user.userId);

      if (!clientUser || clientUser.role !== "client") {
        return res.status(404).json({
          message: "Danışan bulunamadı.",
        });
      }

      if (
        !clientUser.linkedDietitian ||
        clientUser.linkedDietitian.toString() !== String(dietitianId)
      ) {
        return res.status(403).json({
          message: "Bu diyetisyen için randevu oluşturma yetkiniz yok.",
        });
      }

      const appointmentDateObj = new Date(appointmentDate);

      if (isNaN(appointmentDateObj.getTime())) {
        return res.status(400).json({
          message: "Geçersiz randevu tarihi.",
        });
      }

      if (appointmentDateObj <= new Date()) {
        return res.status(400).json({
          message: "Geçmiş tarih veya saat için randevu oluşturulamaz.",
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

      const existingAppointmentForClient = await Appointment.findOne({
        dietitian: dietitianId,
        client: req.user.userId,
        appointmentDate: appointmentDateObj,
        status: { $ne: "cancelled" },
      });

      if (existingAppointmentForClient) {
        return res.status(400).json({
          message: "Bu tarih ve saat için zaten randevunuz var.",
        });
      }

      const existingAppointmentForSlot = await Appointment.findOne({
        dietitian: dietitianId,
        appointmentDate: appointmentDateObj,
        status: { $ne: "cancelled" },
      });

      if (existingAppointmentForSlot) {
        return res.status(400).json({
          message: "Bu saat dolu, lütfen başka bir saat seçin.",
        });
      }

      const newAppointment = new Appointment({
        dietitian: dietitianId,
        client: req.user.userId,
        appointmentDate: appointmentDateObj,
        note: note || "",
      });

      await newAppointment.save();

      await createNotification({
        user: req.user.userId,
        type: "appointment_created",
        title: "Randevu oluşturuldu",
        message: "Randevunuz başarıyla oluşturuldu.",
        relatedAppointment: newAppointment._id,
      });

      await createNotification({
        user: dietitianId,
        type: "appointment_created",
        title: "Yeni randevu oluşturuldu",
        message: "Takviminize yeni bir randevu eklendi.",
        relatedAppointment: newAppointment._id,
      });

      res.status(201).json({
        message: "Randevu oluşturuldu.",
        appointment: newAppointment,
      });
    } catch (error) {
      res.status(500).json({
        message: "Randevu oluşturulurken hata oluştu.",
        error: error.message,
      });
    }
  }
);

router.get(
  ["/available-slots", "/availability"],
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          message: "Tarih zorunludur. Örnek: ?date=2026-03-25",
        });
      }

      const clientUser = await User.findById(req.user.userId);

      if (!clientUser || !clientUser.linkedDietitian) {
        return res.status(404).json({
          message: "Bağlı diyetisyen bulunamadı.",
        });
      }

      const dietitian = await User.findById(clientUser.linkedDietitian);

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
        return res.status(200).json({
          message: "Diyetisyenin çalışma saatleri henüz ayarlanmamış.",
          availableSlots: [],
        });
      }

      const selectedDate = new Date(`${date}T00:00:00`);
      const dayName = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      if (!workingDays.includes(dayName)) {
        return res.status(200).json({
          message: "Diyetisyen bu gün çalışmıyor.",
          availableSlots: [],
        });
      }

      const workStartMinutes = timeToMinutes(workStart);
      const workEndMinutes = timeToMinutes(workEnd);
      const breakStartMinutes = breakStart ? timeToMinutes(breakStart) : null;
      const breakEndMinutes = breakEnd ? timeToMinutes(breakEnd) : null;

      const appointments = await Appointment.find({
        dietitian: dietitian._id,
        status: { $ne: "cancelled" },
        appointmentDate: {
          $gte: new Date(`${date}T00:00:00.000Z`),
          $lte: new Date(`${date}T23:59:59.999Z`),
        },
      });

      const bookedTimes = appointments.map((appointment) => {
        const appointmentTime = new Date(appointment.appointmentDate);
        const hours = String(appointmentTime.getHours()).padStart(2, "0");
        const minutes = String(appointmentTime.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      });

      const availableSlots = [];

      for (
        let current = workStartMinutes;
        current + slotDuration <= workEndMinutes;
        current += slotDuration
      ) {
        const slotStart = current;
        const slotEnd = current + slotDuration;

        const isBreakTime =
          breakStartMinutes !== null &&
          breakEndMinutes !== null &&
          slotStart < breakEndMinutes &&
          slotEnd > breakStartMinutes;

        if (isBreakTime) {
          continue;
        }

        const slotTime = minutesToTime(slotStart);

        if (bookedTimes.includes(slotTime)) {
          continue;
        }

        availableSlots.push(slotTime);
      }

      res.status(200).json({
        message: "Uygun saatler getirildi.",
        availableSlots,
      });
    } catch (error) {
      res.status(500).json({
        message: "Uygun saatler alınırken hata oluştu.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/my-appointments",
  authMiddleware,
  roleMiddleware("client"),
  async (req, res) => {
    try {
      const appointments = await Appointment.find({ client: req.user.userId })
        .populate("dietitian", "name email role")
        .sort({ appointmentDate: 1 });

      res.status(200).json({
        message: "Danışan randevuları getirildi.",
        appointments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Randevular alınırken hata oluştu.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/dietitian-appointments",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const appointments = await Appointment.find({ dietitian: req.user.userId })
        .populate("client", "name email role")
        .sort({ appointmentDate: 1 });

      res.status(200).json({
        message: "Diyetisyen randevuları getirildi.",
        appointments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Randevular alınırken hata oluştu.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/daily",
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          message: "date zorunludur. Örnek: ?date=2026-03-27",
        });
      }

      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59.999`);

      const appointments = await Appointment.find({
        dietitian: req.user.userId,
        status: { $ne: "cancelled" },
        appointmentDate: {
          $gte: start,
          $lte: end,
        },
      })
        .populate("client", "name email role")
        .sort({ appointmentDate: 1 });

      res.status(200).json({
        message: "Günlük randevular getirildi.",
        appointments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Randevular alınırken hata oluştu.",
        error: error.message,
      });
    }
  }
);

router.get(
  ["/monthly-summary", "/monthly"],
  authMiddleware,
  roleMiddleware("dietitian"),
  async (req, res) => {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({
          message: "year ve month zorunludur. Örnek: ?year=2026&month=3",
        });
      }

      const parsedYear = Number(year);
      const parsedMonth = Number(month);

      const startDate = new Date(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);

      const appointments = await Appointment.find({
        dietitian: req.user.userId,
        status: { $ne: "cancelled" },
        appointmentDate: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const dailyMap = {};

      appointments.forEach((appointment) => {
        const dateObj = new Date(appointment.appointmentDate);
        const dateKey = `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1
        ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = 0;
        }

        dailyMap[dateKey] += 1;
      });

      const summary = Object.entries(dailyMap).map(([date, count]) => ({
        date,
        count,
      }));

      res.status(200).json({
        message: "Aylık randevu özeti getirildi.",
        summary,
      });
    } catch (error) {
      res.status(500).json({
        message: "Aylık özet alınırken hata oluştu.",
        error: error.message,
      });
    }
  }
);

router.patch("/cancel/:id", authMiddleware, cancelAppointment);

router.patch("/update/:id", authMiddleware, updateAppointment);

/** Gereksinim: PUT /appointments/{id} */
router.put("/:id", authMiddleware, updateAppointment);

/** Gereksinim: DELETE /appointments/{id} */
router.delete("/:id", authMiddleware, cancelAppointment);

module.exports = router;