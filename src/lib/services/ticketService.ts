import { apiRequest } from "@/lib/api/httpClient";
import type { SupportTicket, TicketPriority, TicketStatus } from "@/types/ticket";

interface TicketDto {
  id: string;
  created_by: string;
  user_name: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  messages: Array<{
    id: string;
    sender: string;
    sender_name: string;
    content: string;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

function mapTicket(dto: TicketDto): SupportTicket {
  return {
    id: dto.id,
    userId: dto.created_by,
    userName: dto.user_name,
    subject: dto.subject,
    status: dto.status,
    priority: dto.priority,
    messages: dto.messages.map((message) => ({
      id: message.id,
      senderId: message.sender,
      senderName: message.sender_name,
      content: message.content,
      createdAt: message.created_at,
    })),
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

export async function getAllTickets(signal?: AbortSignal): Promise<SupportTicket[]> {
  const data = await apiRequest<TicketDto[]>("tickets/", { signal });
  return data.map(mapTicket);
}

export async function getTicketById(ticketId: string): Promise<SupportTicket> {
  return mapTicket(await apiRequest<TicketDto>(`tickets/${ticketId}/`));
}

export async function createTicket(data: {
  subject: string;
  message: string;
  priority?: TicketPriority;
}): Promise<SupportTicket> {
  return mapTicket(await apiRequest<TicketDto>("tickets/", {
    method: "POST",
    body: JSON.stringify(data),
  }));
}

export async function addTicketMessage(ticketId: string, content: string): Promise<SupportTicket> {
  return mapTicket(await apiRequest<TicketDto>(`tickets/${ticketId}/messages/`, {
    method: "POST",
    body: JSON.stringify({ content }),
  }));
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
  return mapTicket(await apiRequest<TicketDto>(`support/tickets/${ticketId}/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }));
}
