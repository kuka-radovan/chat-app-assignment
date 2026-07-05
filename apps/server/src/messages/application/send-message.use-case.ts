import type { Clock } from '../../common/clock/clock.port';
import type { IdGenerator } from '../../common/id/id-generator.port';
import { Message } from '../domain/message';
import { MessageRepository } from '../domain/message.repository';
import { MessageContent } from '../domain/value-objects/message-content';
import type { UserId } from '../../users/domain/value-objects/user-id';

export class SendMessageUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(params: {
    authorId: UserId;
    content: string;
  }): Promise<Message> {
    const message = Message.create(
      params.authorId,
      MessageContent.from(params.content),
      this.clock,
      this.idGenerator,
    );

    await this.messageRepository.save(message);
    return message;
  }
}
