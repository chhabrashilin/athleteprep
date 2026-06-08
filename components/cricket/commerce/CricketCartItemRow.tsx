"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { updateCricketCartItem, removeCricketCartItem } from "@/lib/cricket/commerce/cart/actions";

interface Props {
  item: {
    id: string;
    productId: string;
    quantity: number;
    unitPriceCents: number | null;
    customization: Record<string, unknown>;
  };
  productName: string;
  onUpdate?: () => void;
}

export function CricketCartItemRow({ item, productName, onUpdate }: Props) {
  const [qty, setQty] = useState(item.quantity);
  const [removing, setRemoving] = useState(false);

  const lineTotal = item.unitPriceCents != null ? item.unitPriceCents * qty : null;

  async function handleQtyChange(newQty: number) {
    if (newQty < 1) return;
    setQty(newQty);
    await updateCricketCartItem(item.id, newQty);
    onUpdate?.();
  }

  async function handleRemove() {
    setRemoving(true);
    await removeCricketCartItem(item.id);
    onUpdate?.();
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-800 last:border-0">
      <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center text-xl shrink-0">
        🏏
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">{productName}</p>
        {lineTotal != null ? (
          <p className="text-xs text-slate-400">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
              lineTotal / 100
            )}
          </p>
        ) : (
          <p className="text-xs text-amber-400">Quote on request</p>
        )}
      </div>

      {/* Quantity selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQtyChange(qty - 1)}
          disabled={qty <= 1}
          className="h-7 w-7 rounded border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 flex items-center justify-center"
        >
          −
        </button>
        <span className="w-6 text-center text-sm text-slate-200">{qty}</span>
        <button
          onClick={() => handleQtyChange(qty + 1)}
          className="h-7 w-7 rounded border border-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center"
        >
          +
        </button>
      </div>

      <button
        onClick={handleRemove}
        disabled={removing}
        className="text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-30"
        aria-label="Remove item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
