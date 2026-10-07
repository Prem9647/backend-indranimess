const { Schema, model } = require("mongoose");
const { ITEM_STATUSES } = require("../constants/orderStatus");

const orderItemSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    quantity: { type: Number, required: true, min: 1 },
    // Price snapshot at order time — never re-join MenuItem.price for billing,
    // menu prices change over time and past invoices must stay accurate.
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    // Each line item is delivered independently of the rest of the order —
    // the order's own status is derived from these (see
    // constants/orderStatus.js's computeOrderStatus). "ready" isn't set by
    // anything yet (no kitchen-side actor exists to set it — the Kitchen
    // Display is deliberately login-free and button-less); it's kept in the
    // enum as a documented next step rather than removed.
    status: { type: String, enum: ITEM_STATUSES, default: "preparing" },
    deliveredAt: { type: Date },
    orderedAt: {
      type: Date,
      default: function () {
        return this._id ? this._id.getTimestamp() : new Date();
      },
    },
  },
  { timestamps: true }
);

orderItemSchema.index({ orderId: 1, menuItemId: 1 });

const OrderItem = model("OrderItem", orderItemSchema);

module.exports = { OrderItem };
