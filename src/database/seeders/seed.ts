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
    logger.log(' Seed completed successfully');
    process.exit(0);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(` Seed failed: ${msg}`);
    process.exit(1);
  }
}

bootstrap();