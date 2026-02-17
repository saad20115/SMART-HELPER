import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

let appPromise: Promise<any>;

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
        app.setGlobalPrefix('api');
        app.enableCors({
            origin: '*',
            credentials: true,
        });
        app.useGlobalFilters(new AllExceptionsFilter());
        await app.init();
        return app.getHttpAdapter().getInstance();
    } catch (error) {
        console.error('Failed to bootstrap NestJS app:', error);
        throw error;
    }
}

export default async function handler(req: any, res: any) {
    try {
        if (!appPromise) {
            appPromise = bootstrap();
        }
        const app = await appPromise;
        return app(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
