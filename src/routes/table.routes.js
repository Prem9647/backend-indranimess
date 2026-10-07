const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createTableSchema, updateTableSchema } = require("../schemas/table.schema");
const tableController = require("../controllers/table.controller");

const router = Router();

router.use(authenticate);

// Waiters need to see tables to assign one; Admin and Manager both manage them.
router.get("/", authorize("admin", "manager", "waiter"), tableController.listTables);
router.post("/", authorize("admin", "manager"), validate(createTableSchema), tableController.createTable);
router.patch("/:id", authorize("admin", "manager"), validate(updateTableSchema), tableController.updateTable);
router.delete("/:id", authorize("admin", "manager"), tableController.deleteTable);

module.exports = router;
