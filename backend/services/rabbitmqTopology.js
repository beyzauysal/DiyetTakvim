const {
  getRabbitMqChannel,
  getExchangeName,
  getAppointmentCreatedQueueName,
  getAppointmentCreatedRoutingKey,
} = require("../config/rabbitmq");

async function assertAppointmentEventTopology() {
  const ch = getRabbitMqChannel();
  if (!ch) {
    throw new Error("RabbitMQ channel hazır değil");
  }

  const exchange = getExchangeName();
  const queue = getAppointmentCreatedQueueName();
  const routingKey = getAppointmentCreatedRoutingKey();

  await ch.assertExchange(exchange, "topic", { durable: true });
  await ch.assertQueue(queue, { durable: true });
  await ch.bindQueue(queue, exchange, routingKey);

  return { exchange, queue, routingKey };
}

module.exports = {
  assertAppointmentEventTopology,
};
