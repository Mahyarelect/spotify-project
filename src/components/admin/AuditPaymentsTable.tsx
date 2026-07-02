import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import type { AuditPayment } from "@/types/audit";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; key: string }
> = {
  pending: { icon: Clock, color: "text-yellow-400", key: "pending" },
  paid: { icon: CheckCircle, color: "text-green-400", key: "paid" },
  disputed: { icon: XCircle, color: "text-red-400", key: "disputed" },
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
  const { t } = useTranslation();
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">
            {t.admin.auditArtists.replace("{count}", String(payments.length))} · {t.admin.auditTotal.replace("{amount}", totalAmount.toFixed(2))}
          </p>
        </div>
        <button
          onClick={onGenerate}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
        >
          {t.admin.generate}
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500">
          <DollarSign size={32} className="mx-auto mb-2 text-zinc-600" />
          <p className="text-sm">{t.admin.auditEmpty}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
                <th className="px-4 py-3">{t.admin.artist}</th>
                <th className="hidden px-4 py-3 sm:table-cell">{t.admin.streams}</th>
                <th className="px-4 py-3">{t.admin.amount}</th>
                <th className="px-4 py-3">{t.admin.auditStatus}</th>
                <th className="px-4 py-3 text-right">{t.admin.actions}</th>
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
                        {t.admin[cfg.key as keyof typeof t.admin]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payment.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => onMarkPaid(payment.id)}
                            className="rounded px-2 py-1 text-xs text-green-400 hover:bg-green-600/20"
                          >
                            {t.admin.markPaid}
                          </button>
                          <button
                            onClick={() => onMarkDisputed(payment.id)}
                            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-600/20"
                          >
                            {t.admin.dispute}
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
