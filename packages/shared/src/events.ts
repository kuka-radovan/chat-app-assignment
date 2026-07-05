import type { MessageDto } from './dto/message.dto';
import type { SendMessageDto } from './dto/send-message.dto';
import type { ListUserDto } from './dto/user.dto';

export type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export interface ServerToClientEvents {
  'user:online': (user: ListUserDto) => void;
  'user:offline': (userId: string) => void;
  'message:new': (message: MessageDto) => void;
}

export interface ClientToServerEvents {
  'message:send': (
    dto: SendMessageDto,
    ack: (response: Ack<MessageDto>) => void,
  ) => void;
  'user:online': (ack: (response: Ack<ListUserDto[]>) => void) => void;
}

