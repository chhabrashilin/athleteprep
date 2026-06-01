import type { AccessRequestRow } from "@/lib/db/feedback";

interface AccessRequestsTableProps {
  requests: AccessRequestRow[];
}

export function AccessRequestsTable({ requests }: AccessRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">No access requests yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
            <th className="pb-3 pr-4">Name</th>
            <th className="pb-3 pr-4">Email</th>
            <th className="pb-3 pr-4">Role</th>
            <th className="pb-3 pr-4">Sport</th>
            <th className="pb-3 pr-4">Level</th>
            <th className="pb-3 pr-4">Tools</th>
            <th className="pb-3 pr-4">Pain point</th>
            <th className="pb-3">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {requests.map((r) => (
            <tr key={r.id} className="text-slate-300">
              <td className="py-3 pr-4 font-medium whitespace-nowrap">{r.name}</td>
              <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{r.email}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{r.role}</td>
              <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{r.sport ?? "—"}</td>
              <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">{r.level ?? "—"}</td>
              <td className="py-3 pr-4 text-slate-400 max-w-[140px] truncate" title={r.current_tools ?? undefined}>
                {r.current_tools ?? "—"}
              </td>
              <td className="py-3 pr-4 text-slate-400 max-w-[200px] truncate" title={r.pain_point ?? undefined}>
                {r.pain_point ?? "—"}
              </td>
              <td className="py-3 text-slate-500 whitespace-nowrap text-xs">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
