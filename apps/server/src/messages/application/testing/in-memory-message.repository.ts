import { Message } from '../../domain/message';
import { Nickname } from '../../../users/domain/value-objects/nickname';
import { MessageAuthor } from '../../domain/value-objects/message-author';
import {
  type FindMessagesPageParams,
  type MessagePageCursor,
  MessageRepository,
} from '../../domain/message.repository';

function compareByCreatedAtAndId(left: Message, right: Message): number {
  const timeDiff = left.createdAt.getTime() - right.createdAt.getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return left.id.value.localeCompare(right.id.value);
}

function isBefore(message: Message, cursor: MessagePageCursor): boolean {
  return (
    message.createdAt < cursor.createdAt ||
    (message.createdAt.getTime() === cursor.createdAt.getTime() &&
      message.id.value < cursor.id)
  );
}

function isAfter(message: Message, cursor: MessagePageCursor): boolean {
  return (
    message.createdAt > cursor.createdAt ||
    (message.createdAt.getTime() === cursor.createdAt.getTime() &&
      message.id.value > cursor.id)
  );
}

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

  findPage(params: FindMessagesPageParams): Promise<Message[]> {
    const sorted = [...this.messages].sort(compareByCreatedAtAndId);

    if (params.after) {
      const page = sorted
        .filter((message) => isAfter(message, params.after!))
        .slice(0, params.limit);

      return Promise.resolve(page.map((message) => this.reconstitute(message)));
    }

    const candidates = params.before
      ? sorted.filter((message) => isBefore(message, params.before!))
      : sorted;
    const page = candidates.slice(-params.limit).reverse();

    return Promise.resolve(page.map((message) => this.reconstitute(message)));
  }

  savedMessages(): readonly Message[] {
    return this.messages;
  }

  private reconstitute(message: Message): Message {
    return Message.reconstitute({
      id: message.id,
      author: MessageAuthor.create(
        message.author.id,
        Nickname.from(this.nicknames.get(message.author.id.value) ?? 'unknown'),
      ),
      content: message.content,
      createdAt: message.createdAt,
    });
  }
}
