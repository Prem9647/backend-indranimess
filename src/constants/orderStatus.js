// Item status is the source of truth for what's actually happened to a
// dish; order status (aside from the two explicit staff actions below) is
// derived from it, not manually set. See .claude/skills/restaurant-workflow.
// "cancelled" is a soft-delete — a waiter-cancelled item stays on the order
// (and the Kitchen Display) badged "Cancelled" rather than disappearing, the
// same way a delivered item stays visible rather than vanishing.
const ITEM_STATUSES = ["preparing", "ready", "delivered", "cancelled"];

// created/preparing/partially_delivered/delivered are computed automatically
// from item statuses (see computeOrderStatus). waiting_for_billing only
// happens when the waiter explicitly taps "Request Bill" (order.service.js's
// requestBill) — never automatically. closed only happens when the manager
// generates the bill (generateBill). Once an order reaches either of those
// two, item mutations stop recomputing its status — see assertOrderMutable.
const ORDER_STATUSES = [
  "created",
  "preparing",
  "partially_delivered",
  "delivered",
  "waiting_for_billing",
  "closed",
];

// Pure function of item statuses — an order's status (short of the two
// explicit staff-driven states above) always reflects "how many of this
// order's items have been delivered", so adding a fresh item after the
// order was fully "delivered" correctly drops it back to
// "partially_delivered" rather than leaving a stale "delivered" order with
// an unprepared item still on it.
function computeOrderStatus(items) {
  // Cancelled items are excluded from the denominator entirely — they're
  // neither pending nor delivered, so they shouldn't hold the order in
  // "preparing"/"partially_delivered" nor count against reaching "delivered".
  const activeItems = items.filter((item) => item.status !== "cancelled");
  if (!activeItems.length) return items.length ? "delivered" : "created";

  const deliveredCount = activeItems.filter((item) => item.status === "delivered").length;
  if (deliveredCount === 0) return "preparing";
  if (deliveredCount < activeItems.length) return "partially_delivered";
  return "delivered";
}

module.exports = { ORDER_STATUSES, ITEM_STATUSES, computeOrderStatus };
