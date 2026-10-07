const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created } = require("../utils/apiResponse");
const orderService = require("../services/order.service");

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.userId, req.body);
  created(res, order);
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  ok(res, order);
});

const listOrders = asyncHandler(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const tableId = typeof req.query.tableId === "string" ? req.query.tableId : undefined;
  const includeItems = req.query.includeItems === "true";
  const excludeClosed = req.query.excludeClosed === "true";
  const todayOnly = req.query.todayOnly === "true";
  const sort = req.query.sort === "asc" ? "asc" : "desc";
  const page = Number(req.query.page ?? 1);
  const limit = req.query.limit !== undefined ? (req.query.limit === "all" ? 0 : Number(req.query.limit)) : 20;

  const { orders, total } = await orderService.listOrders(
    { status, tableId, includeItems, excludeClosed, todayOnly, sort },
    page,
    limit
  );
  ok(res, orders, 200, { page, limit, total });
});

const addOrderItems = asyncHandler(async (req, res) => {
  const order = await orderService.addOrderItems(req.params.id, req.body);
  ok(res, order);
});

const removeOrderItem = asyncHandler(async (req, res) => {
  const cancelQuantity = req.query.cancelQuantity ? Number(req.query.cancelQuantity) : null;
  const order = await orderService.removeOrderItem(req.params.id, req.params.orderItemId, cancelQuantity);
  ok(res, order);
});

const updateOrderItemQuantity = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderItemQuantity(req.params.id, req.params.orderItemId, req.body.quantity);
  ok(res, order);
});

const deliverOrderItem = asyncHandler(async (req, res) => {
  const order = await orderService.deliverOrderItem(req.params.id, req.params.orderItemId);
  ok(res, order);
});

const generateBill = asyncHandler(async (req, res) => {
  const order = await orderService.generateBill(req.params.id, req.body.discount);
  ok(res, order);
});

const requestBill = asyncHandler(async (req, res) => {
  const order = await orderService.requestBill(req.params.id);
  ok(res, order);
});

module.exports = {
  createOrder,
  getOrder,
  listOrders,
  addOrderItems,
  removeOrderItem,
  updateOrderItemQuantity,
  deliverOrderItem,
  generateBill,
  requestBill,
};
