const { Schema, model } = require("mongoose");

// Singleton collection — settings.service.js enforces there's ever only one document.
const restaurantSettingsSchema = new Schema(
  {
    restaurantName: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    gstin: { type: String, trim: true },
    billFooter: { type: String, trim: true },
  },
  { timestamps: true }
);

const RestaurantSettings = model("RestaurantSettings", restaurantSettingsSchema);

module.exports = { RestaurantSettings };
