const mongoose = require("mongoose");

mongoose.set("bufferCommands", false);

let connectPromise = null;

async function ensureMongoConnected() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  if (!process.env.MONGO_URI) {
    const hint = process.env.VERCEL
      ? "Vercel → Settings → Environment Variables → MONGO_URI"
      : "backend/.env → MONGO_URI";
    const err = new Error(`MONGO_URI tanımlı değil. ${hint}`);
    console.error("[mongo]", err.message);
    throw err;
  }

  const connectOptions = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 20000,
    maxPoolSize: 1,
  };

  if (!String(process.env.MONGO_URI).startsWith("mongodb+srv://")) {
    connectOptions.family = 4;
  }

  connectPromise = Promise.race([
    mongoose.connect(process.env.MONGO_URI, connectOptions),
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("MongoDB bağlantı zaman aşımı (8s)")),
        8000
      );
    }),
  ])
    .then(() => mongoose.connection)
    .catch((err) => {
      connectPromise = null;
      console.error("[mongo] bağlantı hatası:", err.message || err);
      throw err;
    });

  return connectPromise;
}

module.exports = {
  ensureMongoConnected,
};
