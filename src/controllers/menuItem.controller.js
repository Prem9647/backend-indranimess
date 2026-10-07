const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created, noContent } = require("../utils/apiResponse");
const menuItemService = require("../services/menuItem.service");

const createMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await menuItemService.createMenuItem(req.body);
  created(res, menuItem);
});

const listMenuItems = asyncHandler(async (req, res) => {
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const availableOnly = req.query.availableOnly === "true";
  const menuItems = await menuItemService.listMenuItems({ categoryId, availableOnly });
  ok(res, menuItems);
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await menuItemService.updateMenuItem(req.params.id, req.body);
  ok(res, menuItem);
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  await menuItemService.deleteMenuItem(req.params.id);
  noContent(res);
});

module.exports = { createMenuItem, listMenuItems, updateMenuItem, deleteMenuItem };
