import { Map } from "../map/Map";
import { Hero } from "./Hero";
import { Monster } from "./Monster";

export class GameState {

    private map: Map;
    private hero: Hero;
    private monsters: Monster[];

    constructor(map: Map, hero: Hero, monsters: Monster[]) {
        this.map = map;
        this.hero = hero;
        this.monsters = monsters;
    }

    // Getterek
    public getMap(): Map {
        return this.map;
    }

    public getHero(): Hero {
        return this.hero;
    }

    public getMonsters(): Monster[] {
        return this.monsters;
    }

}