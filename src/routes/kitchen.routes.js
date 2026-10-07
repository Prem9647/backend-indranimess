const { Router } = require("express");
const { getKitchenQueue } = require("../controllers/kitchen.controller");

const router = Router();

// No authenticate() here — the Kitchen Display has no login by design.
router.get("/queue", getKitchenQueue);

module.exports = router;
