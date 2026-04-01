const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    emailVerified: {
      type: Boolean,
      default: true,
    },

    emailVerificationCodeHash: {
      type: String,
      select: false,
    },

    emailVerificationExpiresAt: {
      type: Date,
      select: false,
    },

    emailVerificationLastSentAt: {
      type: Date,
      select: false,
    },

    passwordResetCodeHash: {
      type: String,
      select: false,
    },

    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },

    passwordResetLastSentAt: {
      type: Date,
      select: false,
    },

    phone: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["dietitian", "client"],
      required: true,
    },

    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },

    inviteCodes: {
      type: [String],
      default: [],
    },

    linkedDietitian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    pendingDietitian: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    specialty: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    availability: {
      type: Object,
      default: {
        workingDays: [],
        workStart: "",
        workEnd: "",
        breakStart: "",
        breakEnd: "",
        slotDuration: 30,
      },
    },

    profile: {
      age: {
        type: Number,
        default: null,
      },
      gender: {
        type: String,
        enum: ["male", "female", "other", ""],
        default: "",
      },
      height: {
        type: Number,
        default: null,
      },
      weight: {
        type: Number,
        default: null,
      },
      bmi: {
        type: Number,
        default: null,
      },
      photoUrl: {
        type: String,
        default: "",
        trim: true,
      },
      avatarEmoji: {
        type: String,
        default: "",
        trim: true,
        maxlength: 8,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);