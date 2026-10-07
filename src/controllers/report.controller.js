const { asyncHandler } = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");
const { AppError } = require("../utils/AppError");
const reportService = require("../services/report.service");

function parseDate(value, fallback) {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw AppError.badRequest(`Invalid date: ${value}`);
  }
  return parsed;
}

const dailySales = asyncHandler(async (req, res) => {
  const date = parseDate(req.query.date, new Date());
  const summary = await reportService.getDailySales(date);
  ok(res, summary);
});

const weeklySales = asyncHandler(async (req, res) => {
  const referenceDate = parseDate(req.query.referenceDate, new Date());
  const days = await reportService.getWeeklySales(referenceDate);
  ok(res, days);
});

const monthlySales = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = Number(req.query.year ?? now.getFullYear());
  const month = Number(req.query.month ?? now.getMonth() + 1);
  const days = await reportService.getMonthlySales(year, month);
  ok(res, days);
});

const popularItems = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit ?? 10);
  const items = await reportService.getPopularItems(limit);
  ok(res, items);
});

const leastOrderedItems = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit ?? 10);
  const items = await reportService.getLeastOrderedItems(limit);
  ok(res, items);
});

const tableUsage = asyncHandler(async (_req, res) => {
  const rows = await reportService.getTableUsageReport();
  ok(res, rows);
});

const overview = asyncHandler(async (_req, res) => {
  const summary = await reportService.getOverview();
  ok(res, summary);
});

const customerOrderHistory = asyncHandler(async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const { orders, total } = await reportService.getCustomerOrderHistory(
    req.params.customerId,
    page,
    limit
  );
  ok(res, orders, 200, { page, limit, total });
});

const itemSales = asyncHandler(async (req, res) => {
  const { menuItemId } = req.params;
  const { period = "daily" } = req.query;
  const data = await reportService.getItemSalesTrend(menuItemId, period);
  ok(res, data);
});

module.exports = {
  dailySales,
  weeklySales,
  monthlySales,
  popularItems,
  leastOrderedItems,
  tableUsage,
  overview,
  customerOrderHistory,
  itemSales,
};
