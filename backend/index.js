/**
 * Vercel Express entrypoint (zero-config).
 * Yerel geliştirme ve Docker için server.js kullanılır.
 */
const express = require("express");
const { app } = require("./createApp");

module.exports = app;
