const path = require("path");
const mongoose = require("mongoose");

try {
  require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
} catch (_) {}

const {
  initRabbitMq,
  closeRabbitMq,
  getRabbitMqChannel,
  isRabbitMqReady,
  getRabbitMqUrl,
} = require("../config/rabbitmq");
const { assertAppointmentEventTopology } = require("../services/rabbitmqTopology");
const { createNotification } = require("../services/notificationService");

async function connectMongo() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI tanımlı değil");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 5,
  });

  console.log("[worker] MongoDB bağlandı");
}

async function handleAppointmentCreatedMessage(raw) {
  let payload;
  try {
    payload = JSON.parse(raw.content.toString("utf8"));
  } catch (err) {
    console.error("[rabbitmq] geçersiz JSON mesajı:", err?.message || err);
    return;
  }

  console.log("RabbitMQ appointment.created event consumed");
  console.log("[rabbitmq] payload:", payload);

  if (payload.eventType !== "APPOINTMENT_CREATED") {
    console.warn(
      `[rabbitmq] beklenmeyen eventType: ${payload.eventType || "(yok)"}`
    );
    return;
  }

  if (!payload.dietitianId || !payload.appointmentId) {
    console.warn("[rabbitmq] dietitianId veya appointmentId eksik, atlanıyor.");
    return;
  }

  await createNotification({
    user: payload.dietitianId,
    type: "appointment_created",
    title: "Yeni randevu oluşturuldu",
    message:
      payload.message ||
      `Takviminize ${payload.appointmentDate || ""} ${payload.appointmentTime || ""} için yeni bir randevu eklendi.`,
    relatedAppointment: payload.appointmentId,
  });

  console.log(
    `[rabbitmq] diyetisyen bildirimi oluşturuldu (dietitianId=${payload.dietitianId})`
  );
}

async function startConsumer() {
  const url = getRabbitMqUrl();
  if (!url) {
    console.error("[worker] RABBITMQ_URL tanımlı değil — consumer başlatılamaz.");
    process.exit(1);
  }

  await connectMongo();
  await initRabbitMq();

  if (!isRabbitMqReady()) {
    console.error("[worker] RabbitMQ bağlantısı kurulamadı.");
    process.exit(1);
  }

  const { queue } = await assertAppointmentEventTopology();
  const ch = getRabbitMqChannel();

  await ch.prefetch(1);

  console.log(`[worker] dinleniyor: queue=${queue}`);

  await ch.consume(
    queue,
    async (msg) => {
      if (!msg) return;

      try {
        await handleAppointmentCreatedMessage(msg);
        ch.ack(msg);
      } catch (err) {
        console.error(
          "[rabbitmq] mesaj işlenirken hata:",
          err?.message || err
        );
        ch.nack(msg, false, false);
      }
    },
    { noAck: false }
  );
}

async function shutdown(signal) {
  console.log(`[worker] kapanıyor (${signal})...`);
  try {
    await closeRabbitMq();
  } catch (_) {}
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startConsumer().catch((err) => {
  console.error("[worker] başlatılamadı:", err?.message || err);
  process.exit(1);
});
