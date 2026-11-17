import 'reflect-metadata';
import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'web-api/.env')
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

async function bootstrap(): Promise<void> {
  // bufferLogs holds bootstrap output until pino is resolved, so nothing is
  // written in the default format before the logger is swapped in.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const port = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(cookieParser());

  await app.listen(port);
}

void bootstrap();
