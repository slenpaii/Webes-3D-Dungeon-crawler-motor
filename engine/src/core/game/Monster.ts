import { Entity } from "./Entity";

export type EnemyState = "IDLE" | "CHASE" | "SEARCH";
export class Monster extends Entity {

    private state: EnemyState;
    private lastKnownHeroX: number | null;
    private lastKnownHeroY: number | null;

    constructor(x: number, y: number, hp: number, attack: number, defense: number) {
        super(x, y, hp, attack, defense);
        this.state = "IDLE";
        this.lastKnownHeroX = null;
        this.lastKnownHeroY = null;
    }
    
    public getState(): EnemyState {
        return this.state;
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

}