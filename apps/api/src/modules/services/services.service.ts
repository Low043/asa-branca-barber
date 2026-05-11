import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dtos/service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getActives() {
    return await this.prismaService.service.findMany({ where: { isActive: true } });
  }

  async create(dto: CreateServiceDto) {
    return await this.prismaService.service.create({ data: dto });
  }

  async update(id: string, dto: UpdateServiceDto) {
    return await this.prismaService.service.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    return await this.prismaService.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
