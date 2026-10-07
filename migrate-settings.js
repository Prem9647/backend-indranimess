require('dotenv').config();
const mongoose = require('mongoose');
const { RestaurantSettings } = require('./src/models/RestaurantSettings');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const settingsData = {
      restaurantName: "INDRANI MESS",
      address: "7th cross, Bharathi Park Road, Saibaba Colony, Coimbatore",
      phone: "+91 9952774917",
      gstin: "33AGWPJ3247Q47Q1ZN",
      billFooter: "Thank You for Dining with Us! Visit Again 🙏",
    };

    const updated = await RestaurantSettings.findOneAndUpdate(
      {},
      { $set: settingsData },
      { new: true, upsert: true }
    );

    console.log("Settings successfully updated:", updated);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
