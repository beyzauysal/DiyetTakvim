/**
 * Vercel Express entrypoint (resmi zero-config formatı).
 * Yerel geliştirme ve Docker: npm start → server.js
 */
const express = require("express");
const { app } = require("./createApp");

module.exports = app;
