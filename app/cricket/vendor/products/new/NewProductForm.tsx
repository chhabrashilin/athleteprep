"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommercePolicyWarning } from "@/components/cricket/commerce/CommercePolicyWarning";
import { createCricketProduct } from "@/lib/cricket/commerce/products/actions";
import {
  classifyProductPolicyRisk,
  type PolicyClassification,
} from "@/lib/cricket/commerce/policy";

export function NewProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyCheck, setPolicyCheck] = useState<PolicyClassification>({ risk: "allowed", reasons: [] });

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    if (name.length > 2) {
      setPolicyCheck(classifyProductPolicyRisk({ name }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const name = fd.get("name") as string;
    const policy = classifyProductPolicyRisk({ name });
    if (policy.risk === "prohibited") {
      setError("This product type is not allowed on the marketplace.");
      setLoading(false);
      return;
    }

    const result = await createCricketProduct({
      vendor_id: fd.get("vendor_id") as string,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      short_description: (fd.get("short_description") as string) || null,
      product_type: fd.get("product_type") as string,
      currency: "USD",
      price_cents: fd.get("price") ? Math.round(parseFloat(fd.get("price") as string) * 100) : null,
      min_order_quantity: 1,
      image_urls: [],
      tags: [],
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to create product");
    } else {
      router.push("/cricket/vendor/products");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Product name <span className="text-rose-400">*</span>
        </label>
        <input
          name="name"
          required
          maxLength={140}
          onChange={handleNameChange}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="English Willow Cricket Bat"
        />
      </div>

      <CommercePolicyWarning classification={policyCheck} />

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Vendor ID <span className="text-rose-400">*</span>
        </label>
        <input
          name="vendor_id"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 font-mono focus:border-sky-500 focus:outline-none"
          placeholder="Your vendor UUID"
        />
        <p className="text-xs text-slate-500 mt-1">Find your vendor ID on the Vendor Portal dashboard.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Product type <span className="text-rose-400">*</span>
        </label>
        <select
          name="product_type"
          required
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
        >
          <option value="physical">Physical product</option>
          <option value="service">Service</option>
          <option value="team_kit">Team kit</option>
          <option value="digital">Digital product</option>
          <option value="quote_only">Quote only</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Short description</label>
        <input
          name="short_description"
          maxLength={300}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          placeholder="One-line summary of the product"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Price (USD, optional)</label>
        <input
          name="price"
          type="number"
          min={0}
          step="0.01"
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
          placeholder="Leave empty for quote-only"
        />
      </div>

      {error && (
        <p className="text-sm text-rose-400 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || policyCheck.risk === "prohibited"}
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save as draft"}
        </button>
      </div>
    </form>
  );
}
