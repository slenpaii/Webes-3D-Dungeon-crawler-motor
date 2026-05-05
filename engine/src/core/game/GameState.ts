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
    private exploredTiles: Set<string>;

    constructor(map: Map, hero: Hero, monsters: Monster[], exitPosition: GridPosition | null = null) {
        this.map = map;
        this.hero = hero;
        this.monsters = monsters;
        this.turnCount = 0;
        this.isGameOver = false;
        this.isGameWon = false;
        this.exitPosition = exitPosition;
        this.exploredTiles = new Set<string>();
        this.markVisibleTilesExplored(hero.getX(), hero.getY(), 3);
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

    public markTileExplored(x: number, y: number): void {
        this.exploredTiles.add(`${x},${y}`);
    }

    public markVisibleTilesExplored(centerX: number, centerY: number, visionRange: number): void {
        for (let y = centerY - visionRange; y <= centerY + visionRange; y++) {
            for (let x = centerX - visionRange; x <= centerX + visionRange; x++) {
                if (!this.map.isInside(x, y)) {
                    continue;
                }

            if (!this.map.isWalkable(x, y)) {
                continue;
            }

            if (!this.hasLineOfSight(centerX, centerY, x, y)) {
                continue;
            }

            this.markTileExplored(x, y);
            }
        }
    }

    private hasLineOfSight(startX: number, startY: number, targetX: number, targetY: number): boolean {
        const steps = Math.max(
            Math.abs(targetX - startX),
            Math.abs(targetY - startY)
        );

        for (let i = 1; i < steps; i++) {
            const checkX = Math.round(startX + ((targetX - startX) * i) / steps);
            const checkY = Math.round(startY + ((targetY - startY) * i) / steps);

            if (!this.map.isWalkable(checkX, checkY)) {
                return false;
            }
        }

        return true;
    }

    public isTileExplored(x: number, y: number): boolean {
        return this.exploredTiles.has(`${x},${y}`);
    }

}