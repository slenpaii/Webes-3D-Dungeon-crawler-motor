import { GameState } from "../core/game/GameState";
import { MovementController } from "../core/game/MovementController";
import { Renderer } from "../core/rendering/Renderer";
import { Hero } from "../core/game/Hero";
import { Monster } from "../core/game/Monster";
import { CombatSystem } from "./combat/CombatSystem";
import type { MovementResult } from "../core/game/MovementController";

type TurnPhase = "PLAYER_INPUT" | "WAITING_FOR_PLAYER_ANIMATION" | "ENEMY_TURN";

export class TurnController {
    private gameState: GameState;
    private movementController: MovementController;
    private renderer: Renderer;
    private phase: TurnPhase;
    private combatSystem: CombatSystem;
    private lastMovementResult: MovementResult = "BLOCKED";

    constructor(gameState: GameState, movementController: MovementController, renderer: Renderer) {
        this.gameState = gameState;
        this.movementController = movementController;
        this.renderer = renderer;
        this.phase = "PLAYER_INPUT";
        this.combatSystem = new CombatSystem();
    }

    public getPhase(): TurnPhase {
        return this.phase;
    }


    public handleInput(key: string): void {
        if (this.gameState.getIsGameOver()) {
           return;
        }

        if (this.phase !== "PLAYER_INPUT") {
            return;
        }

        const movementResult = this.movementController.handleInput(key);
        this.lastMovementResult = movementResult;
        
        if (movementResult !== "BLOCKED") {
            this.phase = "WAITING_FOR_PLAYER_ANIMATION";
        }
    }

    public update(): void {
        if (this.gameState.getIsGameOver()) {
           return;
        }

        if (this.phase !== "WAITING_FOR_PLAYER_ANIMATION") {
            return;
        }

        if (this.renderer.isMoving()) {
            return;
        }

        if (this.tryHeroCombat()) {
            return;
        }

        this.phase = "ENEMY_TURN";
        this.processEnemyTurn();

        this.endTurn();
    }

    // Szörnyek lépése és harc logika futtatása
    private processEnemyTurn(): void {
        const monsters = this.gameState.getMonsters();

        if (monsters.length === 0) {
            console.log("Nincs szörny a pályán!");
            return;
        }

        const monster = monsters[0];
        const hero = this.gameState.getHero();
        const map = this.gameState.getMap();



        // Szörny -> Chase
        if (this.canSeeHero(monster, hero, map)) {
            monster.setState("CHASE");
            monster.setLastKnownHeroPosition(hero.getX(), hero.getY());
        }
        // Szörny -> Search
        else if (monster.getLastKnownHeroPosition() !== null) {
            monster.setState("SEARCH");
        }
        // Szörny -> Idle
        else {
            monster.setState("IDLE");
        }


        // State debug visszajelzés
        if (monster.getState() === "IDLE") {
            console.log("Enemy állapot: IDLE");
            return;
        }

        if (monster.getState() === "SEARCH") {
            this.handleSearchState(monster, hero, map);
            return;
        }

        if (monster.getState() === "CHASE") {
            this.handleChaseState(monster, hero, map);
            return;
        }
        

        // Gameover
        if (hero.isDead()) {
            console.log("A hős meghalt! Játék vége.");
            this.gameState.setGameOver();
        }
    }

    // CHASE állapot kezelése
    private handleChaseState(monster: Monster, hero: Hero, map: any): boolean {
        const {
            primaryTargetX,
            primaryTargetY,
            secondaryTargetX,
            secondaryTargetY
        } = this.calculateChaseTargets(monster, hero);

        const moved = this.tryMoveMonsterTowardsTarget(
            monster,
            hero,
            map,
            primaryTargetX,
            primaryTargetY,
            secondaryTargetX,
            secondaryTargetY
        );

        if (!moved) {
            return false;
        }

        if (!monster.isDead()) {
            this.renderer.renderMonster(monster, map);
        }

        if (this.tryCombat(monster, hero)) {
            return true;
        }

        console.log(
            "Enemy elmozdult!\n",
            "Új pozíció = ", monster.getX(), ";", monster.getY()
        );

        return true;
    }

    // SEARCH állapot kezelése
    private handleSearchState(monster: Monster, hero: Hero, map: any): boolean {
        const lastKnownHeroPosition = monster.getLastKnownHeroPosition();
        
        if (lastKnownHeroPosition === null) {
            monster.setState("IDLE");
            return false;
        }

        console.log("Enemy állapot: SEARCH", "Célpont = ", lastKnownHeroPosition.x, ";", lastKnownHeroPosition.y);

        // Létrehoz egy ideiglenes "hős" objektumot a szörny számára
        const searchTarget = new Hero(
            lastKnownHeroPosition.x,
            lastKnownHeroPosition.y,
            0,
            0,
            0);

        // Kiszámolja a célpontot a szörny számára
        const {
            primaryTargetX,
            primaryTargetY,
            secondaryTargetX,
            secondaryTargetY
        } = this.calculateChaseTargets(monster, searchTarget);

        // Megpróbál elmozdulni a célpont felé
        const moved = this.tryMoveMonsterTowardsTarget(
            monster,
            searchTarget,
            map,
            primaryTargetX,
            primaryTargetY,
            secondaryTargetX,
            secondaryTargetY,
            true
        );

        // Ha nem tudott elmozdulni, marad a helyén és vár a következő körre
        if (!moved) {
            return false;
        }

        // Render
        if (!monster.isDead()) {
            this.renderer.renderMonster(monster, map);
        }

        console.log(
            "Enemy keres!\n",
            "Új pozíció = ", monster.getX(), ";", monster.getY()
        );

        // Ha odaért, ahol a hős utoljára volt, akkor visszaáll IDLE állapotba
        if (
            monster.getX() === searchTarget.getX() &&
            monster.getY() === searchTarget.getY()
        ) {
            monster.clearLastKnownHeroPosition();
            monster.setState("IDLE");
            console.log("Enemy nem találta meg a hőst, visszaáll IDLE állapotba");
        }

        return true;
    }

    // Szomszédos-e a két karakter (abszolút távolság 1)
    private isAdjacent(monster: Monster, hero: Hero): boolean {
        const distance =
            Math.abs(hero.getX() - monster.getX()) +
            Math.abs(hero.getY() - monster.getY());

        return distance === 1;
    }

    // Szörny látómező
    private canSeeHero(monster: Monster, hero: Hero, map: any): boolean {
        const monsterX = monster.getX();
        const monsterY = monster.getY();
        const heroX = hero.getX();
        const heroY = hero.getY();

        const distance =
            Math.abs(heroX - monsterX) +
            Math.abs(heroY - monsterY);

        if (distance > 8) {
            return false;
        }

        const steps = Math.max(
            Math.abs(heroX - monsterX),
            Math.abs(heroY - monsterY)
        );

        for (let i = 1; i < steps; i++) {
            const checkX = Math.round(monsterX + ((heroX - monsterX) * i) / steps);
            const checkY = Math.round(monsterY + ((heroY - monsterY) * i) / steps);

            if (!map.isWalkable(checkX, checkY)) {
                return false;
            }
        }

        return true;
    }

    // Combat logika futtatása
    private tryCombat(monster: Monster, hero: Hero): boolean {
        if (!this.isAdjacent(monster, hero)) {
            return false;
        }

        this.combatSystem.simulateCombat(hero, monster);

        if (monster.isDead()) {
            this.gameState.removeMonster(monster);
            this.renderer.clearMonsters();
        }

        if (hero.isDead()) {
            console.log("A hős meghalt! Játék vége.");
            this.gameState.setGameOver();
        }

        return true;
    }

    // Harc logika futtatása, ha a hős lépett
    private tryHeroCombat(): boolean {
        if (this.lastMovementResult !== "MOVED") {
            return false;
        }

        const monsters = this.gameState.getMonsters();
        const hero = this.gameState.getHero();

        for (const monster of monsters) {
            if (this.tryCombat(monster, hero)) {
                this.endTurn();
                return true;
            }
        }

        return false;
    }

    private calculateChaseTargets(monster: Monster, hero: Hero): {
        primaryTargetX: number;
        primaryTargetY: number;
        secondaryTargetX: number;
        secondaryTargetY: number;
    } {
        let primaryTargetX = monster.getX();
        let primaryTargetY = monster.getY();

        let secondaryTargetX = monster.getX();
        let secondaryTargetY = monster.getY();

        const deltaX = hero.getX() - monster.getX();
        const deltaY = hero.getY() - monster.getY();

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

        return {
            primaryTargetX,
            primaryTargetY,
            secondaryTargetX,
            secondaryTargetY
        };
    }

    // Megpróbálja a szörnyet a megadott célok felé mozgatni
    private tryMoveMonsterTowardsTarget(
        monster: Monster,
        hero: Hero,
        map: any,
        primaryTargetX: number,
        primaryTargetY: number,
        secondaryTargetX: number,
        secondaryTargetY: number,
        allowMoveOntoTarget: boolean = false
    ): boolean {
    const canMoveToPrimary =
        map.isWalkable(primaryTargetX, primaryTargetY) &&
        (
            allowMoveOntoTarget ||
            !(hero.getX() === primaryTargetX && hero.getY() === primaryTargetY)
        );

    const canMoveToSecondary =
        map.isWalkable(secondaryTargetX, secondaryTargetY) &&
        (
            allowMoveOntoTarget ||
            !(hero.getX() === secondaryTargetX && hero.getY() === secondaryTargetY)
        );

        if (canMoveToPrimary) {
            monster.setPosition(primaryTargetX, primaryTargetY);
            return true;
        }
        else if (canMoveToSecondary) {
            monster.setPosition(secondaryTargetX, secondaryTargetY);
            return true;
        }

        return false;
    }

    //Kör vége logika
    private endTurn(): void {
        this.gameState.incrementTurnCount();
        console.log("Kör vége. Aktuális kör: ", this.gameState.getTurnCount());
        this.lastMovementResult = "BLOCKED";
        this.phase = "PLAYER_INPUT";
    }
}