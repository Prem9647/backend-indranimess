const { z } = require("zod");
const { ROLES } = require("../constants/roles");

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8),
  role: z.enum(ROLES).exclude(["admin"]), // admins are provisioned outside the app, not via this endpoint
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  role: z.enum(ROLES).exclude(["admin"]).optional(), // see createUserSchema — admins aren't assigned via this endpoint
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8),
});

module.exports = { createUserSchema, updateUserSchema, resetPasswordSchema };
