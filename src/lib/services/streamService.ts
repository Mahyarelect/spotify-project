import { apiRequest } from "@/lib/api/httpClient";

interface StreamStatus {
  streams_today: number;
  daily_limit: number | null;
  can_stream: boolean;
}

export async function canStream(): Promise<boolean> {
  try {
    const status = await apiRequest<StreamStatus>("music/streams/status/");
    return status.can_stream;
  } catch {
    return true;
  }
}

export async function recordStream(songId: string): Promise<void> {
  await apiRequest("music/streams/", {
    method: "POST",
    body: JSON.stringify({ song_id: songId }),
  });
}

export async function getStreamStatus(): Promise<StreamStatus> {
  return apiRequest<StreamStatus>("music/streams/status/");
}
