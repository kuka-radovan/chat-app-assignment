import { defineBoot } from '#q-app';
import type { ClientToServerEvents, ServerToClientEvents } from '@chat/shared';
import { io, type Socket } from 'socket.io-client';
import { config } from '@/config';
import { useUsersStore } from '@/stores/users';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  config.apiBaseUrl,
  { autoConnect: false },
);

socket.on('user:registered', (user) => {
  useUsersStore().upsertUser(user);
});

export function connectSocket(token: string): void {
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket(): void {
  socket.disconnect();
}

export default defineBoot(() => {});
