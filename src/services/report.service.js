const { Order } = require("../models/Order");
const { OrderItem } = require("../models/OrderItem");
const { Customer } = require("../models/Customer");

function dayBounds(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// All sales figures are computed from closed orders only — an order isn't
// revenue until it's actually billed and closed.
async function getSalesSummary(startDate, endDate) {
  const result = await Order.aggregate([
    { $match: { status: "closed", closedAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: null, totalSales: { $sum: "$finalAmount" }, orderCount: { $sum: 1 } } },
  ]);
  const summary = result[0] ?? { totalSales: 0, orderCount: 0 };
  return {
    totalSales: summary.totalSales,
    orderCount: summary.orderCount,
    averageOrderValue: summary.orderCount ? summary.totalSales / summary.orderCount : 0,
  };
}

async function getSalesByDay(startDate, endDate) {
  return Order.aggregate([
    { $match: { status: "closed", closedAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$closedAt" } },
        totalSales: { $sum: "$finalAmount" },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", totalSales: 1, orderCount: 1 } },
  ]);
}

async function getDailySales(date = new Date()) {
  const { start, end } = dayBounds(date);
  
  // Cutoff at 5:00 PM (17:00)
  const lunchEnd = new Date(start);
  lunchEnd.setHours(17, 0, 0, 0);

  const [total, lunch, dinner] = await Promise.all([
    getSalesSummary(start, end),
    getSalesSummary(start, lunchEnd),
    getSalesSummary(lunchEnd, end),
  ]);

  return {
    ...total,
    lunchSales: lunch.totalSales,
    dinnerSales: dinner.totalSales,
  };
}

function getWeeklySales(referenceDate = new Date()) {
  const end = dayBounds(referenceDate).end;
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - 6);
  const start = dayBounds(startDate).start;
  return getSalesByDay(start, end);
}

function getMonthlySales(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return getSalesByDay(start, end);
}

async function itemPopularity(limit, sortDirection, startDate, endDate) {
  const orderMatch = { "order.status": "closed" };
  if (startDate || endDate) {
    const range = {};
    if (startDate) range.$gte = startDate;
    if (endDate) range.$lte = endDate;
    orderMatch["order.closedAt"] = range;
  }

  return OrderItem.aggregate([
    // Cancelled items were never actually served — they shouldn't count
    // toward how popular (or unpopular) a dish is.
    { $match: { status: { $ne: "cancelled" } } },
    { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "order" } },
    { $unwind: "$order" },
    { $match: orderMatch },
    { $group: { _id: "$menuItemId", totalQuantity: { $sum: "$quantity" } } },
    { $sort: { totalQuantity: sortDirection } },
    { $limit: limit },
    { $lookup: { from: "menuitems", localField: "_id", foreignField: "_id", as: "menuItem" } },
    { $unwind: "$menuItem" },
    { $project: { _id: 0, menuItemId: "$_id", name: "$menuItem.name", totalQuantity: 1 } },
  ]);
}

function getPopularItems(limit = 10, startDate, endDate) {
  return itemPopularity(limit, -1, startDate, endDate);
}

function getLeastOrderedItems(limit = 10, startDate, endDate) {
  return itemPopularity(limit, 1, startDate, endDate);
}

async function getTableUsageReport(startDate, endDate) {
  const match = { status: "closed" };
  if (startDate || endDate) {
    const range = {};
    if (startDate) range.$gte = startDate;
    if (endDate) range.$lte = endDate;
    match.closedAt = range;
  }

  return Order.aggregate([
    { $match: match },
    { $group: { _id: "$tableId", orderCount: { $sum: 1 }, totalSales: { $sum: "$finalAmount" } } },
    { $lookup: { from: "tables", localField: "_id", foreignField: "_id", as: "table" } },
    { $unwind: "$table" },
    { $sort: { orderCount: -1 } },
    {
      $project: {
        _id: 0,
        tableId: "$_id",
        tableNumber: "$table.tableNumber",
        orderCount: 1,
        totalSales: 1,
      },
    },
  ]);
}

// Lifetime totals plus today's snapshot for the admin dashboard.
async function getOverview() {
  const { start, end } = dayBounds(new Date());
  const todayMatch = { orderedAt: { $gte: start, $lte: end } };

  const [revenueResult, totalOrders, activeOrders, totalClosedOrders, totalCustomers, todayStatusRows, todayCustomerRows] =
    await Promise.all([
      Order.aggregate([
        { $match: { status: "closed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$finalAmount" } } },
      ]),
      Order.countDocuments({}),
      Order.countDocuments({ status: { $ne: "closed" } }),
      Order.countDocuments({ status: "closed" }),
      Customer.countDocuments({}),
      Order.aggregate([{ $match: todayMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: todayMatch },
        { $group: { _id: "$customerId" } },
        { $count: "distinctCustomers" },
      ]),
    ]);

  const statusBreakdownToday = {
    created: 0,
    preparing: 0,
    partially_delivered: 0,
    delivered: 0,
    waiting_for_billing: 0,
    closed: 0,
  };
  for (const row of todayStatusRows) statusBreakdownToday[row._id] = row.count;

  return {
    totalRevenue: revenueResult[0]?.totalRevenue ?? 0,
    totalOrders,
    activeOrders,
    totalClosedOrders,
    totalCustomers,
    todayOrders: Object.values(statusBreakdownToday).reduce((a, b) => a + b, 0),
    todayCustomers: todayCustomerRows[0]?.distinctCustomers ?? 0,
    statusBreakdownToday,
  };
}

async function getCustomerOrderHistory(customerId, page = 1, limit = 20) {
  const query = { customerId, status: "closed" };
  const [orders, total] = await Promise.all([
    Order.find(query)
      .sort({ closedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, total, page, limit };
}

async function getItemSalesTrend(menuItemId, period = "daily", referenceDate = new Date()) {
  const mongoose = require("mongoose");
  const match = { 
    menuItemId: new mongoose.Types.ObjectId(menuItemId),
    status: { $ne: "cancelled" }
  };
  
  const orderMatch = { "order.status": "closed" };
  const endDate = new Date(referenceDate);
  const startDate = new Date(referenceDate);
  
  if (period === "daily") {
    // Last 14 days
    startDate.setDate(startDate.getDate() - 13);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Last 12 months
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }
  
  orderMatch["order.closedAt"] = { $gte: startDate, $lte: endDate };

  const dateFormat = period === "daily" ? "%Y-%m-%d" : "%Y-%m";

  return OrderItem.aggregate([
    { $match: match },
    { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "order" } },
    { $unwind: "$order" },
    { $match: orderMatch },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$order.closedAt" } },
        totalQuantity: { $sum: "$quantity" },
        totalRevenue: { $sum: "$subtotal" },
      }
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", totalQuantity: 1, totalRevenue: 1 } }
  ]);
}

module.exports = {
  getSalesSummary,
  getSalesByDay,
  getDailySales,
  getWeeklySales,
  getMonthlySales,
  getPopularItems,
  getLeastOrderedItems,
  getTableUsageReport,
  getOverview,
  getCustomerOrderHistory,
  getItemSalesTrend,
};
