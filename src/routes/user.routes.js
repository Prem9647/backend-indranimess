const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createUserSchema, updateUserSchema, resetPasswordSchema } = require("../schemas/user.schema");
const userController = require("../controllers/user.controller");

const router = Router();

// User management (create Manager/Waiter, reset passwords, activate/deactivate) is Admin-only.
router.use(authenticate, authorize("admin"));

router.post("/", validate(createUserSchema), userController.createUser);
router.get("/", userController.listUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", validate(updateUserSchema), userController.updateUser);
router.patch("/:id/reset-password", validate(resetPasswordSchema), userController.resetPassword);

module.exports = router;
