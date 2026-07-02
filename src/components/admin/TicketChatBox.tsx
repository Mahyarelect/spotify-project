import { useState } from "react";
import { ArrowLeft, Send, XCircle, CheckCircle } from "lucide-react";
import type { SupportTicket, TicketStatus } from "@/types/ticket";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface TicketChatBoxProps {
  ticket: SupportTicket;
  currentUserId: string;
  onBack: () => void;
  onSendMessage: (content: string) => void;
  onUpdateStatus: (status: TicketStatus) => void;
}

export function TicketChatBox({
  ticket,
  currentUserId,
  onBack,
  onSendMessage,
  onUpdateStatus,
}: TicketChatBoxProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");

  function handleSend() {
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage("");
  }

  return (
    <div className="flex h-[600px] flex-col rounded-xl border border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded p-1 text-zinc-400 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="font-medium text-zinc-100">{ticket.subject}</p>
            <p className="text-xs text-zinc-500">
              {ticket.userName} · {t.admin.priorityLabel.replace("{priority}", ticket.priority)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {ticket.status !== "resolved" && (
            <button
              onClick={() => onUpdateStatus("resolved")}
              className="flex items-center gap-1 rounded-lg bg-blue-600/20 px-2 py-1 text-xs text-blue-400 hover:bg-blue-600/30"
            >
              <CheckCircle size={12} />
              {t.admin.resolve}
            </button>
          )}
          {ticket.status !== "closed" && (
            <button
              onClick={() => onUpdateStatus("closed")}
              className="flex items-center gap-1 rounded-lg bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600"
            >
              <XCircle size={12} />
              {t.admin.close}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {ticket.messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                  isOwn
                    ? "bg-green-600/20 text-zinc-100"
                    : "bg-zinc-800 text-zinc-200"
                }`}
              >
                <p className="mb-1 text-xs font-medium text-zinc-400">
                  {msg.senderName}
                </p>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="mt-1 text-[10px] text-zinc-500">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {ticket.status !== "closed" && (
        <div className="flex gap-2 border-t border-zinc-800 p-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t.admin.typePlaceholder}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
