import { GameState } from "../core/game/GameState";
import { MovementController } from "../core/game/MovementController";
import { Renderer } from "../core/rendering/Renderer";
import { Hero } from "../core/game/Hero";
import { Monster } from "../core/game/Monster";

type TurnPhase = "PLAYER_INPUT" | "WAITING_FOR_PLAYER_ANIMATION" | "ENEMY_TURN";

export class TurnController {
    private gameState: GameState;
    private movementController: MovementController;
    private renderer: Renderer;
    private phase: TurnPhase;

    constructor(gameState: GameState, movementController: MovementController, renderer: Renderer) {
        this.gameState = gameState;
        this.movementController = movementController;
        this.renderer = renderer;
        this.phase = "PLAYER_INPUT";
    }

    public getPhase(): TurnPhase {
        return this.phase;
    }

    public handleInput(key: string): void {
        if (this.phase !== "PLAYER_INPUT") {
            return;
        }

        const actionPerformed = this.movementController.handleInput(key);
        
        if (actionPerformed) {
            this.phase = "WAITING_FOR_PLAYER_ANIMATION";
        }
    }

    public update(): void {
        if (this.phase !== "WAITING_FOR_PLAYER_ANIMATION") {
            return;
        }

        if (this.renderer.isMoving()) {
            return;
        }

        this.phase = "ENEMY_TURN";
        this.processEnemyTurn();

        this.gameState.incrementTurnCount();
        console.log("Kör vége. Aktuális kör: ", this.gameState.getTurnCount());
        this.phase = "PLAYER_INPUT";
    }

    // TODO: ideiglenes enemy AI, később külön rendszerbe szervezni
    private processEnemyTurn(): void {
        const monsters = this.gameState.getMonsters();

        if (monsters.length === 0) {
            console.log("Nincs szörny a pályán!");
            return;
        }

        const monster = monsters[0];
        const hero = this.gameState.getHero();
        const map = this.gameState.getMap();

        // absz távolság
        const distance =
            Math.abs(hero.getX() - monster.getX()) +
            Math.abs(hero.getY() - monster.getY());

        if (distance > 5) {
            console.log("Enemy túl messze van, nem aktiválódik.\n", "distance = ", distance);
            return;
        }

        if (this.resetMonsterIfAdjacent(monster, hero, map)) {
            return;
        }

        let primaryTargetX = monster.getX();
        let primaryTargetY = monster.getY();

        let secondaryTargetX = monster.getX();
        let secondaryTargetY = monster.getY();

        const deltaX = hero.getX() - monster.getX();
        const deltaY = hero.getY() - monster.getY();

        //Primary és secondary target számítása
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
            if (deltaX > 0) {
                primaryTargetX = monster.getX() + 1;
            }
            else if (deltaX < 0) {
                primaryTargetX = monster.getX() - 1;
            }

            if (deltaY > 0) {
                secondaryTargetY = monster.getY() + 1;
            }
            else if (deltaY < 0) {
                secondaryTargetY = monster.getY() - 1;
            }
        }
        else {
            if (deltaY > 0) {
                primaryTargetY = monster.getY() + 1;
            }
            else if (deltaY < 0) {
                primaryTargetY = monster.getY() - 1;
            }

            if (deltaX > 0) {
                secondaryTargetX = monster.getX() + 1;
            }
            else if (deltaX < 0) {
                secondaryTargetX = monster.getX() - 1;
            }
        }


        // 1. primary target ellenőrzése
        const canMoveToPrimary =
            map.isWalkable(primaryTargetX, primaryTargetY) &&
            !(hero.getX() === primaryTargetX && hero.getY() === primaryTargetY);

        // 2. secondary target ellenőrzése
        const canMoveToSecondary =
            map.isWalkable(secondaryTargetX, secondaryTargetY) &&
            !(hero.getX() === secondaryTargetX && hero.getY() === secondaryTargetY);

        // 3. döntés
        if (canMoveToPrimary) {
            monster.setPosition(primaryTargetX, primaryTargetY);
        }
        else if (canMoveToSecondary) {
            monster.setPosition(secondaryTargetX, secondaryTargetY);
        }
        else {
            // egyik irány sem jó → marad
            return;
        }

        // 4. render
        this.renderer.renderMonster(monster, map);

        if (this.resetMonsterIfAdjacent(monster, hero, map)) {
            return;
        }

        console.log(
            "Enemy elmozdult!\n",
            "Új pozíció = ", monster.getX(), ";", monster.getY()
        );
    }

    private resetMonsterIfAdjacent(monster: Monster, hero: Hero, map: any): boolean {
        const distance =
            Math.abs(hero.getX() - monster.getX()) +
            Math.abs(hero.getY() - monster.getY());

        if (distance !== 1) {
            return false;
        }
        monster.setPosition(10,3);
        this.renderer.renderMonster(monster, map);

        console.log("Enemy elérte a szomszédos mezőt, respawnolt");
        return true;
    }
}