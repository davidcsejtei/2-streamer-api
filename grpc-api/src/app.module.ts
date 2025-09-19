import { Module } from '@nestjs/common';
import { HeroController } from './hero.controller';
import { HeroService } from './hero.service';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  imports: [],
  controllers: [HeroController, VideoController],
  providers: [HeroService, VideoService],
})
export class AppModule {}
