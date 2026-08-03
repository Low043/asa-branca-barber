import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { MeetingStatus } from '@generated/prisma/enums';
import { CreateMeetingDto } from './dtos/meetings.dto';
import { getLocalDateTime } from '../../utils/scheduleTime.util';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getActives(barberPhone: string) {
    return await this.prismaService.meeting.findMany({
      where: {
        status: MeetingStatus.SCHEDULED,
        date: { gte: getLocalDateTime() },
        service: { barberPhone },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getByUser(phone: string) {
    return await this.prismaService.meeting.findMany({
      where: {
        userPhone: phone,
        status: MeetingStatus.SCHEDULED,
        date: { gte: getLocalDateTime() },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getCompletedByBarber(barberPhone: string, year: number, month: number) {
    const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));

    return await this.prismaService.meeting.findMany({
      where: {
        status: MeetingStatus.COMPLETED,
        date: { gte: start, lt: end },
        service: { barberPhone },
      },
      orderBy: { date: 'desc' },
      include: { service: true },
    });
  }

  async create(dto: CreateMeetingDto) {
    const service = await this.prismaService.service.findUnique({
      where: { id: dto.serviceId },
      select: { id: true, name: true, priceCents: true, barberPhone: true },
    });

    if (!service) {
      throw new NotFoundException('Serviço não encontrado');
    }

    const existingMeeting = await this.prismaService.meeting.findFirst({
      where: {
        date: dto.date,
        status: MeetingStatus.SCHEDULED,
        serviceId: dto.serviceId,
      },
      select: { id: true },
    });

    if (existingMeeting) {
      throw new ConflictException('Horário indisponível para agendamento');
    }

    await this.prismaService.user.createMany({
      data: [{ phone: dto.userPhone }],
      skipDuplicates: true,
    });

    const meeting = await this.prismaService.meeting.create({
      data: {
        date: dto.date,
        clientName: dto.clientName,
        userPhone: dto.userPhone,
        serviceId: dto.serviceId,
        priceCents: service.priceCents,
      },
      include: { service: true },
    });

    // Notifica o barbeiro
    void this.notificationsService.notifyBarber(
      meeting.service.barberPhone,
      'Novo Agendamento!',
      `${meeting.clientName} agendou ${meeting.service.name} para ${meeting.date.toLocaleString('pt-BR')}`,
    );

    return meeting;
  }

  async delete(id: string, userPhone: string) {
    // Busca a reunião para verificar quem está cancelando
    const meeting = await this.prismaService.meeting.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!meeting) return null;

    // Apenas o cliente dono ou o barbeiro do serviço podem cancelar
    if (meeting.userPhone !== userPhone && meeting.service.barberPhone !== userPhone) {
      throw new ConflictException('Não autorizado a cancelar este agendamento');
    }

    const cancelled = await this.prismaService.meeting.update({
      where: { id },
      data: { status: MeetingStatus.CANCELLED },
    });

    // Se quem cancelou NÃO foi o próprio barbeiro, notifica o barbeiro
    if (userPhone !== meeting.service.barberPhone) {
      void this.notificationsService.notifyBarber(
        meeting.service.barberPhone,
        'Agendamento Cancelado',
        `${meeting.clientName} cancelou o horário de ${meeting.date.toLocaleString('pt-BR')}`,
      );
    }

    return cancelled;
  }
}
