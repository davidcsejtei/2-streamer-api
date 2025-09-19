import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { HeroService } from './hero.service';

interface Hero {
  id: number;
  name: string;
}

interface HeroById {
  id: number;
}

interface CreateHeroRequest {
  name: string;
}

@Controller()
export class HeroController {
  constructor(private readonly heroService: HeroService) {}

  @GrpcMethod('HeroService', 'FindOne')
  findOne(data: HeroById): Hero {
    return this.heroService.findOne(data.id);
  }

  @GrpcMethod('HeroService', 'FindMany')
  findMany(): { heroes: Hero[] } {
    return { heroes: this.heroService.findMany() };
  }

  @GrpcMethod('HeroService', 'CreateHero')
  createHero(data: CreateHeroRequest): Hero {
    return this.heroService.createHero(data.name);
  }
}