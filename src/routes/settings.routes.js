const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { updateSettingsSchema } = require("../schemas/settings.schema");
const settingsController = require("../controllers/settings.controller");

const router = Router();

router.use(authenticate);

router.get("/", authorize("admin", "manager"), settingsController.getSettings);
router.patch(
  "/",
  authorize("admin"),
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

module.exports = router;
