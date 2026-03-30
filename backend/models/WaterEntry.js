const mongoose = require("mongoose");

const waterEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    amountMl: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
    },
  },
  {
    timestamps: true,
  }
);

waterEntrySchema.index({ user: 1, dateKey: 1, createdAt: -1 });

module.exports = mongoose.model("WaterEntry", waterEntrySchema);
