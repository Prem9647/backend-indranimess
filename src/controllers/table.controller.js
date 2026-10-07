const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created, noContent } = require("../utils/apiResponse");
const tableService = require("../services/table.service");

const createTable = asyncHandler(async (req, res) => {
  const table = await tableService.createTable(req.body);
  created(res, table);
});

const listTables = asyncHandler(async (_req, res) => {
  const tables = await tableService.listTables();
  ok(res, tables);
});

const updateTable = asyncHandler(async (req, res) => {
  const table = await tableService.updateTable(req.params.id, req.body);
  ok(res, table);
});

const deleteTable = asyncHandler(async (req, res) => {
  await tableService.deleteTable(req.params.id);
  noContent(res);
});

module.exports = { createTable, listTables, updateTable, deleteTable };
