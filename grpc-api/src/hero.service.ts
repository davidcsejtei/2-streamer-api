import { Injectable } from '@nestjs/common';

interface Hero {
  id: number;
  name: string;
}

@Injectable()
export class HeroService {
  private readonly heroes: Hero[] = [
    { id: 1, name: 'Superman' },
    { id: 2, name: 'Batman' },
    { id: 3, name: 'Wonder Woman' },
  ];

  findOne(id: number): Hero {
    const hero = this.heroes.find(hero => hero.id === id);
    if (!hero) {
      throw new Error(`Hero with id ${id} not found`);
    }
    return hero;
  }

  findMany(): Hero[] {
    return this.heroes;
  }

  createHero(name: string): Hero {
    const newHero = {
      id: Math.max(...this.heroes.map(h => h.id)) + 1,
      name,
    };
    this.heroes.push(newHero);
    return newHero;
  }
}