const { Schema, model } = require("mongoose");

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true, index: true },
  },
  { timestamps: true }
);

const Customer = model("Customer", customerSchema);

module.exports = { Customer };
