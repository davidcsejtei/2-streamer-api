import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ['video'],
        protoPath: [join(__dirname, '../proto/video.proto')],
        url: '0.0.0.0:5003',
      },
    },
  );

  await app.listen();
}
bootstrap();
