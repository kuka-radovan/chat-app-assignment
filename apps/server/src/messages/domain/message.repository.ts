import type { Message } from './message';

export interface MessagePageCursor {
  createdAt: Date;
  id: string;
}

export interface FindMessagesPageParams {
  limit: number;
  before?: MessagePageCursor;
  after?: MessagePageCursor;
}

export abstract class MessageRepository {
  abstract save(message: Message): Promise<void>;
  abstract findPage(params: FindMessagesPageParams): Promise<Message[]>;
}
