const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created, noContent } = require("../utils/apiResponse");
const categoryService = require("../services/category.service");

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  created(res, category);
});

const listCategories = asyncHandler(async (req, res) => {
  const activeOnly = req.query.activeOnly === "true";
  const categories = await categoryService.listCategories(activeOnly);
  ok(res, categories);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  ok(res, category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  noContent(res);
});

module.exports = { createCategory, listCategories, updateCategory, deleteCategory };
