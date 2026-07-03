import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ChatGateway } from './transport/chat.gateway';

@Module({
  imports: [UsersModule],
  providers: [ChatGateway],
})
export class ChatModule {}
