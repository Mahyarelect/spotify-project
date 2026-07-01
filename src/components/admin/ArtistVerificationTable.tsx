import { useState } from "react";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import type { ArtistApplication } from "@/types/user";

interface ArtistVerificationTableProps {
  applications: ArtistApplication[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export function ArtistVerificationTable({
  applications,
  onApprove,
  onReject,
}: ArtistVerificationTableProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    onReject(id, rejectReason.trim());
    setRejectingId(null);
    setRejectReason("");
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 p-8 text-center text-zinc-500">
        <CheckCircle size={32} className="mx-auto mb-2 text-zinc-600" />
        <p className="text-sm">No pending verification requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div
          key={app.id}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-zinc-100">{app.artistName}</p>
              <p className="text-sm text-zinc-400">{app.email}</p>
              {app.portfolioUrl && (
                <a
                  href={app.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-green-400 hover:text-green-300"
                >
                  <ExternalLink size={12} />
                  Portfolio
                </a>
              )}
              <p className="text-xs text-zinc-600">
                Submitted {new Date(app.submittedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onApprove(app.id)}
                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <CheckCircle size={14} />
                Approve
              </button>
              <button
                onClick={() => setRejectingId(app.id)}
                className="flex items-center gap-1 rounded-lg bg-red-600/20 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-600/30"
              >
                <XCircle size={14} />
                Reject
              </button>
            </div>
          </div>

          {rejectingId === app.id && (
            <div className="mt-3 flex gap-2 border-t border-zinc-800 pt-3">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason..."
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
              />
              <button
                onClick={() => handleReject(app.id)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
