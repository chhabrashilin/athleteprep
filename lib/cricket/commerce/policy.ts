/**
 * lib/cricket/commerce/policy.ts
 * Deterministic commerce safety utilities for the cricket marketplace.
 * No external calls — all logic is pure and testable.
 */

import { getCommerceCheckoutProvider, isCricketPaymentsEnabled } from "@/lib/config/feature-flags";

// ─── Allowed / prohibited categories ─────────────────────────────────────────

export const ALLOWED_CRICKET_PRODUCT_CATEGORIES = [
  "bats",
  "balls",
  "pads",
  "gloves",
  "helmets",
  "shoes",
  "bags",
  "jerseys",
  "team_kits",
  "training_equipment",
  "umpire_gear",
  "ground_equipment",
  "coaching_services",
  "photography_video",
  "sponsorship_packages",
  "other_approved_cricket_related",
] as const;

export type AllowedCricketCategory = (typeof ALLOWED_CRICKET_PRODUCT_CATEGORIES)[number];

export const PROHIBITED_COMMERCE_CATEGORIES = [
  "gambling",
  "betting",
  "alcohol",
  "nicotine",
  "recreational_drugs",
  "weapons",
  "adult_products",
  "supplements",
  "prescription_medicine",
  "counterfeit_goods",
  "stolen_goods",
  "hazardous_materials",
  "unrelated_high_risk_goods",
] as const;

export type ProhibitedCategory = (typeof PROHIBITED_COMMERCE_CATEGORIES)[number];

export function getAllowedCricketProductCategories(): readonly AllowedCricketCategory[] {
  return ALLOWED_CRICKET_PRODUCT_CATEGORIES;
}

export function getProhibitedCommerceCategories(): readonly ProhibitedCategory[] {
  return PROHIBITED_COMMERCE_CATEGORIES;
}

// ─── Policy risk classification ───────────────────────────────────────────────

export type PolicyRisk = "allowed" | "needs_review" | "prohibited";

export interface PolicyClassification {
  risk: PolicyRisk;
  reasons: string[];
}

const PROHIBITED_KEYWORDS_IN_NAME_OR_DESC: RegExp[] = [
  /\bgambl(e|ing|er)\b/i,
  /\bbet(ting)?\b/i,
  /\balcohol\b/i,
  /\bwhisk(e?y)\b/i,
  /\bwine\b/i,
  /\bbeer\b/i,
  /\bvod(ka)?\b/i,
  /\bcigar(ette)?s?\b/i,
  /\bvap(e|ing)\b/i,
  /\btobacco\b/i,
  /\bnicotine\b/i,
  /\bweed\b/i,
  /\bcannabis\b/i,
  /\bmarij(uana)?\b/i,
  /\bsteroi?d\b/i,
  /\bsupplement\b/i,
  /\bprescription\b/i,
  /\bweapon\b/i,
  /\bgun\b/i,
  /\bfirearm\b/i,
  /\bknife\b/i,
  /\badult content\b/i,
  /\bpornograph\b/i,
  /\bxxx\b/i,
  /\bcounterfeit\b/i,
  /\bstolen\b/i,
  /\bhazardous\b/i,
];

export interface ProductPolicyInput {
  name?: string;
  description?: string;
  short_description?: string;
  categorySlug?: string;
  product_type?: string;
  tags?: string[];
}

export function classifyProductPolicyRisk(input: ProductPolicyInput): PolicyClassification {
  const reasons: string[] = [];
  const text = [
    input.name ?? "",
    input.description ?? "",
    input.short_description ?? "",
    ...(input.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  // Check prohibited category slug
  if (
    input.categorySlug &&
    (PROHIBITED_COMMERCE_CATEGORIES as readonly string[]).includes(input.categorySlug)
  ) {
    reasons.push(`Category "${input.categorySlug}" is prohibited.`);
  }

  // Check text against prohibited keywords
  for (const pattern of PROHIBITED_KEYWORDS_IN_NAME_OR_DESC) {
    if (pattern.test(text)) {
      reasons.push(`Product name/description contains prohibited keyword (${pattern.source}).`);
      break;
    }
  }

  if (reasons.length > 0) {
    return { risk: "prohibited", reasons };
  }

  // Check allowed category
  if (
    input.categorySlug &&
    !(ALLOWED_CRICKET_PRODUCT_CATEGORIES as readonly string[]).includes(input.categorySlug)
  ) {
    reasons.push(`Category "${input.categorySlug}" is not in the approved list and requires review.`);
    return { risk: "needs_review", reasons };
  }

  return { risk: "allowed", reasons: [] };
}

// ─── Content sanitisation ─────────────────────────────────────────────────────

const UNSAFE_HTML_PATTERN = /<(script|iframe|object|embed|form|link|meta|style|svg|base)[^>]*>[\s\S]*?<\/\1>/gi;
const UNSAFE_HTML_SELFCLOSE = /<(script|iframe|object|embed|form|link|meta|style|svg|base)[^>]*\/?>/gi;
const HTML_TAG_STRIP = /<[^>]+>/g;
const JS_PROTO = /javascript\s*:/gi;
const DATA_PROTO = /data\s*:/gi;
const ON_HANDLER = /\bon\w+\s*=/gi;

export function sanitizeProductDescription(input: string): string {
  let out = input;
  // Remove unsafe full tags first
  out = out.replace(UNSAFE_HTML_PATTERN, "");
  out = out.replace(UNSAFE_HTML_SELFCLOSE, "");
  // Strip remaining HTML tags (keep text content)
  out = out.replace(HTML_TAG_STRIP, "");
  // Remove JS/data protocols and event handlers
  out = out.replace(JS_PROTO, "");
  out = out.replace(DATA_PROTO, "");
  out = out.replace(ON_HANDLER, "");
  return out.trim();
}

// ─── Order payload sanitisation ───────────────────────────────────────────────

export interface PublicOrderPayload {
  id: string;
  order_number: string;
  order_type: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  currency: string;
  subtotal_cents: number;
  tax_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  notes: string | null;
  submitted_at: string;
  confirmed_at: string | null;
  items?: unknown[];
}

export function sanitizeOrderPublicPayload(order: Record<string, unknown>): PublicOrderPayload {
  return {
    id: order.id as string,
    order_number: order.order_number as string,
    order_type: order.order_type as string,
    status: order.status as string,
    payment_status: order.payment_status as string,
    fulfillment_status: order.fulfillment_status as string,
    currency: order.currency as string,
    subtotal_cents: (order.subtotal_cents as number) ?? 0,
    tax_cents: (order.tax_cents as number) ?? 0,
    shipping_cents: (order.shipping_cents as number) ?? 0,
    discount_cents: (order.discount_cents as number) ?? 0,
    total_cents: (order.total_cents as number) ?? 0,
    notes: (order.notes as string | null) ?? null,
    submitted_at: order.submitted_at as string,
    confirmed_at: (order.confirmed_at as string | null) ?? null,
    // internal_notes intentionally omitted
    // customer_email/phone intentionally omitted for public views
    // provider_checkout_id / provider_payment_intent_id intentionally omitted
  };
}

// ─── Price visibility ─────────────────────────────────────────────────────────

export interface PriceCheckable {
  product_type?: string;
  price_cents?: number | null;
  inventory_status?: string;
}

export function canShowPrice(product: PriceCheckable): boolean {
  if (product.product_type === "quote_only") return false;
  if (product.inventory_status === "quote_only") return false;
  if (product.price_cents === null || product.price_cents === undefined) return false;
  return true;
}

// ─── Commerce mode ────────────────────────────────────────────────────────────

export type CommerceMode =
  | "request_only"
  | "checkout_provider_configured"
  | "provider_missing_config";

export function getCommerceMode(): CommerceMode {
  const paymentsEnabled = isCricketPaymentsEnabled();
  if (!paymentsEnabled) return "request_only";

  const provider = getCommerceCheckoutProvider();
  if (provider === "request_only") return "request_only";

  if (provider === "stripe") {
    const hasSecret = Boolean(process.env.STRIPE_SECRET_KEY);
    const hasPublishable = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    if (hasSecret && hasPublishable) return "checkout_provider_configured";
    return "provider_missing_config";
  }

  return "provider_missing_config";
}

// ─── Order number generation ──────────────────────────────────────────────────

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GIQ-${ts}-${rand}`;
}

// ─── Cart total calculation ───────────────────────────────────────────────────

export interface CartLineItem {
  quantity: number;
  unit_price_cents?: number | null;
}

export function calculateCartSubtotal(items: CartLineItem[]): number {
  return items.reduce((sum, item) => {
    const price = item.unit_price_cents ?? 0;
    return sum + price * item.quantity;
  }, 0);
}

// ─── Status transition validation ────────────────────────────────────────────

const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["reviewing", "cancelled", "rejected"],
  reviewing: ["quoted", "confirmed", "cancelled", "rejected"],
  quoted: ["awaiting_payment", "confirmed", "cancelled", "rejected"],
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  rejected: ["archived"],
  archived: [],
};

export function isValidOrderStatusTransition(from: string, to: string): boolean {
  return (VALID_ORDER_TRANSITIONS[from] ?? []).includes(to);
}

const VALID_KIT_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["reviewing", "cancelled", "rejected"],
  reviewing: ["quoted", "cancelled", "rejected"],
  quoted: ["approved", "cancelled"],
  approved: ["ordered", "cancelled"],
  ordered: ["in_production", "cancelled"],
  in_production: ["delivered"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export function isValidKitRequestStatusTransition(from: string, to: string): boolean {
  return (VALID_KIT_TRANSITIONS[from] ?? []).includes(to);
}
