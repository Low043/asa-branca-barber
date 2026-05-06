import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class HelloService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHello(): Promise<string> {
    const userCount = await this.prismaService.user.count();

    return `Hello da VM! Total de usuários: ${userCount}`;
  }
}
