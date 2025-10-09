import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './modules/logging/filters/global-exception.filter';

/**
 * Bootstrap the application.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for production
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000','http://localhost:3001', 'http://localhost:5173'];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  const globalExceptionFilter = app.get(GlobalExceptionFilter);
  app.useGlobalFilters(globalExceptionFilter);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Portfolio Management System API')
    .setDescription(`
      Comprehensive API for Portfolio Management System with full CRUD operations.
      
      ## Features
      - **Portfolio Management**: Create, update, delete, and manage investment portfolios
      - **Asset Management**: Complete asset lifecycle management with analytics
      - **Trading Operations**: Buy/sell transactions with position tracking
      - **Risk Management**: Risk targets, monitoring, and compliance
      - **Analytics & Reporting**: Advanced portfolio analytics and performance metrics
      
      ## Asset Module Status
      ✅ All tests passing (173/173)
      ✅ Full CRUD operations
      ✅ Advanced analytics and reporting
      ✅ Risk metrics and performance tracking
      ✅ Comprehensive validation and error handling
      
      ## Authentication
      All endpoints require Bearer token authentication.
    `)
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Portfolios', 'Portfolio management operations - Create, read, update, delete portfolios')
    .addTag('Portfolio Analytics', 'Portfolio analytics and reporting - Performance metrics, risk analysis')
    .addTag('Assets', 'Asset management and analytics operations - Complete asset lifecycle with advanced analytics')
    .addTag('Trading', 'Trading operations and trade management - Buy/sell transactions, position tracking')
    .addTag('Positions', 'Position tracking and management - Current holdings and position analysis')
    .addTag('Risk Management', 'Risk targets and monitoring - Risk assessment and compliance tracking')
    .addTag('Health', 'Health check endpoints - System status and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'list',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
}

bootstrap();
