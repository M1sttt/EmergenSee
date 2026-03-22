import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
    const swaggerConfig = new DocumentBuilder()
        .setTitle('EmergenSee API')
        .setDescription('REST API for the EmergenSee emergency response platform')
        .setVersion('1.0.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT access token',
            },
            'access-token',
        )
        .addServer('https://emergensee.cs.colman.ac.il/api', 'Production Server')
        .addServer('http://localhost:3001', 'Local Development')
        .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
        deepScanRoutes: true,
    });

    SwaggerModule.setup('docs', app, swaggerDocument, {
        useGlobalPrefix: true,
        customSiteTitle: 'EmergenSee API Docs',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'none',
            filter: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });
}
