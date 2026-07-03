import type { HistoryQuery, MessageDto } from '@chat/shared';
import { api } from '@/boot/axios';

export async function fetchMessages(
  query: HistoryQuery = {},
): Promise<MessageDto[]> {
  const { data } = await api.get<MessageDto[]>('/messages', { params: query });
  return data;
}
