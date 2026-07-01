import { MessageSquare, Clock, AlertTriangle } from "lucide-react";
import type { SupportTicket } from "@/types/ticket";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-500/10 text-green-400",
  in_progress: "bg-yellow-500/10 text-yellow-400",
  resolved: "bg-blue-500/10 text-blue-400",
  closed: "bg-zinc-500/10 text-zinc-400",
};

const PRIORITY_ICONS: Record<string, typeof AlertTriangle> = {
  urgent: AlertTriangle,
  high: AlertTriangle,
  medium: Clock,
  low: Clock,
};

interface SupportTicketsTableProps {
  tickets: SupportTicket[];
  onSelect: (ticket: SupportTicket) => void;
}

export function SupportTicketsTable({
  tickets,
  onSelect,
}: SupportTicketsTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500">
        <MessageSquare size={32} className="mx-auto mb-2 text-zinc-600" />
        <p className="text-sm">No support tickets yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500">
            <th className="px-4 py-3">Subject</th>
            <th className="hidden px-4 py-3 sm:table-cell">User</th>
            <th className="hidden px-4 py-3 md:table-cell">Priority</th>
            <th className="px-4 py-3">Status</th>
            <th className="hidden px-4 py-3 lg:table-cell">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const PriorityIcon = PRIORITY_ICONS[ticket.priority] ?? Clock;
            return (
              <tr
                key={ticket.id}
                onClick={() => onSelect(ticket)}
                className="cursor-pointer border-b border-zinc-800/50 transition hover:bg-zinc-800/30"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-100">{ticket.subject}</p>
                  <p className="text-xs text-zinc-500">
                    {ticket.messages.length} message
                    {ticket.messages.length !== 1 ? "s" : ""}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-zinc-400 sm:table-cell">
                  {ticket.userName}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <PriorityIcon size={12} />
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-zinc-500 lg:table-cell">
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
