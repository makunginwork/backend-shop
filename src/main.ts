import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true, // แปลง payload เป็น class ตาม DTO 
    transformOptions: { enableImplicitConversion: true },
  }));

  // สำคัญมาก! ต้องเปิด CORS เพื่อให้ Next.js เรียก API ได้
  app.enableCors(); // [cite: 7, 9]

  await app.listen(3000);
}
bootstrap();