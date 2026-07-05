import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZodValidationPipe } from 'nestjs-zod';
import { CommonModule } from './common/common.module';
import { getNestTypeOrmOptions } from './database/typeorm.options';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getNestTypeOrmOptions()),
    CommonModule,
    HealthModule,
    UsersModule,
    MessagesModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
