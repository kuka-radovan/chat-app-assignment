import { Message } from '../domain/message';
import { MessageContent } from '../domain/value-objects/message-content';
import { MessageId } from '../domain/value-objects/message-id';
import { MessageAuthor } from '../domain/value-objects/message-author';
import { UserId } from '../../users/domain/value-objects/user-id';
import { DEFAULT_HISTORY_PAGE_SIZE } from '../../config';
import { ListMessagesUseCase } from './list-messages.use-case';
import { InMemoryMessageRepository } from './testing/in-memory-message.repository';
import type { MessageRepository } from '../domain/message.repository';

const authorId = UserId.from('550e8400-e29b-41d4-a716-446655440000');

function createMessage(params: {
  id: string;
  content: string;
  createdAt: Date;
}): Message {
  return Message.reconstitute({
    id: MessageId.from(params.id),
    author: MessageAuthor.fromId(authorId),
    content: MessageContent.from(params.content),
    createdAt: params.createdAt,
  });
}

function createListMessages(
  repository: MessageRepository,
): ListMessagesUseCase {
  return new ListMessagesUseCase(repository, DEFAULT_HISTORY_PAGE_SIZE);
}

describe('ListMessagesUseCase', () => {
  it('returns an empty list when no messages exist', async () => {
    const repository = new InMemoryMessageRepository();
    const listMessages = createListMessages(repository);

    await expect(listMessages.execute()).resolves.toEqual([]);
  });

  it('returns the latest page oldest-first by default', async () => {
    const repository = new InMemoryMessageRepository();
    const listMessages = createListMessages(repository);

    const first = createMessage({
      id: '10000000-0000-4000-8000-000000000001',
      content: 'first',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const second = createMessage({
      id: '20000000-0000-4000-8000-000000000002',
      content: 'second',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    await repository.save(first);
    await repository.save(second);

    const messages = await listMessages.execute();

    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe(first.id);
    expect(messages[1].id).toBe(second.id);
  });

  it(`defaults to ${DEFAULT_HISTORY_PAGE_SIZE} messages per page`, async () => {
    const repository = new InMemoryMessageRepository();
    const listMessages = createListMessages(repository);

    for (let index = 0; index < DEFAULT_HISTORY_PAGE_SIZE + 5; index += 1) {
      await repository.save(
        createMessage({
          id: `10000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
          content: `message-${index}`,
          createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)),
        }),
      );
    }

    const messages = await listMessages.execute();

    expect(messages).toHaveLength(DEFAULT_HISTORY_PAGE_SIZE);
    expect(messages[0].content.value).toBe('message-5');
    expect(messages.at(-1)?.content.value).toBe(
      `message-${DEFAULT_HISTORY_PAGE_SIZE + 4}`,
    );
  });

  it('returns older messages when a before cursor is provided', async () => {
    const repository = new InMemoryMessageRepository();
    const listMessages = createListMessages(repository);

    const first = createMessage({
      id: '10000000-0000-4000-8000-000000000001',
      content: 'first',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const second = createMessage({
      id: '20000000-0000-4000-8000-000000000002',
      content: 'second',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const third = createMessage({
      id: '30000000-0000-4000-8000-000000000003',
      content: 'third',
      createdAt: new Date('2026-01-03T00:00:00.000Z'),
    });

    await repository.save(first);
    await repository.save(second);
    await repository.save(third);

    const messages = await listMessages.execute({
      before: { createdAt: third.createdAt, id: third.id.value },
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe(first.id);
    expect(messages[1].id).toBe(second.id);
  });

  it('returns newer messages when an after cursor is provided', async () => {
    const repository = new InMemoryMessageRepository();
    const listMessages = createListMessages(repository);

    const first = createMessage({
      id: '10000000-0000-4000-8000-000000000001',
      content: 'first',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const second = createMessage({
      id: '20000000-0000-4000-8000-000000000002',
      content: 'second',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    const third = createMessage({
      id: '30000000-0000-4000-8000-000000000003',
      content: 'third',
      createdAt: new Date('2026-01-03T00:00:00.000Z'),
    });

    await repository.save(first);
    await repository.save(second);
    await repository.save(third);

    const messages = await listMessages.execute({
      after: { createdAt: first.createdAt, id: first.id.value },
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].id).toBe(second.id);
    expect(messages[1].id).toBe(third.id);
  });

  it('uses the composite cursor tie-break when createdAt matches', async () => {
    const repository = new InMemoryMessageRepository();
    const listMessages = createListMessages(repository);
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    const first = createMessage({
      id: '10000000-0000-4000-8000-000000000001',
      content: 'first',
      createdAt,
    });
    const second = createMessage({
      id: '20000000-0000-4000-8000-000000000002',
      content: 'second',
      createdAt,
    });
    const third = createMessage({
      id: '30000000-0000-4000-8000-000000000003',
      content: 'third',
      createdAt,
    });

    await repository.save(first);
    await repository.save(second);
    await repository.save(third);

    const beforePage = await listMessages.execute({
      before: { createdAt, id: third.id.value },
    });
    const afterPage = await listMessages.execute({
      after: { createdAt, id: first.id.value },
    });

    expect(beforePage.map((message) => message.id.value)).toEqual([
      first.id.value,
      second.id.value,
    ]);
    expect(afterPage.map((message) => message.id.value)).toEqual([
      second.id.value,
      third.id.value,
    ]);
  });
});
