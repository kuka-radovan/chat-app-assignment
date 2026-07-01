import type { Message } from './message';

export abstract class MessageRepository {
  abstract save(message: Message): Promise<void>;
}
