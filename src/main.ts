import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { CorsOptions } from './config/app/cors.options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(CorsOptions);
  app.use(cookieParser());
  const port = process.env.APP_PORT || 9000;
  await app.listen(port);
}
bootstrap();
