const { z } = require('zod');

const createListingSchema = z.object({
  product_id: z.string().min(1, 'product_id is required'),
  region: z.string().min(1, 'region is required'),
  quantity: z.number().positive('quantity must be positive'),
  unit: z.string().min(1, 'unit is required'),
  asking_price: z.number().positive('asking_price must be positive'),
});

const updateListingStatusSchema = z.object({
  status: z.enum(['active', 'sold', 'closed']),
});

const contactSchema = z.object({
  channel: z.enum(['call', 'whatsapp']),
});

module.exports = { createListingSchema, updateListingStatusSchema, contactSchema };
