require('dotenv').config();
const mongoose = require('mongoose');
const { Order } = require('./src/models/Order');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const orders = await Order.find().sort({ orderedAt: 1 });
    console.log(`Found ${orders.length} orders to process per day.`);

    // Group orders by local date string YYYY-MM-DD
    const ordersByDay = new Map();
    for (const order of orders) {
      const date = new Date(order.orderedAt || order.createdAt || Date.now());
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const dayKey = `${y}-${m}-${d}`;

      if (!ordersByDay.has(dayKey)) {
        ordersByDay.set(dayKey, []);
      }
      ordersByDay.get(dayKey).push(order);
    }

    // Process each day with daily counter starting from 001
    for (const [dayKey, dayOrders] of ordersByDay.entries()) {
      const [y, m, d] = dayKey.split("-");
      for (let seq = 1; seq <= dayOrders.length; seq++) {
        const order = dayOrders[seq - 1];
        const date = new Date(order.orderedAt || order.createdAt || Date.now());
        const seqStr = String(seq).padStart(3, "0");
        const mealTag = date.getHours() < 17 ? "L" : "D";
        const newOrderNumber = `ORD-${y}${m}${d}-${seqStr}${mealTag}`;

        if (order.orderNumber !== newOrderNumber) {
          order.orderNumber = newOrderNumber;
          await order.save();
          console.log(`Updated order ${order._id} on ${dayKey} to ${newOrderNumber}`);
        }
      }
    }

    console.log("Per-day order number migration complete!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
