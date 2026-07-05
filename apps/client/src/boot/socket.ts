import { defineBoot } from '#q-app';
import type { Ack, ClientToServerEvents, MessageDto, ServerToClientEvents } from '@chat/shared';
import { Notify } from 'quasar';
import { io, type Socket } from 'socket.io-client';
import { config } from '@/config';
import { useMessagesStore } from '@/stores/messages';
import { useUsersStore } from '@/stores/users';

const ACK_TIMEOUT_MS = 10000;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(config.apiBaseUrl, {
  autoConnect: false,
});

function notifyPresence(nickname: string, action: 'joined' | 'left'): void {
  Notify.create({
    message: nickname,
    caption: `${action} the conversation`,
    position: 'top-right',
    timeout: 3000,
  });
}

socket.on('connect', () => {
  void announceOnline();
});

socket.on('disconnect', () => {
  useUsersStore().reset();
});

socket.on('user:online', (user) => {
  useUsersStore().upsertUser(user);
  notifyPresence(user.nickname, 'joined');
});

socket.on('user:offline', (userId) => {
  const removed = useUsersStore().removeUser(userId);

  if (removed) {
    notifyPresence(removed.nickname, 'left');
  }
});

socket.on('message:new', (message) => {
  useMessagesStore().addMessage(message);
});

async function announceOnline(): Promise<void> {
  try {
    const ack = await socket.timeout(ACK_TIMEOUT_MS).emitWithAck('user:online');
    if (ack.ok) {
      useUsersStore().setUsers(ack.data);
    }
  } catch {
    // The announce failed (timeout or disconnect); it will retry on the next connect.
  }
}

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
