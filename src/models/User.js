const { Schema, model } = require("mongoose");
const { ROLES } = require("../constants/roles");

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = model("User", userSchema);

module.exports = { User };
