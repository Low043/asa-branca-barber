import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UserRole } from '@generated/prisma/enums';
import { MeetingStatus } from '@generated/prisma/client';
import { CreateBarberDto, UpdateBarberDto } from './dtos/barber.dto';

const ADMIN_NAME = 'thales';

@Injectable()
export class BarbersService {
  constructor(private readonly prismaService: PrismaService) {}

  private async assertAdmin(phone: string) {
    const user = await this.prismaService.user.findUnique({
      where: { phone },
      select: { name: true, role: true },
    });

    if (
      !user ||
      user.role !== UserRole.BARBER ||
      user.name?.toLowerCase() !== ADMIN_NAME
    ) {
      throw new ForbiddenException('Acesso restrito ao administrador.');
    }
  }

  async list(requesterPhone: string) {
    await this.assertAdmin(requesterPhone);

    return await this.prismaService.user.findMany({
      where: { role: UserRole.BARBER },
      select: { name: true, phone: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(requesterPhone: string, dto: CreateBarberDto) {
    await this.assertAdmin(requesterPhone);

    const name = dto.name.trim();

    const existing = await this.prismaService.user.findUnique({
      where: { phone: dto.phone },
      select: { phone: true },
    });

    if (existing) {
      throw new BadRequestException('Esse número já está em uso.');
    }

    return await this.prismaService.user.create({
      data: { name, phone: dto.phone, role: UserRole.BARBER },
      select: { name: true, phone: true, role: true },
    });
  }

  async update(requesterPhone: string, barberPhone: string, dto: UpdateBarberDto) {
    await this.assertAdmin(requesterPhone);

    const barber = await this.prismaService.user.findUnique({
      where: { phone: barberPhone },
      select: { role: true },
    });

    if (!barber || barber.role !== UserRole.BARBER) {
      throw new NotFoundException('Barbeiro não encontrado.');
    }

    return await this.prismaService.user.update({
      where: { phone: barberPhone },
      data: { name: dto.name.trim() },
      select: { name: true, phone: true, role: true },
    });
  }

  async delete(requesterPhone: string, barberPhone: string) {
    await this.assertAdmin(requesterPhone);

    const barber = await this.prismaService.user.findUnique({
      where: { phone: barberPhone },
      select: { role: true },
    });

    if (!barber || barber.role !== UserRole.BARBER) {
      throw new NotFoundException('Barbeiro não encontrado.');
    }

    // Evita exclusão inconsistente: bloqueia se houver dados vinculados
    const [activeServices, meetings, schedules, exceptions] = await Promise.all([
      this.prismaService.service.count({ where: { barberPhone } }),
      this.prismaService.meeting.count({
        where: { service: { barberPhone }, status: MeetingStatus.SCHEDULED },
      }),
      this.prismaService.schedule.count({ where: { barberPhone } }),
      this.prismaService.scheduleException.count({ where: { barberPhone } }),
    ]);

    if (activeServices || meetings || schedules || exceptions) {
      throw new BadRequestException(
        'Não é possível excluir um barbeiro com serviços, horários, exceções ou agendamentos vinculados.',
      );
    }

    await this.prismaService.user.delete({ where: { phone: barberPhone } });
  }
}
