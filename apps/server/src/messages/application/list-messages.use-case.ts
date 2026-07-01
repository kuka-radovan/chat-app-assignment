import type { Message } from '../domain/message';
import type { MessageRepository } from '../domain/message.repository';

export class ListMessagesUseCase {
  constructor(private readonly messageRepository: MessageRepository) {}

  execute(): Promise<Message[]> {
    return this.messageRepository.findAll();
  }
}
