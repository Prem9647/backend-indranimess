const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createMenuItemSchema, updateMenuItemSchema } = require("../schemas/menuItem.schema");
const menuItemController = require("../controllers/menuItem.controller");

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin", "manager", "waiter"), menuItemController.listMenuItems);
router.post(
  "/",
  authorize("manager", "admin"),
  validate(createMenuItemSchema),
  menuItemController.createMenuItem
);
router.patch(
  "/:id",
  authorize("manager", "admin"),
  validate(updateMenuItemSchema),
  menuItemController.updateMenuItem
);
router.delete("/:id", authorize("manager", "admin"), menuItemController.deleteMenuItem);

module.exports = router;
