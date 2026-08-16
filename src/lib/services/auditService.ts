import { apiRequest } from "@/lib/api/httpClient";
import type { AuditPayment } from "@/types/audit";

interface PayoutDto {
  id: string;
  artist: string;
  artist_name: string;
  month: string;
  total_streams: number;
  unique_listeners: number;
  amount: string;
  status: AuditPayment["status"];
  provider_reference: string | null;
  paid_at: string | null;
}

interface RevenueDto {
  total_revenue: string;
  total_streams: number;
  paid_amount: string;
  pending_amount: string;
  by_tier: Array<{ tier: string; count: number; revenue: string }>;
}

function mapPayout(dto: PayoutDto): AuditPayment {
  return {
    id: dto.id,
    artistId: dto.artist,
    artistName: dto.artist_name,
    month: dto.month.slice(0, 7),
    totalStreams: dto.total_streams,
    uniqueListeners: dto.unique_listeners,
    amount: Number(dto.amount),
    status: dto.status,
    paidAt: dto.paid_at ?? undefined,
  };
}

export async function getAuditPaymentsByMonth(month: string, signal?: AbortSignal): Promise<AuditPayment[]> {
  const data = await apiRequest<PayoutDto[]>(`artist/payouts/?month=${month}-01`, { signal });
  return data.map(mapPayout);
}

export async function generateMonthlyAudit(month: string): Promise<AuditPayment[]> {
  const data = await apiRequest<PayoutDto[]>("admin/payouts/generate/", {
    method: "POST",
    body: JSON.stringify({ month: `${month}-01`, rate_per_stream: "0.003000", currency: "USD" }),
  });
  return data.map(mapPayout);
}

async function transition(paymentId: string, status: "approved" | "paid" | "disputed", providerReference?: string): Promise<AuditPayment> {
  const data = await apiRequest<PayoutDto>(`admin/payouts/${paymentId}/status/`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(providerReference ? { provider_reference: providerReference } : {}),
    }),
  });
  return mapPayout(data);
}

export async function markPaymentPaid(paymentId: string): Promise<AuditPayment> {
  await transition(paymentId, "approved");
  return transition(paymentId, "paid", `admin:${crypto.randomUUID()}`);
}

export function markPaymentDisputed(paymentId: string): Promise<AuditPayment> {
  return transition(paymentId, "disputed");
}

export async function getRevenueStats(signal?: AbortSignal): Promise<{
  totalRevenue: number;
  totalStreams: number;
  paidAmount: number;
  pendingAmount: number;
  byTier: { tier: string; count: number; revenue: number }[];
}> {
  const dto = await apiRequest<RevenueDto>("admin/reports/revenue/", { signal });
  return {
    totalRevenue: Number(dto.total_revenue),
    totalStreams: dto.total_streams,
    paidAmount: Number(dto.paid_amount),
    pendingAmount: Number(dto.pending_amount),
    byTier: dto.by_tier.map((row) => ({ ...row, revenue: Number(row.revenue) })),
  };
}
