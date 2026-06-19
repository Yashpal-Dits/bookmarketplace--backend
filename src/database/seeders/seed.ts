import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AdminSeeder } from './admin.seeder';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Seed');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);

    logger.log('Running seeders...');

    const adminSeeder = app.get(AdminSeeder);
    await adminSeeder.seed();

    await app.close();
    logger.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seed failed', error);
    process.exit(1);
  }
}

bootstrap();