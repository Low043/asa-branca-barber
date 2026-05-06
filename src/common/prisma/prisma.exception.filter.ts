import { ArgumentsHost, Catch, ExceptionFilter, Global } from '@nestjs/common';
import { Prisma } from '@generated/prisma/client';
import { Response, Request } from 'express';

@Global()
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let message = 'Erro interno no banco de dados';
    let status = 500;

    switch (exception.code) {
      case 'P2025':
        const modelName = exception.meta?.modelName || 'Registro';
        message = `${modelName} não encontrado para realizar a operação.`;
        status = 404;
        break;

      default:
        console.error('Prisma Client Error:', exception);
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
