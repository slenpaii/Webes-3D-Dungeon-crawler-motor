import { Map } from "../map/Map";
import { Hero } from "./Hero";
import { Monster } from "./Monster";
import type { GridPosition } from "../map/MapData";

export class GameState {

    private map: Map;
    private hero: Hero;
    private monsters: Monster[];
    private turnCount: number;
    private isGameWon: boolean;
    private isGameOver: boolean;
    private exitPosition: GridPosition | null;

    constructor(map: Map, hero: Hero, monsters: Monster[], exitPosition: GridPosition | null = null) {
        this.map = map;
        this.hero = hero;
        this.monsters = monsters;
        this.turnCount = 0;
        this.isGameOver = false;
        this.isGameWon = false;
        this.exitPosition = exitPosition;
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

    public getIsGameWon(): boolean {
        return this.isGameWon;
    }

    public getExitPosition(): GridPosition | null {
        return this.exitPosition;
    }

    public setGameOver(): void {
        this.isGameOver = true;
    }

    public setGameWon(): void {
        this.isGameWon = true;
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