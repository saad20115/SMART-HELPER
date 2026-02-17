"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// Import reflect-metadata before anything else - required for NestJS decorators
require("reflect-metadata");
require("dotenv/config");

const { NestFactory } = require("@nestjs/core");
const { AppModule } = require("../dist/src/app.module");

let appPromise;

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
        app.setGlobalPrefix('api');
        app.enableCors({
            origin: '*',
            credentials: true,
        });
        await app.init();
        return app.getHttpAdapter().getInstance();
    } catch (error) {
        console.error('Failed to bootstrap NestJS app:', error);
        throw error;
    }
}

module.exports = async function handler(req, res) {
    try {
        if (!appPromise) {
            appPromise = bootstrap();
        }
        const app = await appPromise;
        return app(req, res);
    } catch (error) {
        console.error('Handler error:', error);
        appPromise = null;
        res.status(500).json({
            statusCode: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
