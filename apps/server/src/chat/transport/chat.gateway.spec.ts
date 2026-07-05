import type { Server } from 'socket.io';
import { SystemClock } from '../../common/clock/system-clock';
import { FakeIdGenerator } from '../../common/id/testing/fake-id-generator';
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
  const sendMessage = new SendMessageUseCase(
    repository,
    new SystemClock(),
    new FakeIdGenerator(),
  );
  const resolveUser = {} as ResolveUserByTokenUseCase;

  const gateway = new ChatGateway(resolveUser, sendMessage);
  const server: MockServer = { emit: jest.fn() };
  gateway.server = server as unknown as Server;

  return { gateway, server };
}

type PresenceSocket = Parameters<ChatGateway['handleUserOnline']>[0];

function socketFor(
  user?: User,
  id = 'socket-1',
): { socket: PresenceSocket; broadcast: jest.Mock } {
  const broadcast = jest.fn();
  const socket = {
    id,
    data: { user },
    broadcast: { emit: broadcast },
  } as unknown as PresenceSocket;

  return { socket, broadcast };
}

function messageBody(content: string): SendMessageBodyDto {
  return { content };
}

describe('ChatGateway', () => {
  const author = User.create(
    Nickname.from('alice'),
    new SystemClock(),
    new FakeIdGenerator(),
  );

  describe('messages', () => {
    it('persists, broadcasts and acks a valid message', async () => {
      const { gateway, server } = buildGateway();
      const { socket } = socketFor(author);

      const ack = await gateway.handleSend(messageBody('hello world'), socket);

      expect(ack.ok).toBe(true);
      if (!ack.ok) {
        throw new Error('expected a successful ack');
      }

      expect(ack.data.content).toBe('hello world');
      expect(ack.data.authorId).toBe(author.id.value);
      expect(ack.data.nickname).toBe('alice');

      expect(server.emit).toHaveBeenCalledWith('message:new', ack.data);
    });

    it('acks an error for empty content without broadcasting', async () => {
      const { gateway, server } = buildGateway();
      const { socket } = socketFor(author);

      const ack = await gateway.handleSend(messageBody('   '), socket);

      expect(ack.ok).toBe(false);
      if (ack.ok) {
        throw new Error('expected a failed ack');
      }

      expect(ack.error.code).toBe('MESSAGE_EMPTY');
      expect(server.emit).not.toHaveBeenCalled();
    });

    it('acks unauthorized when the socket has no user', async () => {
      const { gateway, server } = buildGateway();
      const { socket } = socketFor();

      const ack = await gateway.handleSend(messageBody('hi'), socket);

      expect(ack.ok).toBe(false);
      if (ack.ok) {
        throw new Error('expected a failed ack');
      }

      expect(ack.error.code).toBe('UNAUTHORIZED');
      expect(server.emit).not.toHaveBeenCalled();
    });
  });

  describe('presence', () => {
    it('announces the user online and returns the current roster', () => {
      const { gateway } = buildGateway();
      const { socket, broadcast } = socketFor(author);

      const ack = gateway.handleUserOnline(socket);

      expect(ack.ok).toBe(true);
      if (!ack.ok) {
        throw new Error('expected a successful ack');
      }

      expect(ack.data).toEqual([
        { userId: author.id.value, nickname: 'alice' },
      ]);
      expect(broadcast).toHaveBeenCalledWith('user:online', {
        userId: author.id.value,
        nickname: 'alice',
      });
    });

    it('acks unauthorized when announcing without a user', () => {
      const { gateway } = buildGateway();
      const { socket, broadcast } = socketFor();

      const ack = gateway.handleUserOnline(socket);

      expect(ack.ok).toBe(false);
      if (ack.ok) {
        throw new Error('expected a failed ack');
      }

      expect(ack.error.code).toBe('UNAUTHORIZED');
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('does not re-broadcast online when the same user opens a second tab', () => {
      const { gateway } = buildGateway();
      const tabOne = socketFor(author, 'socket-1');
      const tabTwo = socketFor(author, 'socket-2');

      gateway.handleUserOnline(tabOne.socket);
      const secondAck = gateway.handleUserOnline(tabTwo.socket);

      expect(tabTwo.broadcast).not.toHaveBeenCalled();
      if (!secondAck.ok) {
        throw new Error('expected a successful ack');
      }
      expect(secondAck.data).toHaveLength(1);
    });

    it('broadcasts user:offline when the last socket disconnects', () => {
      const { gateway, server } = buildGateway();
      const { socket } = socketFor(author);

      gateway.handleUserOnline(socket);
      gateway.handleDisconnect(socket);

      expect(server.emit).toHaveBeenCalledWith('user:offline', author.id.value);
    });

    it('stays online while another tab remains connected', () => {
      const { gateway, server } = buildGateway();
      const tabOne = socketFor(author, 'socket-1');
      const tabTwo = socketFor(author, 'socket-2');

      gateway.handleUserOnline(tabOne.socket);
      gateway.handleUserOnline(tabTwo.socket);

      gateway.handleDisconnect(tabOne.socket);
      expect(server.emit).not.toHaveBeenCalledWith(
        'user:offline',
        author.id.value,
      );

      gateway.handleDisconnect(tabTwo.socket);
      expect(server.emit).toHaveBeenCalledWith('user:offline', author.id.value);
    });
  });
});
