require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const tables = await db.collection('tables').find({}).toArray();
  for (const t of tables) {
    const newVal = t.tableNumber === 0 ? '__parcel__' : String(t.tableNumber);
    await db.collection('tables').updateOne(
      { _id: t._id },
      { $set: { tableNumber: newVal } }
    );
    console.log(`Updated table ${t.tableNumber} -> "${newVal}"`);
  }
  console.log('Migration complete!');
  process.exit(0);
}
run().catch(console.error);
