import type { Message } from '../../domain/message';
import { MessageRepository } from '../../domain/message.repository';

export class InMemoryMessageRepository extends MessageRepository {
  private readonly messages: Message[] = [];

  save(message: Message): Promise<void> {
    this.messages.push(message);
    return Promise.resolve();
  }

  findAll(): Promise<Message[]> {
    const messages = [...this.messages].sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
    );
    return Promise.resolve(messages);
  }

  savedMessages(): readonly Message[] {
    return this.messages;
  }
}
