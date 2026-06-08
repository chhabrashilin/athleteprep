import type { PolicyClassification } from "@/lib/cricket/commerce/policy";

interface Props {
  classification: PolicyClassification;
}

export function CommercePolicyWarning({ classification }: Props) {
  if (classification.risk === "allowed") return null;

  const isProhibited = classification.risk === "prohibited";

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        isProhibited
          ? "border-rose-500/30 bg-rose-500/5 text-rose-400"
          : "border-amber-500/30 bg-amber-500/5 text-amber-400"
      }`}
    >
      <strong className="block mb-1">
        {isProhibited ? "Product not allowed" : "Product requires review"}
      </strong>
      <ul className="list-disc list-inside space-y-0.5">
        {classification.reasons.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
