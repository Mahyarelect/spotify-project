import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import type { AuditPayment } from "@/types/audit";

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; label: string }
> = {
  pending: { icon: Clock, color: "text-yellow-400", label: "Pending" },
  paid: { icon: CheckCircle, color: "text-green-400", label: "Paid" },
  disputed: { icon: XCircle, color: "text-red-400", label: "Disputed" },
};

interface AuditPaymentsTableProps {
  payments: AuditPayment[];
  onMarkPaid: (id: string) => void;
  onMarkDisputed: (id: string) => void;
  onGenerate: () => void;
}

export function AuditPaymentsTable({
  payments,
  onMarkPaid,
  onMarkDisputed,
  onGenerate,
}: AuditPaymentsTableProps) {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            {payments.length} artist{payments.length !== 1 ? "s" : ""} · Total:{" "}
            <span className="font-semibold text-zinc-100">
              ${totalAmount.toFixed(2)}
            </span>
          </p>
        </div>
        <button
          onClick={onGenerate}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
        >
          Generate This Month
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500">
          <DollarSign size={32} className="mx-auto mb-2 text-zinc-600" />
          <p className="text-sm">No audit records. Generate this month&apos;s audit above.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                <th className="px-4 py-3">Artist</th>
                <th className="hidden px-4 py-3 sm:table-cell">Streams</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const cfg = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <tr
                    key={payment.id}
                    className="border-b border-zinc-800/50 transition hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100">
                      {payment.artistName}
                    </td>
                    <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">
                      {payment.totalStreams.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs ${cfg.color}`}
                      >
                        <StatusIcon size={12} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payment.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => onMarkPaid(payment.id)}
                            className="rounded px-2 py-1 text-xs text-green-400 hover:bg-green-600/20"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => onMarkDisputed(payment.id)}
                            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-600/20"
                          >
                            Dispute
                          </button>
                        </div>
                      )}
                      {payment.status === "paid" && payment.paidAt && (
                        <span className="text-xs text-zinc-600">
                          {new Date(payment.paidAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
