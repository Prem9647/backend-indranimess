const { asyncHandler } = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");
const orderService = require("../services/order.service");

// Public, unauthenticated REST fallback/snapshot for the Kitchen Display —
// same minimized shape as the "kitchen" Socket.IO room. See
// .claude/skills/api-design/skill.md and .claude/skills/socketio/skill.md.
const getKitchenQueue = asyncHandler(async (_req, res) => {
  const queue = await orderService.getKitchenQueue();
  ok(res, queue);
});

module.exports = { getKitchenQueue };
