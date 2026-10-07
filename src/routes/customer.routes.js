const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createCustomerSchema, updateCustomerSchema } = require("../schemas/customer.schema");
const customerController = require("../controllers/customer.controller");

const router = Router();

router.use(authenticate, authorize("waiter", "manager", "admin"));

router.get("/search", customerController.searchCustomers);
// Manual customer management (list/create/edit) is Manager+Admin only —
// Waiters only ever look customers up by mobile during order creation.
router.get("/", authorize("manager", "admin"), customerController.listCustomers);
router.post("/", authorize("manager", "admin"), validate(createCustomerSchema), customerController.createCustomer);
router.patch(
  "/:id",
  authorize("manager", "admin"),
  validate(updateCustomerSchema),
  customerController.updateCustomer
);
router.get("/:id", customerController.getCustomer);

module.exports = router;
