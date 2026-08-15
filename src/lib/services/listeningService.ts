import { apiRequest } from "@/lib/api/httpClient";

export interface ListeningGroup {
  id: string;
  inviteCode: string;
  memberCount: number;
  createdAt: string;
}

interface ListeningGroupDto {
  id: string;
  invite_code: string;
  member_count: number;
  created_at: string;
}

function mapGroup(dto: ListeningGroupDto): ListeningGroup {
  return {
    id: dto.id,
    inviteCode: dto.invite_code,
    memberCount: dto.member_count,
    createdAt: dto.created_at,
  };
}

export async function createListeningGroup(): Promise<ListeningGroup> {
  return mapGroup(await apiRequest<ListeningGroupDto>("listening-groups/", { method: "POST" }));
}

export async function getListeningGroup(inviteCode: string): Promise<ListeningGroup> {
  return mapGroup(await apiRequest<ListeningGroupDto>(`listening-groups/${encodeURIComponent(inviteCode)}/`));
}

export function listeningSocketUrl(inviteCode: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/listening/${encodeURIComponent(inviteCode)}/`;
}
