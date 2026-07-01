import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from "@/types/ticket";
import { getTickets, saveTickets } from "./storage";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function getAllTickets(): SupportTicket[] {
  return getTickets();
}

export function getTicketById(ticketId: string): SupportTicket | null {
  return getTickets().find((t) => t.id === ticketId) ?? null;
}

export function getTicketsByUser(userId: string): SupportTicket[] {
  return getTickets().filter((t) => t.userId === userId);
}

export function createTicket(data: {
  userId: string;
  userName: string;
  subject: string;
  message: string;
  priority?: TicketPriority;
}): SupportTicket {
  const tickets = getTickets();
  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    id: createId("ticket"),
    userId: data.userId,
    userName: data.userName,
    subject: data.subject,
    status: "open",
    priority: data.priority ?? "medium",
    messages: [
      {
        id: createId("msg"),
        senderId: data.userId,
        senderName: data.userName,
        content: data.message,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  tickets.push(ticket);
  saveTickets(tickets);
  return ticket;
}

export function addTicketMessage(
  ticketId: string,
  senderId: string,
  senderName: string,
  content: string
): SupportTicket {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === ticketId);
  if (idx === -1) throw new Error("Ticket not found");

  const msg: TicketMessage = {
    id: createId("msg"),
    senderId,
    senderName,
    content,
    createdAt: new Date().toISOString(),
  };
  tickets[idx].messages.push(msg);
  tickets[idx].updatedAt = new Date().toISOString();
  saveTickets(tickets);
  return tickets[idx];
}

export function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): SupportTicket {
  const tickets = getTickets();
  const idx = tickets.findIndex((t) => t.id === ticketId);
  if (idx === -1) throw new Error("Ticket not found");
  tickets[idx].status = status;
  tickets[idx].updatedAt = new Date().toISOString();
  saveTickets(tickets);
  return tickets[idx];
}
