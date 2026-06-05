const {
  initRabbitMq,
  isRabbitMqReady,
  getRabbitMqChannel,
  getExchangeName,
  getAppointmentCreatedRoutingKey,
} = require("../config/rabbitmq");
const { assertAppointmentEventTopology } = require("./rabbitmqTopology");

function formatAppointmentDate(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatAppointmentTime(dateObj) {
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

async function publishAppointmentCreatedEvent({
  appointment,
  clientName = "",
}) {
  try {
    await initRabbitMq();
    if (!isRabbitMqReady()) {
      console.warn(
        "[rabbitmq] publish atlandı — bağlantı yok (appointment.created)."
      );
      return false;
    }

    await assertAppointmentEventTopology();

    const appointmentDateObj = new Date(appointment.appointmentDate);
    const appointmentDate = formatAppointmentDate(appointmentDateObj);
    const appointmentTime = formatAppointmentTime(appointmentDateObj);
    const createdAt = appointment.createdAt
      ? new Date(appointment.createdAt).toISOString()
      : new Date().toISOString();

    const messageText = clientName
      ? `${clientName} adlı danışan ${appointmentDate} ${appointmentTime} için randevu oluşturdu.`
      : `Danışan ${appointmentDate} ${appointmentTime} için randevu oluşturdu.`;

    const payload = {
      eventType: "APPOINTMENT_CREATED",
      appointmentId: String(appointment._id),
      dietitianId: String(appointment.dietitian),
      clientId: String(appointment.client),
      appointmentDate,
      appointmentTime,
      message: messageText,
      createdAt,
    };

    const exchange = getExchangeName();
    const routingKey = getAppointmentCreatedRoutingKey();

    const ch = getRabbitMqChannel();

    ch.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        contentType: "application/json",
        persistent: true,
        timestamp: Date.now(),
      }
    );

    console.log(
      `[rabbitmq] published: ${routingKey} → ${exchange} (appointmentId=${payload.appointmentId})`
    );
    return true;
  } catch (err) {
    console.error(
      "[rabbitmq] publish hatası (appointment.created):",
      err?.message || err
    );
    return false;
  }
}

module.exports = {
  publishAppointmentCreatedEvent,
};
