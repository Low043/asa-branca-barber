import { ConflictException, Injectable } from '@nestjs/common';
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

  async create(dto: CreateMeetingDto) {
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
      data: dto,
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
