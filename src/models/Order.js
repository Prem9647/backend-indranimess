const { Schema, model } = require("mongoose");
const { ORDER_STATUSES } = require("../constants/orderStatus");

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    tableId: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    seatNumber: { type: String }, // Optional seat identifier for multiple customers at one table
    waiterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, required: true, enum: ORDER_STATUSES, default: "created" },
    totalAmount: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true, default: 0 },
    billGenerated: { type: Boolean, default: false },
    orderedAt: { type: Date, default: Date.now },
    // Set once every current item is delivered — see computeOrderStatus.
    deliveredAt: { type: Date },
    // Set only when the waiter explicitly taps "Request Bill" — never set
    // automatically by item delivery. This is what actually moves status to
    // "waiting_for_billing"; see order.service.js's requestBill.
    billRequestedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

// Dashboard/KDS both filter active orders by status, scoped to a table.
orderSchema.index({ status: 1, tableId: 1 });

const Order = model("Order", orderSchema);

module.exports = { Order };
