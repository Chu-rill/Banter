import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  // Check if SSL certificates exist for HTTPS in production
  let httpsOptions: { key: Buffer; cert: Buffer } | null = null;
  const isProduction = process.env.NODE_ENV === 'production';
  const sslKeyPath = process.env.SSL_KEY_PATH || './certs/server.key';
  const sslCertPath = process.env.SSL_CERT_PATH || './certs/server.crt';

  if (
    isProduction ||
    (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath))
  ) {
    try {
      httpsOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      };
      console.log('✅ HTTPS enabled with SSL certificates');
    } catch (error) {
      console.warn('⚠️  SSL certificates not found, falling back to HTTP');
      httpsOptions = null;
    }
  }

  // CORS configuration
  const corsOrigin = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000', 'https://localhost:3001'];

  const nestAppOptions: any = {
    cors: {
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    },
  };

  if (httpsOptions) {
    nestAppOptions.httpsOptions = httpsOptions;
  }

  const app = await NestFactory.create(AppModule, nestAppOptions);

  app.useWebSocketAdapter(new IoAdapter(app));

  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('/api/v1');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Vidora API')
    .setDescription('The Vidora API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // <-- custom name to reference later
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('PORT') || 5000;
  const protocol = httpsOptions ? 'https' : 'http';

  await app.listen(port);

  console.log(`🚀 Banter Server started successfully!`);
  console.log(`📍 Server: ${protocol}://localhost:${port}`);
  console.log(`📚 API Docs: ${protocol}://localhost:${port}/api`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${corsOrigin.join(', ')}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
