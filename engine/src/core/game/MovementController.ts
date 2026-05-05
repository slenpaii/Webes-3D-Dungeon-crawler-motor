// TODO: moveForward és moveBackward duplikátumok összevonása közösbe
// TODO: direction enum bevezetése

import { GameState } from "./GameState";
import { Renderer } from "../rendering/Renderer";

export type MovementResult = "MOVED" | "TURNED" | "BLOCKED";
export class MovementController {
    private gameState: GameState;
    private renderer: Renderer;

    // 0: észak, 1: kelet, 2: dél, 3: nyugat
    private direction: number = 0;

    constructor(gameState: GameState, renderer: Renderer, initialDirection: number = 0) {
        this.gameState = gameState;
        this.renderer = renderer;
        this.direction = initialDirection;
    }

    public getDirection(): number {
        return this.direction;
    }


    public handleInput(key: string): MovementResult {
        if (this.renderer.isMoving()) {
            return "BLOCKED";
        }
        
        if (key === "w") {
            return this.moveForward();
        }
        else if (key === "s") {
            return this.moveBackward();
        }
        else if (key === "a") {
            return this.turnLeft();
        }
        else if (key === "d") {
            return this.turnRight();
        }

        return "BLOCKED";
    }

    // Előre lépés
    private moveForward(): MovementResult {
        const hero = this.gameState.getHero();
        const map = this.gameState.getMap();

        const currentX = hero.getX();
        const currentY = hero.getY();

        let targetX = currentX;
        let targetY = currentY;

        switch (this.direction) {
            case 0: // Észak
                targetY = currentY - 1;
                break;
            case 1: // Kelet
                targetX = currentX + 1;
                break;
            case 2: // Dél
                targetY = currentY + 1;
                break;
            case 3: // Nyugat
                targetX = currentX - 1;
                break;
            default:
                console.warn("Ismeretlen irány:", this.direction);
                return "BLOCKED";
        }

        // Megnézi, hogy járható-e a target tile (nincs-e fal/monster)
        if (map.isWalkable(targetX, targetY) && !this.isMonsterAt(targetX, targetY)) {
            hero.setPosition(targetX, targetY);

            this.gameState.markVisibleTilesExplored(targetX, targetY, 3);

            this.renderer.renderHero(hero, map);
            this.renderer.updateCamera(hero, map, this.direction);
            return "MOVED";
        }

        return "BLOCKED";
    }

    // Hátra lépés
    private moveBackward(): MovementResult {
        const hero = this.gameState.getHero();
        const map = this.gameState.getMap();

        const currentX = hero.getX();
        const currentY = hero.getY();

        let targetX = currentX;
        let targetY = currentY;

        switch (this.direction) {
            case 0: // Észak
                targetY = currentY + 1;
                break;
            case 1: // Kelet
                targetX = currentX - 1;
                break;
            case 2: // Dél
                targetY = currentY - 1;
                break;
            case 3: // Nyugat
                targetX = currentX + 1;
                break;
            default:
                console.warn("Ismeretlen irány:", this.direction);
                return "BLOCKED";
        }
        
        // Megnézi, hogy járható-e a target tile (nincs-e fal/monster)
        if (map.isWalkable(targetX, targetY) && !this.isMonsterAt(targetX, targetY)) {
            hero.setPosition(targetX, targetY);

            this.gameState.markVisibleTilesExplored(targetX, targetY, 3);
            
            this.renderer.renderHero(hero, map);
            this.renderer.updateCamera(hero, map, this.direction);
            return "MOVED";
        }

        return "BLOCKED";
    }

    // Balra fordulás
    private turnLeft(): MovementResult {
        const hero = this.gameState.getHero();
        const map = this.gameState.getMap();
        
        this.direction = (this.direction + 3) % 4; // Balra fordulás
        this.renderer.updateCamera(hero, map, this.direction);

        return "TURNED";
    }
    
    // Jobbra fordulás
    private turnRight(): MovementResult {
        const hero = this.gameState.getHero();
        const map = this.gameState.getMap();

        this.direction = (this.direction + 1) % 4; // Jobbra fordulás
        this.renderer.updateCamera(hero, map, this.direction);

        return "TURNED";
    }

    private isMonsterAt(x: number, y: number): boolean {
        const monsters = this.gameState.getMonsters();

        for (const monster of monsters) {
            if (monster.getX() === x && monster.getY() === y) {
                return true;
            }
        }
        return false;
    }

}