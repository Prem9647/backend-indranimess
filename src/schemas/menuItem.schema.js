const { z } = require("zod");

const createMenuItemSchema = z.object({
  categoryIds: z.array(z.string()).min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  isBestseller: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  prepTimeMinutes: z.number().nonnegative().optional(),
});

const updateMenuItemSchema = z.object({
  categoryIds: z.array(z.string()).min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative().optional(),
  isAvailable: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  prepTimeMinutes: z.number().nonnegative().optional(),
});

module.exports = { createMenuItemSchema, updateMenuItemSchema };
