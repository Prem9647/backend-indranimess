const { z } = require("zod");

const updateSettingsSchema = z.object({
  restaurantName: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  gstin: z.string().optional(),
  billFooter: z.string().optional(),
});

module.exports = { updateSettingsSchema };
