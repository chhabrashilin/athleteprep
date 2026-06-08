/**
 * lib/cricket/validation/vendors.ts
 * Zod schemas for cricket vendor creation and product management.
 */

import { z } from "zod";
import { classifyProductPolicyRisk } from "@/lib/cricket/commerce/policy";

// ─── Vendor types ─────────────────────────────────────────────────────────────

export const VENDOR_TYPES = [
  "equipment",
  "apparel",
  "team_kits",
  "coaching_services",
  "ground_services",
  "photography",
  "streaming_services",
  "sponsor",
  "other",
] as const;

// ─── Slug helper ──────────────────────────────────────────────────────────────

export function generateVendorSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Vendor schema ────────────────────────────────────────────────────────────

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const urlSchema = z
  .string()
  .url("Must be a valid URL")
  .optional()
  .nullable()
  .or(z.literal(""));

export const createVendorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name too long"),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(slugPattern, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().max(2000, "Description too long").optional().nullable(),
  website_url: urlSchema,
  logo_url: z.string().optional().nullable(),
  contact_name: z.string().min(1, "Contact name is required").max(200),
  contact_email: z.string().email("Valid email required"),
  contact_phone: z.string().max(30).optional().nullable(),
  business_address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  region: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  vendor_type: z.enum(VENDOR_TYPES),
  league_id: z.string().uuid().optional().nullable(),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const updateVendorSchema = createVendorSchema.partial();
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// ─── Product schema ───────────────────────────────────────────────────────────

const PRODUCT_TYPES = [
  "physical",
  "service",
  "team_kit",
  "sponsorship",
  "digital",
  "quote_only",
] as const;

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const imageUrlSchema = z
  .string()
  .url("Each image must be a valid URL")
  .max(2048, "Image URL too long");

// Base schema without refinements — safe to call .partial() on for updates.
const productBaseSchema = z.object({
  vendor_id: z.string().uuid("Invalid vendor ID"),
  category_id: z.string().uuid("Invalid category ID").optional().nullable(),
  league_id: z.string().uuid().optional().nullable(),
  name: z.string().min(2, "Product name too short").max(140, "Product name too long"),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(slugPattern, "Slug must be lowercase letters, numbers, and hyphens"),
  short_description: z.string().max(300).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  product_type: z.enum(PRODUCT_TYPES),
  currency: z
    .string()
    .regex(CURRENCY_PATTERN, "Currency must be a 3-letter ISO code (e.g. USD)"),
  price_cents: z.number().int().min(0, "Price cannot be negative").optional().nullable(),
  compare_at_price_cents: z.number().int().min(0).optional().nullable(),
  min_order_quantity: z.number().int().min(1).default(1),
  max_order_quantity: z.number().int().min(1).optional().nullable(),
  inventory_status: z
    .enum([
      "unknown",
      "in_stock",
      "low_stock",
      "out_of_stock",
      "made_to_order",
      "quote_only",
      "discontinued",
    ])
    .default("unknown"),
  inventory_quantity: z.number().int().min(0).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  image_urls: z.array(imageUrlSchema).max(8, "Maximum 8 product images").default([]),
  tags: z.array(z.string().max(50)).max(20).default([]),
  specifications: z.record(z.string(), z.unknown()).optional().default({}),
  sizing_info: z.record(z.string(), z.unknown()).optional().default({}),
  shipping_info: z.record(z.string(), z.unknown()).optional().default({}),
  categorySlug: z.string().optional(),
});

// Refined create schema — has policy check and quantity cross-validation.
export const createProductSchema = productBaseSchema.superRefine((data, ctx) => {
  if (
    data.max_order_quantity !== null &&
    data.max_order_quantity !== undefined &&
    data.max_order_quantity < data.min_order_quantity
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Max order quantity must be >= min order quantity",
      path: ["max_order_quantity"],
    });
  }

  const policy = classifyProductPolicyRisk({
    name: data.name,
    description: data.description ?? undefined,
    short_description: data.short_description ?? undefined,
    categorySlug: data.categorySlug,
    product_type: data.product_type,
    tags: data.tags,
  });
  if (policy.risk === "prohibited") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Product is prohibited: ${policy.reasons.join("; ")}`,
      path: ["name"],
    });
  }
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

// Partial update schema — uses the base (no refinements) to allow partial updates.
export const updateProductSchema = productBaseSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
