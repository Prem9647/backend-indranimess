const { z } = require("zod");
const { TABLE_STATUSES } = require("../constants/tableStatus");

const createTableSchema = z.object({
  tableNumber: z.string().trim().min(1, "Enter a table name or number").max(20, "Table name too long"),
  capacity: z.number().int().positive(),
  location: z.string().trim().max(60).optional(),
});

const updateTableSchema = z.object({
  tableNumber: z.string().trim().min(1).max(20).optional(),
  capacity: z.number().int().positive().optional(),
  location: z.string().trim().max(60).optional(),
  status: z.enum(TABLE_STATUSES).optional(),
});

module.exports = { createTableSchema, updateTableSchema };
