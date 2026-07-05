import type { Server } from 'socket.io';
import { SendMessageUseCase } from '../../messages/application/send-message.use-case';
import { InMemoryMessageRepository } from '../../messages/application/testing/in-memory-message.repository';
import { SendMessageBodyDto } from '../../messages/transport/dto/send-message.body';
import { User } from '../../users/domain/user';
import { Nickname } from '../../users/domain/value-objects/nickname';
import type { ResolveUserByTokenUseCase } from '../../users/application/resolve-user-by-token.use-case';
import { ChatGateway } from './chat.gateway';

type MockServer = { emit: jest.Mock };

function buildGateway(): { gateway: ChatGateway; server: MockServer } {
  const repository = new InMemoryMessageRepository();
  const sendMessage = new SendMessageUseCase(repository);
  const resolveUser = {} as ResolveUserByTokenUseCase;

  const gateway = new ChatGateway(resolveUser, sendMessage);
  const server: MockServer = { emit: jest.fn() };
  gateway.server = server as unknown as Server;

  return { gateway, server };
}

type SendSocket = Parameters<ChatGateway['handleSend']>[1];

function socketFor(user?: User): SendSocket {
  return { data: { user } } as unknown as SendSocket;
}

function messageBody(content: string): SendMessageBodyDto {
  return { content };
}

describe('ChatGateway', () => {
  const author = User.create(Nickname.from('alice'));

  it('persists, broadcasts and acks a valid message', async () => {
    const { gateway, server } = buildGateway();

    const ack = await gateway.handleSend(
      messageBody('hello world'),
      socketFor(author),
    );

    expect(ack.ok).toBe(true);
    if (!ack.ok) {
      throw new Error('expected a successful ack');
    }

    expect(ack.data.content).toBe('hello world');
    expect(ack.data.authorId).toBe(author.id.value);
    expect(ack.data.nickname).toBe('alice');

    expect(server.emit).toHaveBeenCalledTimes(1);
    expect(server.emit).toHaveBeenCalledWith('message:new', ack.data);
  });

  it('acks an error for empty content without broadcasting', async () => {
    const { gateway, server } = buildGateway();

    const ack = await gateway.handleSend(messageBody('   '), socketFor(author));

    expect(ack.ok).toBe(false);
    if (ack.ok) {
      throw new Error('expected a failed ack');
    }

    expect(ack.error.code).toBe('MESSAGE_EMPTY');
    expect(server.emit).not.toHaveBeenCalled();
  });

  it('acks unauthorized when the socket has no user', async () => {
    const { gateway, server } = buildGateway();

    const ack = await gateway.handleSend(messageBody('hi'), socketFor());

    expect(ack.ok).toBe(false);
    if (ack.ok) {
      throw new Error('expected a failed ack');
    }

    expect(ack.error.code).toBe('UNAUTHORIZED');
    expect(server.emit).not.toHaveBeenCalled();
  });
});
