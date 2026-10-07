const { Table } = require("../models/Table");
const { Order } = require("../models/Order");
const { AppError } = require("../utils/AppError");
const { emitTableStatusChanged } = require("../sockets/emit");

async function createTable(input) {
  const existing = await Table.findOne({ tableNumber: input.tableNumber });
  if (existing) {
    throw AppError.conflict("A table with this number already exists");
  }
  return Table.create(input);
}

// Joins each table's active (non-closed) orders so the admin table list can
// show who's currently seated there and their running orders. A table can
// now carry several concurrent orders (multiple customers sharing/splitting
// the table — see .claude/skills/restaurant-workflow), so this returns an
// array (`currentOrders`) rather than a single order.
async function listTables() {
  const rows = await Table.aggregate([
    { $sort: { tableNumber: 1 } },
    {
      $lookup: {
        from: "orders",
        let: { tableId: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$tableId", "$$tableId"] }, { $ne: ["$status", "closed"] }] } } },
          { $sort: { orderedAt: 1 } },
          {
            $lookup: { from: "users", localField: "waiterId", foreignField: "_id", as: "waiter" },
          },
          { $unwind: { path: "$waiter", preserveNullAndEmptyArrays: true } },
          {
            $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customer" },
          },
          { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
          // Item summary (name + qty) for the waiter floor map card — small
          // enough per order that joining eagerly here beats a second
          // round-trip per card.
          {
            $lookup: {
              from: "orderitems",
              let: { orderId: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$orderId", "$$orderId"] } } },
                { $lookup: { from: "menuitems", localField: "menuItemId", foreignField: "_id", as: "menuItem" } },
                { $unwind: "$menuItem" },
                { $project: { _id: 0, name: "$menuItem.name", quantity: 1, prepTimeMinutes: "$menuItem.prepTimeMinutes", status: 1 } },
              ],
              as: "orderItems",
            },
          },
          {
            $project: {
              _id: 1,
              orderNumber: 1,
              status: 1,
              seatNumber: 1,
              amount: { $ifNull: ["$totalAmount", 0] },
              orderedAt: 1,
              billRequestedAt: 1,
              waiterId: "$waiter._id",
              waiterName: "$waiter.name",
              customerName: "$customer.name",
              items: "$orderItems",
              itemCount: { $size: "$orderItems" },
            },
          },
        ],
        as: "currentOrders",
      },
    },
    {
      $project: {
        tableNumber: 1,
        capacity: 1,
        location: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        currentWaiter: { $first: "$currentOrders.waiterName" },
        currentOrders: 1,
      },
    },
  ]);
  return rows;
}

async function updateTable(tableId, input) {
  const table = await Table.findById(tableId);
  if (!table) throw AppError.notFound("Table not found");
  if (table.tableNumber === "parcel") {
    throw AppError.conflict("The Parcel table is system-managed and cannot be edited");
  }
  Object.assign(table, input);
  await table.save();

  if (input.status) {
    emitTableStatusChanged({ tableId: table.id, status: table.status });
  }
  return table;
}

async function deleteTable(tableId) {
  const table = await Table.findById(tableId);
  if (!table) throw AppError.notFound("Table not found");
  if (table.tableNumber === "parcel") {
    throw AppError.conflict("The Parcel table is system-managed and cannot be deleted");
  }
  const hasActiveOrder = await Order.exists({ tableId, status: { $ne: "closed" } });
  if (hasActiveOrder) {
    throw AppError.conflict("Cannot delete a table with an active order");
  }
  await Table.findByIdAndDelete(tableId);
}

module.exports = { createTable, listTables, updateTable, deleteTable };
