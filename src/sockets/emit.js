const { getIO } = require("./io");
const { ROOMS } = require("./rooms");

// Payload shape sent to the Kitchen Display. Deliberately minimal —
// no customer/table/waiter/price data. See .claude/skills/authentication
// and .claude/skills/socketio for why this is enforced at the emit site,
// not left to the client to filter.
function emitOrderCreatedToKitchen(payload) {
  getIO().to(ROOMS.KITCHEN).emit("order:created", payload);
}

function emitOrderUpdatedToKitchen(payload) {
  getIO().to(ROOMS.KITCHEN).emit("order:updated", payload);
}

function emitOrderDeliveredToKitchen(orderId) {
  getIO().to(ROOMS.KITCHEN).emit("order:delivered", { orderId });
}

// One item on an order was delivered, but the order itself may still have
// other items outstanding — the Kitchen Display badges this item
// "Delivered" in place rather than removing the whole order (only
// order:delivered above does that, once every item is done).
function emitItemDeliveredToKitchen(orderId, itemId) {
  getIO().to(ROOMS.KITCHEN).emit("order:item-delivered", { orderId, itemId });
}

function emitDashboardEvent(event, payload) {
  getIO().to(ROOMS.DASHBOARD_MANAGER).emit(event, payload);
}

function emitTableStatusChanged(payload) {
  getIO().to(ROOMS.DASHBOARD_MANAGER).emit("table:status-changed", payload);
}

module.exports = {
  emitOrderCreatedToKitchen,
  emitOrderUpdatedToKitchen,
  emitOrderDeliveredToKitchen,
  emitItemDeliveredToKitchen,
  emitDashboardEvent,
  emitTableStatusChanged,
};
