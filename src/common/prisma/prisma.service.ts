import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaConfig } from './prisma.config';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly config: PrismaConfig) {
    const adapter = new PrismaPg({ connectionString: config.url });
    super({ adapter });
  }
}
