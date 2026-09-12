import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UserRole } from '@generated/prisma/enums';
import {
  CreateProductDto,
  CreateSaleDto,
  UpdateProductDto,
} from './dtos/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  private async assertBarber(phone: string) {
    const user = await this.prismaService.user.findUnique({
      where: { phone },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.BARBER) {
      throw new ForbiddenException('Acesso restrito a barbeiros.');
    }
  }

  async list(barberPhone: string) {
    await this.assertBarber(barberPhone);

    return await this.prismaService.product.findMany({
      where: { barberPhone, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(barberPhone: string, dto: CreateProductDto) {
    await this.assertBarber(barberPhone);

    return await this.prismaService.product.create({
      data: { ...dto, barberPhone },
    });
  }

  async update(id: string, barberPhone: string, dto: UpdateProductDto) {
    await this.assertBarber(barberPhone);

    return await this.prismaService.product.update({
      where: { id, barberPhone },
      data: dto,
    });
  }

  async delete(id: string, barberPhone: string) {
    await this.assertBarber(barberPhone);

    return await this.prismaService.product.update({
      where: { id, barberPhone },
      data: { isActive: false },
    });
  }

  async registerSale(productId: string, barberPhone: string, dto: CreateSaleDto) {
    await this.assertBarber(barberPhone);

    return await this.prismaService.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, barberPhone, isActive: true },
      });

      if (!product) {
        throw new NotFoundException('Produto não encontrado.');
      }

      if (product.quantity < dto.quantity) {
        throw new BadRequestException('Estoque insuficiente.');
      }

      await tx.product.update({
        where: { id: productId },
        data: { quantity: { decrement: dto.quantity } },
      });

      return await tx.productSale.create({
        data: {
          quantity: dto.quantity,
          priceCents: product.priceCents * dto.quantity,
          productName: product.name,
          productId,
          barberPhone,
        },
      });
    });
  }

  async listSales(barberPhone: string, year: number, month: number) {
    await this.assertBarber(barberPhone);

    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));

    return await this.prismaService.productSale.findMany({
      where: { barberPhone, date: { gte: start, lt: end } },
      orderBy: { date: 'desc' },
    });
  }

  async cancelSale(saleId: string, barberPhone: string) {
    await this.assertBarber(barberPhone);

    await this.prismaService.$transaction(async (tx) => {
      const sale = await tx.productSale.findFirst({
        where: { id: saleId, barberPhone },
      });

      if (!sale) {
        throw new NotFoundException('Venda não encontrada.');
      }

      await tx.productSale.delete({ where: { id: saleId } });

      await tx.product.update({
        where: { id: sale.productId },
        data: { quantity: { increment: sale.quantity } },
      });
    });
  }
}
