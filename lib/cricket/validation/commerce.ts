/**
 * lib/cricket/validation/commerce.ts
 * Shared Zod schemas for cricket commerce — cart items and order requests.
 */

import { z } from "zod";

const MAX_ORDER_QUANTITY = parseInt(
  process.env.CRICKET_COMMERCE_MAX_ORDER_QUANTITY ?? "999",
  10
);

export const cartItemSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  variant_id: z.string().uuid("Invalid variant ID").optional().nullable(),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1")
    .max(MAX_ORDER_QUANTITY, `Quantity cannot exceed ${MAX_ORDER_QUANTITY}`),
  customization: z.record(z.string(), z.unknown()).optional().default({}),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const orderRequestSchema = z.object({
  customer_name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  customer_email: z.string().email("Valid email required"),
  customer_phone: z.string().max(30, "Phone too long").optional().nullable(),
  notes: z
    .string()
    .max(2000, "Notes cannot exceed 2000 characters")
    .optional()
    .nullable(),
  shipping_address: z.record(z.string(), z.unknown()).optional().default({}),
  cart_id: z.string().uuid("Invalid cart ID").optional().nullable(),
  league_id: z.string().uuid().optional().nullable(),
  team_id: z.string().uuid().optional().nullable(),
  vendor_id: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().optional().nullable(),
        product_name: z.string().min(1),
        variant_name: z.string().optional().nullable(),
        quantity: z.number().int().min(1),
        unit_price_cents: z.number().int().min(0).optional().nullable(),
        customization: z.record(z.string(), z.unknown()).optional().default({}),
      })
    )
    .optional()
    .default([]),
});
export type OrderRequestInput = z.infer<typeof orderRequestSchema>;
