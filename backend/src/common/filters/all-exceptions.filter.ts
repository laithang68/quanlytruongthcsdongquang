import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Đã có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau.';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resObj = exception.getResponse();
      if (typeof resObj === 'string') {
        message = resObj;
      } else if (typeof resObj === 'object' && resObj !== null) {
        const anyRes = resObj as any;
        message = anyRes.message || anyRes.thong_bao || anyRes.error || message;
        if (Array.isArray(message)) {
          message = message.join(', ');
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled Exception [${request.method} ${request.url}]: ${exception.message}`,
        exception.stack,
      );

      const isProduction = process.env.NODE_ENV === 'production';
      if (!isProduction) {
        message = exception.message;
        errorDetails = exception.stack;
      } else {
        // Trong production, không làm lộ stack trace, Prisma connection string, mật khẩu, file path
        message = 'Lỗi xử lý hệ thống. Vui lòng liên hệ quản trị viên.';
      }
    } else {
      this.logger.error(`Unknown Exception [${request.method} ${request.url}]:`, exception);
    }

    // Đảm bảo giữ đúng HTTP status code (400, 401, 403, 404, 409, 429, 500, ...)
    const responseBody: any = {
      thanh_cong: false,
      thong_bao: message,
      ma_loi: status,
      duong_dan: request.url,
      thoi_gian: new Date().toISOString(),
    };

    if (errorDetails && process.env.NODE_ENV !== 'production') {
      responseBody.chi_tiet = errorDetails;
    }

    response.status(status).json(responseBody);
  }
}
