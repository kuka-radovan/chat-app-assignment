import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { ListUserDto } from '@chat/shared';
import type { Server, Socket } from 'socket.io';
import { USER_REGISTERED_EVENT } from '../../common/events/user-registered.event';
import { config } from '../../config';
import { ResolveUserByTokenUseCase } from '../../users/application/resolve-user-by-token.use-case';
import type { User } from '../../users/domain/user';
import { InvalidAuthTokenError } from '../../users/domain/value-objects/auth-token';

type AuthenticatedSocket = Socket<
  Record<string, never>,
  Record<string, never>,
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

@WebSocketGateway({ cors: { origin: config.CORS_ORIGIN } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly resolveUser: ResolveUserByTokenUseCase) {}

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

  @OnEvent(USER_REGISTERED_EVENT)
  handleUserRegistered(user: ListUserDto): void {
    this.server.emit('user:registered', user);
  }
}
