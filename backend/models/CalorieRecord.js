const mongoose = require("mongoose");

const calorieRecordSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dietitian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    mealType: {
      type: String,
      required: true,
      enum: ["kahvalti", "ara_ogun", "ogle", "aksam", "gece"],
    },
    foods: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    totalCalories: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CalorieRecord", calorieRecordSchema);