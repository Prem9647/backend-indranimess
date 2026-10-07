const { RestaurantSettings } = require("../models/RestaurantSettings");

// Singleton document — always upsert the first (and only) settings row.
async function getSettings() {
  return RestaurantSettings.findOne();
}

async function updateSettings(input) {
  const settings = await RestaurantSettings.findOneAndUpdate(
    {},
    { $set: input, $setOnInsert: { restaurantName: input.restaurantName ?? "Indrani Mess" } },
    { new: true, upsert: true }
  );
  return settings;
}

module.exports = { getSettings, updateSettings };
