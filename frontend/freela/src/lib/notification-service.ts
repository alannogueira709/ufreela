import { api } from "@/lib/api";
import type { Notification, NotificationsResponse } from "@/types/notification";

/** GET /api/notifications/ → lista todas as notificações do usuário autenticado */
export async function fetchNotifications(): Promise<NotificationsResponse> {
  const response = await api.get<NotificationsResponse>("/notifications/");
  return response.data;
}

/** PATCH /api/notifications/<id>/read/ → marca uma notificação como lida */
export async function markNotificationRead(id: string): Promise<Notification> {
  const response = await api.patch<Notification>(`/notifications/${id}/read/`);
  return response.data;
}

/** POST /api/notifications/read-all/ → marca todas como lidas */
export async function markAllNotificationsRead(): Promise<{ marked: number }> {
  const response = await api.post<{ marked: number }>("/notifications/read-all/");
  return response.data;
}

/** DELETE /api/notifications/<id>/ → remove uma notificação */
export async function deleteNotification(id: string): Promise<void> {
  await api.delete(`/notifications/${id}/`);
}
