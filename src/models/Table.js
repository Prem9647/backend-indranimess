const { Schema, model } = require("mongoose");
const { TABLE_STATUSES } = require("../constants/tableStatus");

const tableSchema = new Schema(
  {
    tableNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true },
    location: { type: String, trim: true, default: "" },
    status: { type: String, required: true, enum: TABLE_STATUSES, default: "available" },
  },
  { timestamps: true }
);

tableSchema.index({ status: 1 });

const Table = model("Table", tableSchema);

module.exports = { Table };
