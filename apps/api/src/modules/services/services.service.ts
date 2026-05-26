import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './dtos/service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getActives() {
    return await this.prismaService.service.findMany({
      where: { isActive: true },
      include: { barber: { select: { name: true } } },
    });
  }

  async create(barberPhone: string, dto: CreateServiceDto) {
    return await this.prismaService.service.create({
      data: {
        ...dto,
        barberPhone,
      },
    });
  }

  async update(id: string, barberPhone: string, dto: UpdateServiceDto) {
    return await this.prismaService.service.update({
      where: { id, barberPhone },
      data: dto,
    });
  }

  async delete(id: string, barberPhone: string) {
    return await this.prismaService.service.update({
      where: { id, barberPhone },
      data: { isActive: false },
    });
  }
}
