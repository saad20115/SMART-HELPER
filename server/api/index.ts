import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let appPromise: Promise<any>;

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: '*',
        credentials: true,
    });
    await app.init();
    return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
    if (!appPromise) {
        appPromise = bootstrap();
    }
    const app = await appPromise;
    return app(req, res);
}
