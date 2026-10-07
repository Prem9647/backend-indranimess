const { MenuItem } = require("../models/MenuItem");
const { OrderItem } = require("../models/OrderItem");
const { Category } = require("../models/Category");
const { AppError } = require("../utils/AppError");

async function assertCategoriesExist(categoryIds) {
  const count = await Category.countDocuments({ _id: { $in: categoryIds } });
  if (count !== categoryIds.length) throw AppError.badRequest("One or more categories do not exist");
}

async function createMenuItem(input) {
  await assertCategoriesExist(input.categoryIds);
  return MenuItem.create(input);
}

async function listMenuItems(filters) {
  const query = {};
  if (filters.categoryId) query.categoryIds = filters.categoryId;
  if (filters.availableOnly) query.isAvailable = true;
  return MenuItem.find(query).sort({ name: 1 });
}

async function updateMenuItem(menuItemId, input) {
  if (input.categoryIds) {
    await assertCategoriesExist(input.categoryIds);
  }
  const menuItem = await MenuItem.findByIdAndUpdate(menuItemId, input, { new: true });
  if (!menuItem) throw AppError.notFound("Menu item not found");
  return menuItem;
}

async function deleteMenuItem(menuItemId) {
  const menuItem = await MenuItem.findByIdAndDelete(menuItemId);
  if (!menuItem) throw AppError.notFound("Menu item not found");
}

module.exports = { createMenuItem, listMenuItems, updateMenuItem, deleteMenuItem };
