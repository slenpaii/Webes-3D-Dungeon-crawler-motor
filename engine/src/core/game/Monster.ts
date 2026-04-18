import { Entity } from "./Entity";

export type EnemyState = "IDLE" | "CHASE" | "SEARCH";
export class Monster extends Entity {

    private state: EnemyState;
    private lastKnownHeroX: number | null;
    private lastKnownHeroY: number | null;
    private searchTurnCount: number;
    private reachedSearchTarget: boolean;
    private previousX: number | null;
    private previousY: number | null;

    constructor(x: number, y: number, hp: number, attack: number, defense: number) {
        super(x, y, hp, attack, defense);
        this.state = "IDLE";
        this.lastKnownHeroX = null;
        this.lastKnownHeroY = null;
        this.searchTurnCount = 0;
        this.reachedSearchTarget = false;
        this.previousX = null;
        this.previousY = null;
    }
    
    public getState(): EnemyState {
        return this.state;
    }

    public getSearchTurnCount(): number {
        return this.searchTurnCount;
    }

    public hasReachedSearchTarget(): boolean {
        return this.reachedSearchTarget;
    }

    public getPreviousPosition(): { x: number; y: number } | null {
        if (this.previousX === null || this.previousY === null) {
            return null;
        }

        return {
            x: this.previousX,
            y: this.previousY
        };
    }

    public savePreviousPosition(): void {
        this.previousX = this.getX();
        this.previousY = this.getY();
    }

    public clearPreviousPosition(): void {
        this.previousX = null;
        this.previousY = null;
    }

    public setReachedSearchTarget(value: boolean): void {
        this.reachedSearchTarget = value;
    }

    public resetReachedSearchTarget(): void {
        this.reachedSearchTarget = false;
    }

    public setState(state: EnemyState): void {
        this.state = state;
    }

    public setLastKnownHeroPosition(x: number, y: number): void {
        this.lastKnownHeroX = x;
        this.lastKnownHeroY = y;
    }

    public clearLastKnownHeroPosition(): void {
        this.lastKnownHeroX = null;
        this.lastKnownHeroY = null;
    }

    public getLastKnownHeroPosition(): { x: number; y: number } | null {
        if (this.lastKnownHeroX === null || this.lastKnownHeroY === null) {
            return null;
        }

        return {
            x: this.lastKnownHeroX,
            y: this.lastKnownHeroY
        };
    }

    public incrementSearchTurnCount(): void {
        this.searchTurnCount++;
    }

    public resetSearchTurnCount(): void {
        this.searchTurnCount = 0;
    }

}