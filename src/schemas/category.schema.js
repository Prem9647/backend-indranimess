const { z } = require("zod");

const createCategorySchema = z.object({
  name: z.string().min(1),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createCategorySchema, updateCategorySchema };
