const { Schema, model } = require("mongoose");

const menuItemSchema = new Schema(
  {
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category", required: true }],
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    isBestseller: { type: Boolean, default: false },
    isVegetarian: { type: Boolean, default: false },
    prepTimeMinutes: { type: Number, min: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ categoryIds: 1 });

const MenuItem = model("MenuItem", menuItemSchema);

module.exports = { MenuItem };
