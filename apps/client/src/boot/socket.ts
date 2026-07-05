import { defineBoot } from '#q-app';
import type { Ack, ClientToServerEvents, MessageDto, ServerToClientEvents } from '@chat/shared';
import { io, type Socket } from 'socket.io-client';
import { config } from '@/config';
import { useMessagesStore } from '@/stores/messages';
import { useUsersStore } from '@/stores/users';

const ACK_TIMEOUT_MS = 10000;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(config.apiBaseUrl, {
  autoConnect: false,
});

socket.on('user:registered', (user) => {
  useUsersStore().upsertUser(user);
});

socket.on('message:new', (message) => {
  useMessagesStore().addMessage(message);
});

export function connectSocket(token: string): void {
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket(): void {
  socket.disconnect();
}

export async function sendMessage(content: string): Promise<Ack<MessageDto>> {
  try {
    return await socket.timeout(ACK_TIMEOUT_MS).emitWithAck('message:send', { content });
  } catch {
    return {
      ok: false,
      error: {
        code: 'ACK_TIMEOUT',
        message: 'The server did not respond. Please try again.',
      },
    };
  }
}

export default defineBoot(() => {});
