require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const items = await db.collection('menuitems').find({ categoryId: { $exists: true } }).toArray();
  console.log(`Found ${items.length} items to migrate.`);

  for (const item of items) {
    if (item.categoryId && (!item.categoryIds || item.categoryIds.length === 0)) {
      await db.collection('menuitems').updateOne(
        { _id: item._id },
        { 
          $set: { categoryIds: [item.categoryId] },
          $unset: { categoryId: "" }
        }
      );
      console.log(`Migrated ${item.name}`);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
