const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createOrderSchema,
  addOrderItemsSchema,
  updateOrderItemQuantitySchema,
  generateBillSchema,
} = require("../schemas/order.schema");
const orderController = require("../controllers/order.controller");

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("waiter", "manager", "admin"),
  validate(createOrderSchema),
  orderController.createOrder
);
router.get("/", authorize("waiter", "manager", "admin"), orderController.listOrders);
router.get("/:id", authorize("waiter", "manager", "admin"), orderController.getOrder);

router.post(
  "/:id/items",
  authorize("waiter", "manager", "admin"),
  validate(addOrderItemsSchema),
  orderController.addOrderItems
);
router.patch(
  "/:id/items/:orderItemId",
  authorize("waiter", "manager", "admin"),
  validate(updateOrderItemQuantitySchema),
  orderController.updateOrderItemQuantity
);
router.delete(
  "/:id/items/:orderItemId",
  authorize("waiter", "manager", "admin"),
  orderController.removeOrderItem
);

// Waiter-facing: delivers this item. Order status is derived from all of
// the order's item statuses (not set directly here) — see
// order.service.js's deliverOrderItem and .claude/skills/restaurant-workflow.
router.post(
  "/:id/items/:orderItemId/deliver",
  authorize("waiter", "manager", "admin"),
  orderController.deliverOrderItem
);

// Generating a bill is Manager-only (Admin can no longer do this) — see
// .claude/skills/restaurant-workflow/skill.md.
router.post(
  "/:id/bill",
  authorize("manager"),
  validate(generateBillSchema),
  orderController.generateBill
);

// Waiter-facing, explicit only — never triggered automatically by item
// delivery (see .claude/skills/restaurant-workflow). Moves the order to
// "waiting_for_billing" for the manager's billing queue; does not generate
// the bill itself — that stays Manager-only above.
router.post("/:id/request-bill", authorize("waiter", "manager", "admin"), orderController.requestBill);

module.exports = router;
