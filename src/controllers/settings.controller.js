const { asyncHandler } = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");
const settingsService = require("../services/settings.service");

const getSettings = asyncHandler(async (_req, res) => {
  const settings = await settingsService.getSettings();
  ok(res, settings);
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body);
  ok(res, settings);
});

module.exports = { getSettings, updateSettings };
