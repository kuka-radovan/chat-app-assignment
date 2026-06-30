import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module';
import { config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: config.CORS_ORIGIN });
  app.enableShutdownHooks();

  const openApiDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Chat API')
      .setDescription('HTTP API for the realtime chat application')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(openApiDoc));

  await app.listen(config.SERVER_PORT, '0.0.0.0');
}
void bootstrap();
