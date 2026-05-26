import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { UserRole } from '@generated/prisma/enums';
import { LoginDto } from './dtos/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async login(dto: LoginDto) {
    // Busca o usuário pelo telefone
    let user = await this.prismaService.user.findUnique({
      where: { phone: dto.phone },
    });

    // Se não existir, cria como CLIENT com nome NULL
    if (!user) {
      user = await this.prismaService.user.create({
        data: {
          phone: dto.phone,
          name: null,
          role: UserRole.CLIENT,
        },
      });
    } else if (user.role === UserRole.BARBER) {
      // Se for barbeiro, o nome no login deve validar contra o banco
      if (!dto.name || user.name?.toLowerCase() !== dto.name.toLowerCase()) {
        throw new UnauthorizedException('Falha de autenticação');
      }
    }

    // O nome que veio no login tem prioridade para o retorno (sessão do front)
    // Para barbeiros, user.name e dto.name são iguais após a validação acima
    return {
      ...user,
      name: dto.name || user.name,
    };
  }
}
