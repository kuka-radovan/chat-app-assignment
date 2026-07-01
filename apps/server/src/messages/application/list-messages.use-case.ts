import type { Message } from '../domain/message';
import type {
  MessagePageCursor,
  MessageRepository,
} from '../domain/message.repository';

export interface ListMessagesParams {
  limit?: number;
  before?: MessagePageCursor;
  after?: MessagePageCursor;
}

export class ListMessagesUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly defaultPageSize: number,
  ) {}

  async execute(params: ListMessagesParams = {}): Promise<Message[]> {
    const limit = params.limit ?? this.defaultPageSize;
    const messages = await this.messageRepository.findPage({
      limit,
      before: params.before,
      after: params.after,
    });

    if (params.after) {
      return messages;
    }

    return [...messages].reverse();
  }
}
