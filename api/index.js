"use strict";

const path = require("path");

// Add server's node_modules to module search path so we can find NestJS, Prisma, etc.
const serverDir = path.join(__dirname, "..", "server");
module.paths.unshift(path.join(serverDir, "node_modules"));

// Import reflect-metadata before anything else - required for NestJS decorators
require("reflect-metadata");

const { NestFactory } = require("@nestjs/core");

let appPromise;

async function bootstrap() {
    try {
        const { AppModule } = require(path.join(serverDir, "dist", "src", "app.module"));
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
