const { asyncHandler } = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");
const authService = require("../services/auth.service");

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  ok(res, result);
});

module.exports = { login };
