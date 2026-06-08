import type { CommerceMode } from "@/lib/cricket/commerce/policy";

interface Props {
  mode: CommerceMode;
}

export function CricketCheckoutModeNotice({ mode }: Props) {
  if (mode === "checkout_provider_configured") {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
        Secure checkout is enabled. Your order will be processed safely.
      </div>
    );
  }

  if (mode === "provider_missing_config") {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
        <strong>Payment provider is not fully configured.</strong> Your order will be submitted as
        an inquiry. A vendor will contact you to confirm and arrange payment.
      </div>
    );
  }

  // request_only (default)
  return (
    <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-300">
      <strong>Request-only mode.</strong> No payment is collected now. Submit your order request and
      the vendor will get back to you with pricing and availability.
    </div>
  );
}
