import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
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
import { USER_REGISTERED_EVENT } from '../../common/events/user-registered.event';
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

@WebSocketGateway({ cors: { origin: config.CORS_ORIGIN } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

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

  @OnEvent(USER_REGISTERED_EVENT)
  handleUserRegistered(user: ListUserDto): void {
    this.server.emit('user:registered', user);
  }
}
