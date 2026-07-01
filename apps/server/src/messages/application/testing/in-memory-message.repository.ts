import { Message } from '../../domain/message';
import { Nickname } from '../../../users/domain/value-objects/nickname';
import { MessageAuthor } from '../../domain/value-objects/message-author';
import { MessageRepository } from '../../domain/message.repository';

export class InMemoryMessageRepository extends MessageRepository {
  private readonly messages: Message[] = [];

  constructor(
    private readonly nicknames: ReadonlyMap<string, string> = new Map(),
  ) {
    super();
  }

  save(message: Message): Promise<void> {
    this.messages.push(message);
    return Promise.resolve();
  }

  findAll(): Promise<Message[]> {
    return Promise.resolve(
      [...this.messages]
        .sort(
          (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
        )
        .map((message) =>
          Message.reconstitute({
            id: message.id,
            author: MessageAuthor.create(
              message.author.id,
              Nickname.from(
                this.nicknames.get(message.author.id.value) ?? 'unknown',
              ),
            ),
            content: message.content,
            createdAt: message.createdAt,
          }),
        ),
    );
  }

  savedMessages(): readonly Message[] {
    return this.messages;
  }
}
