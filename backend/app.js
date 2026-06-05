/**
 * Vercel Express entrypoint (zero-config).
 * Yerel / Docker için server.js kullanılır — app.listen burada yok.
 */
const express = require("express");
const { app } = require("./createApp");

module.exports = app;
