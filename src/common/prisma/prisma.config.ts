import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaConfig {
  public readonly url: string;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl || databaseUrl.trim() === '') {
      throw new Error('DATABASE_URL não encontrada');
    }

    try {
      const url = new URL(databaseUrl);
      if (url.protocol !== 'postgresql:') {
        throw new Error('DATABASE_URL deve ser uma URL PostgreSQL');
      }
    } catch {
      throw new Error('DATABASE_URL invalida');
    }

    this.url = databaseUrl;
  }
}
