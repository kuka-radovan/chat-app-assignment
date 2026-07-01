import { Message } from '../domain/message';
import { MessageRepository } from '../domain/message.repository';
import { MessageContent } from '../domain/value-objects/message-content';
import type { UserId } from '../../users/domain/value-objects/user-id';

export class SendMessageUseCase {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(params: {
    authorId: UserId;
    content: string;
  }): Promise<Message> {
    const message = Message.create(
      params.authorId,
      MessageContent.from(params.content),
    );

    await this.messageRepository.save(message);
    return message;
  }
}
