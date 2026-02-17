import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const responseBody = exception.getResponse();
            message = typeof responseBody === 'string' ? responseBody : (responseBody as any).message || message;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        console.error('Unhandled Exception:', exception);

        response.status(status).json({
            statusCode: status,
            success: false,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message || 'Internal server error',
            error: exception instanceof Error ? exception.name : 'UnknownError',
        });
    }
}
