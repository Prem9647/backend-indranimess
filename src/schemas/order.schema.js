const { z } = require("zod");

const orderItemInput = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const createOrderSchema = z.object({
  tableId: z.string().min(1),
  seatNumber: z.string().optional(),
  customer: z.object({
    name: z.string().min(1),
    mobileNumber: z.string().min(6),
  }),
  items: z.array(orderItemInput).min(1),
});

const addOrderItemsSchema = z.object({
  items: z.array(orderItemInput).min(1),
});

const updateOrderItemQuantitySchema = z.object({
  quantity: z.number().int().positive(),
});

const generateBillSchema = z.object({
  discount: z.number().nonnegative().default(0),
});

module.exports = {
  createOrderSchema,
  addOrderItemsSchema,
  updateOrderItemQuantitySchema,
  generateBillSchema,
};
