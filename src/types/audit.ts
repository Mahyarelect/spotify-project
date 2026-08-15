export interface AuditPayment {
  id: string;
  artistId: string;
  artistName: string;
  month: string;
  totalStreams: number;
  amount: number;
  status: "pending" | "approved" | "paid" | "disputed";
  paidAt?: string;
}
