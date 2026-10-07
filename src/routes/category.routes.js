const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createCategorySchema, updateCategorySchema } = require("../schemas/category.schema");
const categoryController = require("../controllers/category.controller");

const router = Router();

router.use(authenticate);

// Waiters/managers/admin can browse categories (needed to build an order);
// only Manager+Admin can manage them.
router.get("/", authorize("admin", "manager", "waiter"), categoryController.listCategories);
router.post(
  "/",
  authorize("manager", "admin"),
  validate(createCategorySchema),
  categoryController.createCategory
);
router.patch(
  "/:id",
  authorize("manager", "admin"),
  validate(updateCategorySchema),
  categoryController.updateCategory
);
router.delete("/:id", authorize("manager", "admin"), categoryController.deleteCategory);

module.exports = router;
