import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ListMessagesUseCase } from './application/list-messages.use-case';
import { SendMessageUseCase } from './application/send-message.use-case';
import { MessageRepository } from './domain/message.repository';
import { MessageOrmEntity } from './infrastructure/message.orm-entity';
import { TypeOrmMessageRepository } from './infrastructure/typeorm-message.repository';
import { MessagesController } from './transport/messages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MessageOrmEntity]), UsersModule],
  controllers: [MessagesController],
  providers: [
    {
      provide: MessageRepository,
      useClass: TypeOrmMessageRepository,
    },
    {
      provide: SendMessageUseCase,
      useFactory: (messageRepository: MessageRepository) =>
        new SendMessageUseCase(messageRepository),
      inject: [MessageRepository],
    },
    {
      provide: ListMessagesUseCase,
      useFactory: (messageRepository: MessageRepository) =>
        new ListMessagesUseCase(messageRepository),
      inject: [MessageRepository],
    },
  ],
  exports: [SendMessageUseCase, ListMessagesUseCase, MessageRepository],
})
export class MessagesModule {}
