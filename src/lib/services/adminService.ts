import { apiRequest } from "@/lib/api/httpClient";
import type { ArtistApplication } from "@/types/user";

interface ArtistApplicationDto {
  id: string;
  email: string;
  artist_name: string;
  portfolio_url: string;
  status: ArtistApplication["status"];
  rejection_reason?: string;
  submitted_at: string;
}

function mapApplication(dto: ArtistApplicationDto): ArtistApplication {
  return {
    id: dto.id,
    email: dto.email,
    artistName: dto.artist_name,
    portfolioUrl: dto.portfolio_url,
    status: dto.status,
    rejectionReason: dto.rejection_reason,
    submittedAt: dto.submitted_at,
  };
}

export async function getPendingApplications(signal?: AbortSignal): Promise<ArtistApplication[]> {
  const applications = await apiRequest<ArtistApplicationDto[]>(
    "admin/artist-applications/?status=pending",
    { signal },
  );
  return applications.map(mapApplication);
}

export async function approveApplication(applicationId: string): Promise<void> {
  await apiRequest(`admin/artist-applications/${applicationId}/approve/`, { method: "POST" });
}

export async function rejectApplication(applicationId: string, reason: string): Promise<void> {
  await apiRequest(`admin/artist-applications/${applicationId}/reject/`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
