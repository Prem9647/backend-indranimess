const { Order } = require("../models/Order");
const { OrderItem } = require("../models/OrderItem");
const { Table } = require("../models/Table");
const { MenuItem } = require("../models/MenuItem");
const { Customer } = require("../models/Customer");
const { RestaurantSettings } = require("../models/RestaurantSettings");
const { AppError } = require("../utils/AppError");
const { generateOrderNumber } = require("../utils/generateOrderNumber");
const { computeOrderStatus } = require("../constants/orderStatus");
const { findOrCreateByMobile } = require("./customer.service");
const {
  emitOrderCreatedToKitchen,
  emitOrderUpdatedToKitchen,
  emitOrderDeliveredToKitchen,
  emitItemDeliveredToKitchen,
  emitDashboardEvent,
  emitTableStatusChanged,
} = require("../sockets/emit");

// An order stays on the Kitchen Display's REST snapshot while any item on
// it still needs preparing/delivering. Once every item is delivered
// (status "delivered"), a fresh snapshot/reconnect shouldn't show it —
// the brief "keep it visible a few seconds" behavior for already-connected
// clients is handled client-side off the emitOrderDeliveredToKitchen event.
const ACTIVE_KITCHEN_STATUSES = ["created", "preparing", "partially_delivered"];

async function priceItems(items) {
  const menuItemIds = items.map((item) => item.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

  if (menuItems.length !== new Set(menuItemIds).size) {
    throw AppError.badRequest("One or more menu items do not exist");
  }

  const menuItemById = new Map(menuItems.map((mi) => [mi.id, mi]));

  return items.map((item) => {
    const menuItem = menuItemById.get(item.menuItemId);
    if (!menuItem) throw AppError.badRequest("One or more menu items do not exist");
    if (!menuItem.isAvailable) {
      throw AppError.conflict(`"${menuItem.name}" is currently unavailable`);
    }
    const subtotal = menuItem.price * item.quantity;
    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      quantity: item.quantity,
      unitPrice: menuItem.price,
      subtotal,
    };
  });
}

// Deliberately minimal (no customer/table/waiter/price data — see
// .claude/skills/socketio) but now carries each item's own status so the
// Kitchen Display can badge a delivered item instead of just disappearing
// it — see .claude/skills/restaurant-workflow.
async function buildKitchenPayload(order) {
  const [items, populatedOrder] = await Promise.all([
    OrderItem.find({ orderId: order._id }).populate("menuItemId", "name"),
    Order.findById(order._id).populate("tableId", "tableNumber"),
  ]);

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderedAt: order.orderedAt,
    tableNumber: populatedOrder?.tableId?.tableNumber ?? null,
    items: items.map((item) => ({
      itemId: item.id,
      name: item.menuItemId?.name || "Deleted Item",
      quantity: item.quantity,
      status: item.status,
      orderedAt: item.orderedAt || item.createdAt || order.orderedAt,
    })),
  };
}

async function createOrder(waiterId, input) {
  const table = await Table.findById(input.tableId);
  if (!table) throw AppError.notFound("Table not found");

  const customer = await findOrCreateByMobile(input.customer.name, input.customer.mobileNumber);
  const pricedItems = await priceItems(input.items);
  const totalAmount = pricedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const ordersToday = await Order.countDocuments({ orderedAt: { $gte: startOfDay } });
  const orderNumber = generateOrderNumber(ordersToday + 1, now);

  const order = await Order.create({
    orderNumber,
    customerId: customer._id,
    tableId: table._id,
    seatNumber: input.seatNumber,
    waiterId,
    status: "created",
    totalAmount,
    discount: 0,
    finalAmount: totalAmount,
    orderedAt: now,
  });

  await OrderItem.insertMany(
    pricedItems.map((item) => ({
      orderId: order._id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      orderedAt: now,
    }))
  );

  // Items start "preparing" immediately, so the order moves out of the
  // transient "created" state in the same request — see computeOrderStatus.
  await recomputeOrderStatus(order);
  await order.save();

  table.status = "occupied";
  await table.save();

  emitOrderCreatedToKitchen(await buildKitchenPayload(order));
  emitDashboardEvent("order:created", { orderId: order.id, orderNumber: order.orderNumber });
  emitTableStatusChanged({ tableId: table.id, status: table.status });

  return getOrderById(order.id);
}

async function getOrderById(orderId) {
  const order = await Order.findById(orderId)
    .populate("customerId", "name mobileNumber")
    .populate("tableId", "tableNumber capacity")
    .populate("waiterId", "name");
  if (!order) throw AppError.notFound("Order not found");

  const items = await OrderItem.find({ orderId: order._id }).populate({
    path: "menuItemId",
    select: "name description categoryIds",
    populate: { path: "categoryIds", select: "name" },
  });
  return { order, items };
}

async function listOrders(filters, page = 1, limit = 20) {
  const query = {};
  if (filters.status) query.status = filters.status;
  else if (filters.excludeClosed) query.status = { $ne: "closed" };
  if (filters.tableId) query.tableId = filters.tableId;

  if (filters.todayOnly) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    query.orderedAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const sortDirection = filters.sort === "asc" ? 1 : -1;

  let ordersQuery = Order.find(query)
    .sort({ orderedAt: sortDirection })
    .populate("customerId", "name mobileNumber")
    .populate("tableId", "tableNumber")
    .populate("waiterId", "name");

  if (limit > 0) {
    ordersQuery = ordersQuery.skip((page - 1) * limit).limit(limit);
  }
  // Waiter dashboard needs each item to offer its own "Deliver" action —
  // opt-in via lean() so other listOrders callers (reports, billing queue)
  // don't pay for the extra OrderItem lookups below.
  if (filters.includeItems) ordersQuery = ordersQuery.lean();

  const [orders, total] = await Promise.all([ordersQuery, Order.countDocuments(query)]);

  if (filters.includeItems && orders.length) {
    const orderIds = orders.map((order) => order._id);
    const items = await OrderItem.find({ orderId: { $in: orderIds } }).populate("menuItemId", "name");
    const itemsByOrder = new Map();
    for (const item of items) {
      const key = item.orderId.toString();
      if (!itemsByOrder.has(key)) itemsByOrder.set(key, []);
      itemsByOrder.get(key).push(item);
    }
    for (const order of orders) {
      order.items = itemsByOrder.get(order._id.toString()) ?? [];
    }
  }

  return { orders, total, page, limit };
}

async function getKitchenQueue() {
  const orders = await Order.find({ status: { $in: ACTIVE_KITCHEN_STATUSES } }).sort({ orderedAt: 1 });
  return Promise.all(orders.map(buildKitchenPayload));
}

// Once the waiter has requested the bill (or the manager has closed it),
// the order is locked — no more items, quantity changes, or deliveries.
// "Add more items" is only ever available before that point; see
// .claude/skills/restaurant-workflow.
function assertOrderMutable(order) {
  if (order.status === "waiting_for_billing" || order.status === "closed") {
    throw AppError.conflict("Order can no longer be changed once billing has been requested");
  }
}

// Order status (short of the two explicit staff actions — requestBill and
// generateBill) is a pure function of item statuses, recomputed after every
// item mutation rather than advanced step-by-step. This is what makes
// "add a new item to an order every existing item was already delivered"
// correctly drop the order back to "partially_delivered" instead of leaving
// a stale "delivered" order with an unprepared item still on it — see
// .claude/skills/restaurant-workflow. Mutates `order` in place (status +
// deliveredAt) but does not save it — callers save once, alongside whatever
// else they changed. Returns whether the status actually changed.
async function recomputeOrderStatus(order) {
  if (order.status === "waiting_for_billing" || order.status === "closed") return false;

  const items = await OrderItem.find({ orderId: order._id }, "status");
  const nextStatus = computeOrderStatus(items);
  if (nextStatus === order.status) return false;

  order.status = nextStatus;
  if (nextStatus === "delivered") order.deliveredAt = new Date();
  return true;
}

async function recalculateOrderTotal(orderId) {
  // Cancelled items keep their own subtotal on record (for history/audit)
  // but never count toward what the customer is actually billed.
  const items = await OrderItem.find({ orderId, status: { $ne: "cancelled" } });
  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  return totalAmount;
}

async function addOrderItems(orderId, input) {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound("Order not found");
  assertOrderMutable(order);

  const pricedItems = await priceItems(input.items);
  const now = new Date();
  await OrderItem.insertMany(
    pricedItems.map((item) => ({
      orderId: order._id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      orderedAt: now,
    }))
  );

  order.totalAmount = await recalculateOrderTotal(order._id);
  order.finalAmount = order.totalAmount - order.discount;
  const statusChanged = await recomputeOrderStatus(order);
  await order.save();

  emitOrderUpdatedToKitchen(await buildKitchenPayload(order));
  emitDashboardEvent("order:updated", { orderId: order.id });
  if (statusChanged) emitDashboardEvent("order:status-changed", { orderId: order.id, status: order.status });
  return getOrderById(order.id);
}

async function updateOrderItemQuantity(orderId, orderItemId, quantity) {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound("Order not found");
  assertOrderMutable(order);

  const item = await OrderItem.findOne({ _id: orderItemId, orderId: order._id });
  if (!item) throw AppError.notFound("Order item not found");
  // A delivered line is frozen — ordering more of the same dish goes
  // through "Add More Items" instead, which creates a fresh line for the
  // kitchen to prepare rather than silently resizing one already served.
  if (item.status === "delivered") {
    throw AppError.conflict("This item has already been delivered — add it again instead of changing its quantity");
  }
  if (item.status === "cancelled") {
    throw AppError.conflict("This item was cancelled — add it again instead of changing its quantity");
  }

  item.quantity = quantity;
  item.subtotal = item.unitPrice * quantity;
  await item.save();

  order.totalAmount = await recalculateOrderTotal(order._id);
  order.finalAmount = order.totalAmount - order.discount;
  await order.save();

  emitOrderUpdatedToKitchen(await buildKitchenPayload(order));
  emitDashboardEvent("order:updated", { orderId: order.id });
  return getOrderById(order.id);
}

// A soft-cancel, not a delete — the item stays on the order (and on the
// Kitchen Display) badged "Cancelled" rather than disappearing without a
// trace, the same way a delivered item stays visible. Idempotent: cancelling
// an already-cancelled item is a no-op.
async function removeOrderItem(orderId, orderItemId, cancelQty = null) {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound("Order not found");
  assertOrderMutable(order);

  const item = await OrderItem.findOne({ _id: orderItemId, orderId: order._id });
  if (!item) throw AppError.notFound("Order item not found");
  if (item.status === "delivered") {
    throw AppError.conflict("Cannot remove an item that has already been delivered");
  }
  if (item.status === "cancelled") {
    return getOrderById(orderId);
  }
  
  const quantityToCancel = cancelQty && cancelQty > 0 && cancelQty < item.quantity ? cancelQty : item.quantity;
  
  if (quantityToCancel === item.quantity) {
    // Cancel the entire item
    item.status = "cancelled";
    await item.save();
  } else {
    // Partial cancellation: reduce original item quantity
    item.quantity -= quantityToCancel;
    item.subtotal = item.quantity * item.unitPrice;
    await item.save();
    
    // Create a new cancelled item to maintain history and kitchen display
    await OrderItem.create({
      orderId: order._id,
      menuItemId: item.menuItemId,
      quantity: quantityToCancel,
      unitPrice: item.unitPrice,
      subtotal: quantityToCancel * item.unitPrice,
      status: "cancelled",
    });
  }

  order.totalAmount = await recalculateOrderTotal(order._id);
  order.finalAmount = order.totalAmount - order.discount;
  const statusChanged = await recomputeOrderStatus(order);
  await order.save();

  emitOrderUpdatedToKitchen(await buildKitchenPayload(order));
  emitDashboardEvent("order:updated", { orderId: order.id });
  if (statusChanged) emitDashboardEvent("order:status-changed", { orderId: order.id, status: order.status });
  return getOrderById(order.id);
}

// Waiter delivers one line item at a time. Item status is independent per
// line; the order's own status is derived from all of them
// (recomputeOrderStatus) rather than jumped to "delivered" here directly —
// an order with 2 of 3 items delivered correctly shows "partially_delivered",
// not "delivered". Idempotent: delivering an already-delivered item is a
// no-op. Does NOT touch billing — requesting the bill is a separate,
// explicit waiter action (requestBill below), never automatic.
async function deliverOrderItem(orderId, orderItemId) {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound("Order not found");
  assertOrderMutable(order);

  const item = await OrderItem.findOne({ _id: orderItemId, orderId: order._id });
  if (!item) throw AppError.notFound("Order item not found");
  if (item.status === "cancelled") {
    throw AppError.conflict("This item was cancelled and cannot be delivered");
  }

  if (item.status !== "delivered") {
    item.status = "delivered";
    item.deliveredAt = new Date();
    await item.save();

    emitDashboardEvent("order:item-delivered", { orderId: order.id, orderItemId: item.id });
    // Kitchen Display keeps the item visible with a "Delivered" badge
    // rather than removing it — see .claude/skills/restaurant-workflow.
    emitItemDeliveredToKitchen(order.id, item.id);

    const statusChanged = await recomputeOrderStatus(order);
    if (statusChanged) {
      await order.save();
      emitDashboardEvent("order:status-changed", { orderId: order.id, status: order.status });
      // Only once every item is delivered does the whole order leave the
      // Kitchen Display (after the client's own short delay) — order.status
      // only just became "delivered" this instant.
      if (order.status === "delivered") emitOrderDeliveredToKitchen(order.id);
    }
  }

  return getOrderById(orderId);
}

async function generateBill(orderId, discount) {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound("Order not found");

  if (order.status !== "waiting_for_billing") {
    throw AppError.conflict("An order must be waiting for billing before a bill can be generated");
  }
  if (discount > order.totalAmount) {
    throw AppError.badRequest("Discount cannot exceed the order total");
  }

  order.discount = discount;
  order.finalAmount = order.totalAmount - discount;
  order.billGenerated = true;
  order.status = "closed";
  order.closedAt = new Date();
  await order.save();

  // A table can now hold several concurrent orders (multiple customers) —
  // only free it once none of them are still active, otherwise closing one
  // customer's bill would wrongly kick every other customer at the table
  // off the floor map.
  const hasOtherActiveOrders = await Order.exists({ tableId: order.tableId, status: { $ne: "closed" } });
  if (!hasOtherActiveOrders) {
    await Table.findByIdAndUpdate(order.tableId, { status: "available" });
    emitTableStatusChanged({ tableId: order.tableId.toString(), status: "available" });
  }
  emitDashboardEvent("order:closed", { orderId: order.id, finalAmount: order.finalAmount });

  return getOrderById(order.id);
}

// The ONLY place billRequestedAt / "waiting_for_billing" gets set — item
// delivery never triggers this automatically (see deliverOrderItem). This
// is the explicit "waiter reviews the order, then taps Request Bill" step
// in the workflow; the manager's billing queue reads this status directly.
// Idempotent: a second tap doesn't reset the original request time.
async function requestBill(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound("Order not found");
  if (order.status === "closed") {
    throw AppError.conflict("Order is already closed");
  }
  if (order.status !== "waiting_for_billing") {
    order.status = "waiting_for_billing";
    order.billRequestedAt = new Date();
    await order.save();
    emitDashboardEvent("order:status-changed", { orderId: order.id, status: order.status });
    emitDashboardEvent("order:bill-requested", { orderId: order.id });
  }
  return getOrderById(order.id);
}

module.exports = {
  createOrder,
  getOrderById,
  listOrders,
  getKitchenQueue,
  addOrderItems,
  removeOrderItem,
  updateOrderItemQuantity,
  deliverOrderItem,
  generateBill,
  requestBill,
};
