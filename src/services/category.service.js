const { Category } = require("../models/Category");
const { MenuItem } = require("../models/MenuItem");
const { AppError } = require("../utils/AppError");

async function createCategory(input) {
  const existing = await Category.findOne({ name: input.name });
  if (existing) {
    throw AppError.conflict("A category with this name already exists");
  }
  return Category.create(input);
}

// Joins each category's menu item count so the admin Menu page can show
// "Total Items" per category without a separate round-trip per row.
async function listCategories(activeOnly = false) {
  const filter = activeOnly ? { isActive: true } : {};
  const categories = await Category.find(filter).sort({ name: 1 });
  const counts = await MenuItem.aggregate([
    { $unwind: "$categoryIds" },
    { $group: { _id: "$categoryIds", count: { $sum: 1 } } }
  ]);
  const countByCategory = new Map(counts.map((c) => [c._id.toString(), c.count]));

  return categories.map((category) => ({
    ...category.toObject(),
    itemCount: countByCategory.get(category._id.toString()) ?? 0,
  }));
}

async function updateCategory(categoryId, input) {
  const category = await Category.findByIdAndUpdate(categoryId, input, { new: true });
  if (!category) throw AppError.notFound("Category not found");
  return category;
}

async function deleteCategory(categoryId) {
  const hasMenuItems = await MenuItem.exists({ categoryIds: categoryId });
  if (hasMenuItems) {
    throw AppError.conflict("Cannot delete a category that still has menu items");
  }
  const category = await Category.findByIdAndDelete(categoryId);
  if (!category) throw AppError.notFound("Category not found");
}

module.exports = { createCategory, listCategories, updateCategory, deleteCategory };
