import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  Ack,
  ClientToServerEvents,
  ListUserDto,
  MessageDto,
  ServerToClientEvents,
} from '@chat/shared';
import type { Server, Socket } from 'socket.io';
import { config } from '../../config';
import { SendMessageUseCase } from '../../messages/application/send-message.use-case';
import { SendMessageBodyDto } from '../../messages/transport/dto/send-message.body';
import {
  MessageEmptyError,
  MessageTooLongError,
} from '../../messages/domain/value-objects/message-content';
import { MessagePresenter } from '../../messages/transport/presenters/message.presenter';
import { ResolveUserByTokenUseCase } from '../../users/application/resolve-user-by-token.use-case';
import type { User } from '../../users/domain/user';
import { InvalidAuthTokenError } from '../../users/domain/value-objects/auth-token';

type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  { user?: User }
>;

function readAuthToken(auth: unknown): string | null {
  if (
    auth !== null &&
    typeof auth === 'object' &&
    'token' in auth &&
    typeof auth.token === 'string'
  ) {
    return auth.token;
  }

  return null;
}

function toAckError(error: unknown): Ack<MessageDto> {
  if (error instanceof MessageEmptyError) {
    return {
      ok: false,
      error: { code: 'MESSAGE_EMPTY', message: error.message },
    };
  }

  if (error instanceof MessageTooLongError) {
    return {
      ok: false,
      error: { code: 'MESSAGE_TOO_LONG', message: error.message },
    };
  }

  throw error;
}

interface OnlineUser {
  user: ListUserDto;
  socketIds: Set<string>;
}

@WebSocketGateway({ cors: { origin: config.CORS_ORIGIN } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly onlineUsers = new Map<string, OnlineUser>();

  constructor(
    private readonly resolveUser: ResolveUserByTokenUseCase,
    private readonly sendMessage: SendMessageUseCase,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const token = readAuthToken(client.handshake.auth);
    if (token === null) {
      client.disconnect();
      return;
    }

    try {
      const user = await this.resolveUser.execute(token);
      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
    } catch (error) {
      if (error instanceof InvalidAuthTokenError) {
        client.disconnect();
        return;
      }

      throw error;
    }
  }

  @SubscribeMessage('message:send')
  async handleSend(
    @MessageBody() dto: SendMessageBodyDto,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<Ack<MessageDto>> {
    const user = client.data.user;
    if (!user) {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      };
    }

    try {
      const message = await this.sendMessage.execute({
        authorId: user.id,
        content: dto.content,
      });

      const payload = MessagePresenter.toDto(message, user.nickname.value);
      this.server.emit('message:new', payload);

      return { ok: true, data: payload };
    } catch (error) {
      return toAckError(error);
    }
  }

  @SubscribeMessage('user:online')
  handleUserOnline(
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Ack<ListUserDto[]> {
    const user = client.data.user;
    if (!user) {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      };
    }

    const dto: ListUserDto = {
      userId: user.id.value,
      nickname: user.nickname.value,
    };

    const existing = this.onlineUsers.get(dto.userId);
    if (existing) {
      existing.socketIds.add(client.id);
    } else {
      this.onlineUsers.set(dto.userId, {
        user: dto,
        socketIds: new Set([client.id]),
      });
      client.broadcast.emit('user:online', dto);
    }

    const roster = [...this.onlineUsers.values()].map((entry) => entry.user);
    return { ok: true, data: roster };
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const user = client.data.user;
    if (!user) {
      return;
    }

    const entry = this.onlineUsers.get(user.id.value);
    if (!entry) {
      return;
    }

    entry.socketIds.delete(client.id);
    if (entry.socketIds.size === 0) {
      this.onlineUsers.delete(user.id.value);
      this.server.emit('user:offline', user.id.value);
    }
  }
}
