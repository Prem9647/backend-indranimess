const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Category = model("Category", categorySchema);

module.exports = { Category };
