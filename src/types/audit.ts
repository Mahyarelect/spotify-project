export interface AuditPayment {
  id: string;
  artistId: string;
  artistName: string;
  month: string;
  totalStreams: number;
  amount: number;
  status: "pending" | "paid" | "disputed";
  paidAt?: string;
}
