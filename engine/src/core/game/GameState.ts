import { Map } from "../map/Map";
import { Hero } from "./Hero";
import { Monster } from "./Monster";

export class GameState {

    private map: Map;
    private hero: Hero;
    private monsters: Monster[];
    private turnCount: number;
    private isGameOver: boolean;

    constructor(map: Map, hero: Hero, monsters: Monster[]) {
        this.map = map;
        this.hero = hero;
        this.monsters = monsters;
        this.turnCount = 0;
        this.isGameOver = false;
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

    public getTurnCount(): number {
        return this.turnCount;
    }

    public getIsGameOver(): boolean {
        return this.isGameOver;
    }

    public setGameOver(): void {
        this.isGameOver = true;
    }

    // Megemeli a körök számát
    public incrementTurnCount(): void {
        this.turnCount++;
    }

    // Szörny eltávolítása a játékból (halál esetén)
    public removeMonster(monster: Monster): void {
        this.monsters = this.monsters.filter(currentMonster => currentMonster !== monster);
    }

}