const amqp = require("amqplib");

const CONNECT_TIMEOUT_MS = 5000;

let connection = null;
let channel = null;
let connectPromise = null;
let explicitlyDisabled = false;

function getRabbitMqUrl() {
  const u = process.env.RABBITMQ_URL;
  return typeof u === "string" ? u.trim() : "";
}

function getExchangeName() {
  return (
    process.env.RABBITMQ_EXCHANGE || "diyettakvim.appointments.exchange"
  ).trim();
}

function getAppointmentCreatedQueueName() {
  return (
    process.env.RABBITMQ_APPOINTMENT_CREATED_QUEUE ||
    "diyettakvim.notification.appointment-created.queue"
  ).trim();
}

function getAppointmentCreatedRoutingKey() {
  return (
    process.env.RABBITMQ_APPOINTMENT_CREATED_ROUTING_KEY || "appointment.created"
  ).trim();
}

function isRabbitMqReady() {
  return Boolean(connection && channel);
}

function isRabbitMqExplicitlyDisabled() {
  return explicitlyDisabled;
}

function getRabbitMqChannel() {
  return channel;
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error(`${label} zaman aşımı (${ms}ms)`)),
        ms
      );
    }),
  ]);
}

async function initRabbitMq() {
  const url = getRabbitMqUrl();
  if (!url) {
    explicitlyDisabled = true;
    console.warn("[rabbitmq] RABBITMQ_URL tanımlı değil — publish/consume atlanır.");
    return;
  }

  if (connection && channel) {
    return;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      connection = await withTimeout(
        amqp.connect(url),
        CONNECT_TIMEOUT_MS,
        "RabbitMQ bağlantısı"
      );
      channel = await connection.createChannel();

      connection.on("error", (err) => {
        console.error("[rabbitmq] connection error:", err?.message || err);
      });

      connection.on("close", () => {
        console.warn("[rabbitmq] bağlantı kapandı.");
        connection = null;
        channel = null;
      });

      channel.on("error", (err) => {
        console.error("[rabbitmq] channel error:", err?.message || err);
      });

      channel.on("close", () => {
        console.warn("[rabbitmq] channel kapandı.");
        channel = null;
      });

      console.log("[rabbitmq] bağlantı kuruldu.");
    } catch (err) {
      console.error("[rabbitmq] bağlantı başarısız:", err?.message || err);
      connection = null;
      channel = null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

async function closeRabbitMq() {
  try {
    if (channel) await channel.close();
  } catch (_) {}

  try {
    if (connection) await connection.close();
  } catch (_) {}

  channel = null;
  connection = null;
}

module.exports = {
  initRabbitMq,
  closeRabbitMq,
  getRabbitMqChannel,
  isRabbitMqReady,
  isRabbitMqExplicitlyDisabled,
  getRabbitMqUrl,
  getExchangeName,
  getAppointmentCreatedQueueName,
  getAppointmentCreatedRoutingKey,
};
