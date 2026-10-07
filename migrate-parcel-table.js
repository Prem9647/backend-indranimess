require('dotenv').config();
const mongoose = require('mongoose');
const { Table } = require('./src/models/Table');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const existing = await Table.findOne({ tableNumber: 0 });
  if (existing) {
    console.log("Parcel table already exists!");
  } else {
    await Table.create({
      tableNumber: 0,
      capacity: 0,
      location: "Takeaway",
      status: "available"
    });
    console.log("Parcel table created successfully!");
  }

  process.exit(0);
}

migrate().catch(console.error);
