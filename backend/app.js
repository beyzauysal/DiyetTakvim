/**
 * Vercel entrypoint — yalnızca Express uygulamasını export eder.
 * app.listen() YOK. Yerel/Docker için server.js kullanın.
 */
const express = require("express");
const { app } = require("./createApp");

module.exports = app;
