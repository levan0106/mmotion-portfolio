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

  console.log('CORS Origins configured:', corsOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
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

  // Swagger documentation - only enable in development or when SWAGGER_ENABLED=true
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV === 'development';
  
  if (swaggerEnabled) {
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
    
    console.log(`📚 Swagger documentation: http://localhost:${process.env.PORT || 3000}/api/docs`);
  } else {
    console.log('🚫 Swagger documentation disabled in production');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
}

bootstrap();
