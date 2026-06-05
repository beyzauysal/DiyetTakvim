const serverless = require("serverless-http");
const { app } = require("./createApp");

module.exports = serverless(app, {
  binary: ["image/*", "application/octet-stream"],
});
