import 'reflect-metadata';
import './load-env';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import express from 'express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

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
