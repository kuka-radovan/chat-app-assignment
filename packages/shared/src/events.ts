import type { ListUserDto } from './dto/user.dto';

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface ServerToClientEvents {
  'user:registered': (user: ListUserDto) => void;
}

export type ClientToServerEvents = Record<string, never>;

