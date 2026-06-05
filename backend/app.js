/**
 * Vercel uyumluluk katmanı.
 * Bazı deploy'larda /var/task/backend/app.js aranır; geçerli serverless handler export edilir.
 * Asıl Express uygulaması createApp.js içindedir. Yerel/Docker: server.js
 */
module.exports = require("./api/[...all].js");
