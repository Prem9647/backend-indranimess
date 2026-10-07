const { z } = require("zod");

const createCustomerSchema = z.object({
  name: z.string().min(1),
  mobileNumber: z.string().min(6),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  mobileNumber: z.string().min(6).optional(),
});

module.exports = { createCustomerSchema, updateCustomerSchema };
