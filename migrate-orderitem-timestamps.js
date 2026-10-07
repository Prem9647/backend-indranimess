require("dotenv").config();
const mongoose = require("mongoose");
const { OrderItem } = require("./src/models/OrderItem");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  const rawItems = await db.collection("orderitems").find({}).toArray();
  console.log(`Found ${rawItems.length} order items in raw collection...`);

  let updatedCount = 0;
  for (const item of rawItems) {
    const objectIdTime = item._id.getTimestamp();
    await db.collection("orderitems").updateOne(
      { _id: item._id },
      { $set: { orderedAt: objectIdTime } }
    );
    updatedCount++;
    console.log(`Set item ${item._id} -> orderedAt: ${objectIdTime.toISOString()}`);
  }

  console.log(`Successfully migrated ${updatedCount} order items to exact ObjectId timestamps!`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
