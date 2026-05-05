import { GameState } from "../core/game/GameState";
import { MovementController } from "../core/game/MovementController";
import { Renderer } from "../core/rendering/Renderer";
import { Hero } from "../core/game/Hero";
import { Monster } from "../core/game/Monster";
import { CombatSystem } from "./combat/CombatSystem";
import type { MovementResult } from "../core/game/MovementController";
import { HudController } from "./ui/HudController";

type TurnPhase = "PLAYER_INPUT" | "WAITING_FOR_PLAYER_ANIMATION" | "ENEMY_TURN";


// =========================== TODO ===============================
// - CHASE finomhangolás (jobb megközelítés, kevesebb fallback mozgás)
// - Enemy spacing javítása (ne torlódjanak közelharcban)
// - Egyszerű surround viselkedés (két oldalról közelítés)
// - Mozgás prioritás optimalizálása (fallback logika finomítása)
// - Map típus javítása (map: any -> konkrét Map típus)
// ================================================================

export class TurnController {
    private gameState: GameState;
    private movementController: MovementController;
    private renderer: Renderer;
    private phase: TurnPhase;
    private combatSystem: CombatSystem;
    private hudController: HudController;
    private lastMovementResult: MovementResult = "BLOCKED";
    private readonly SEARCH_TURN_LIMIT: number = 10;


constructor(gameState: GameState, movementController: MovementController, renderer: Renderer, hudController: HudController) {
        this.gameState = gameState;
        this.movementController = movementController;
        this.renderer = renderer;
        this.phase = "PLAYER_INPUT";
        this.combatSystem = new CombatSystem();
        this.hudController = hudController;
    }

    public getPhase(): TurnPhase {
        return this.phase;
    }

    public handleInput(key: string): void {
        if (this.gameState.getIsGameOver() || this.gameState.getIsGameWon()) {
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
        if (this.gameState.getIsGameOver() || this.gameState.getIsGameWon()) {
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

        if (this.checkWinCondition()) {
            return;
        }

        this.phase = "ENEMY_TURN";
        this.processEnemyTurn();

        this.endTurn();
    }

    private processSingleEnemyTurn(monster: Monster, enemyIndex: number): void {
        const hero = this.gameState.getHero();
        const map = this.gameState.getMap();

        // Szörny: amíg nem látja a hőst -> IDLE
        if (this.canSeeHero(monster, hero, map)) {
            monster.resetSearchTurnCount();
            monster.setState("CHASE");
            monster.setLastKnownHeroPosition(hero.getX(), hero.getY());
        }
        else if (monster.getLastKnownHeroPosition() !== null) {
            monster.setState("SEARCH");
        }
        else {
            monster.setState("IDLE");
        }

        if (monster.getState() === "IDLE") {
            return;
        }

        if (monster.getState() === "SEARCH") {
            this.handleSearchState(monster, hero, map, enemyIndex);
            return;
        }

        if (monster.getState() === "CHASE") {
            this.handleChaseState(monster, hero, map, enemyIndex);
            return;
        }
    }

    // Szörnyek lépése és harc logika futtatása
    private processEnemyTurn(): void {
        const monsters = this.gameState.getMonsters();

        if (monsters.length === 0) {
            return;
        }

        for (let i = 0; i < monsters.length; i++) {
            const monster = monsters[i];
            this.processSingleEnemyTurn(monster, i);
        }
    }

    // CHASE állapot kezelése
    private handleChaseState(monster: Monster, hero: Hero, map: any, enemyIndex: number): boolean {
        let targetX = hero.getX();
        let targetY = hero.getY();

        const offsetIndex = enemyIndex % 4;

        if (offsetIndex === 0) {
            targetX += 1;
        }
        else if (offsetIndex === 1) {
            targetX -= 1;
        }
        else if (offsetIndex === 2) {
            targetY += 1;
        }
        else if (offsetIndex === 3) {
            targetY -= 1;
        }

        const chaseTarget = new Hero(targetX, targetY, 0, 0, 0);

        const {
            primaryTargetX,
            primaryTargetY,
            secondaryTargetX,
            secondaryTargetY,
            fallbackTargetX1,
            fallbackTargetY1,
            fallbackTargetX2,
            fallbackTargetY2
        } = this.calculateChaseTargets(monster, chaseTarget);

        const moved = this.tryMoveMonsterTowardsTarget(
            monster,
            hero,
            map,
            primaryTargetX,
            primaryTargetY,
            secondaryTargetX,
            secondaryTargetY,
            fallbackTargetX1,
            fallbackTargetY1,
            fallbackTargetX2,
            fallbackTargetY2
        );

        if (!moved) {
            if (this.tryCombat(monster, hero)) {
                return true;
            }

            return false;
        }

        if (!monster.isDead()) {
            this.renderer.animateMonsterMove(monster, map);
        }

        if (this.tryCombat(monster, hero)) {
            return true;
        }

        return true;
    }

    // SEARCH állapot kezelése
    private handleSearchState(monster: Monster, hero: Hero, map: any, enemyIndex: number): boolean {
        const lastKnownHeroPosition = monster.getLastKnownHeroPosition();
        
        if (lastKnownHeroPosition === null) {
            monster.resetSearchTurnCount();
            monster.resetReachedSearchTarget();
            monster.setState("IDLE");
            return false;
        }

        if (monster.hasReachedSearchTarget()) {
            monster.clearLastKnownHeroPosition();
            monster.resetSearchTurnCount();
            monster.resetReachedSearchTarget();
            monster.setState("IDLE");
            console.log(`[Enemy ${enemyIndex}] Nem találta meg a hőst a keresési célpontnál, visszaáll IDLE állapotba`);
            return false;
        }

        if (
            this.isSearchTargetOccupiedByAnotherMonster(
                lastKnownHeroPosition.x,
                lastKnownHeroPosition.y,
                monster
            )
        ) {
            monster.clearLastKnownHeroPosition();
            monster.resetSearchTurnCount();
            monster.resetReachedSearchTarget();
            monster.setState("IDLE");
            console.log(`[Enemy ${enemyIndex}] A keresési célpontot másik enemy foglalja, visszaáll IDLE állapotba`);
            return false;
        }

        monster.incrementSearchTurnCount();

        if (monster.getSearchTurnCount() > this.SEARCH_TURN_LIMIT) {
            monster.clearLastKnownHeroPosition();
            monster.resetSearchTurnCount();
            monster.resetReachedSearchTarget();
            monster.setState("IDLE");
            console.log(`[Enemy ${enemyIndex}] SEARCH timeout, visszaáll IDLE állapotba`);
            return false;
        }

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
            secondaryTargetY,
            fallbackTargetX1,
            fallbackTargetY1,
            fallbackTargetX2,
            fallbackTargetY2
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
            fallbackTargetX1,
            fallbackTargetY1,
            fallbackTargetX2,
            fallbackTargetY2,
            true
        );

        // Ha nem tudott elmozdulni, marad a helyén és vár a következő körre
        if (!moved) {
            if (this.tryCombat(monster, hero)) {
                return true;
            }

            return false;
        }

        // Render
        if (!monster.isDead()) {
            this.renderer.animateMonsterMove(monster, map);
        }

        // Ha odaért, ahol a hős utoljára volt, akkor visszaáll IDLE állapotba
        if (
            monster.getX() === searchTarget.getX() &&
            monster.getY() === searchTarget.getY()
        ) {
            monster.setReachedSearchTarget(true);
            console.log(`[Enemy ${enemyIndex}] Elérte a keresési célpontot, még egy körig keres`);
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

    // Ellenőrzi, hogy van-e másik szörny a megadott pozícióban (a jelenlegi szörny kivételével)
    private isAnotherMonsterAt(x: number, y: number, currentMonster: Monster): boolean {
        const monsters = this.gameState.getMonsters();

        for (const monster of monsters) {
            if (monster === currentMonster) {
                continue;
            }

            if (monster.getX() === x && monster.getY() === y) {
                return true;
            }
        }

        return false;
    }

    private isSearchTargetOccupiedByAnotherMonster(
        targetX: number,
        targetY: number,
        currentMonster: Monster
    ): boolean {
        return this.isAnotherMonsterAt(targetX, targetY, currentMonster);
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
            this.renderer.clearMonster(monster);
            this.hudController.showMessage("Enemy defeated!");
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

    private checkWinCondition(): boolean {
        const exitPosition = this.gameState.getExitPosition();

        if (exitPosition === null) {
            return false;
        }

        const hero = this.gameState.getHero();

        if (hero.getX() === exitPosition.x && hero.getY() === exitPosition.y) {
            console.log("A hős elérte a kijáratot! Győzelem!");
            this.gameState.setGameWon();
            return true;
        }

        return false;
    }

    private calculateChaseTargets(monster: Monster, hero: Hero): {
        primaryTargetX: number;
        primaryTargetY: number;
        secondaryTargetX: number;
        secondaryTargetY: number;
        fallbackTargetX1: number;
        fallbackTargetY1: number;
        fallbackTargetX2: number;
        fallbackTargetY2: number;
    } {
        let primaryTargetX = monster.getX();
        let primaryTargetY = monster.getY();

        let secondaryTargetX = monster.getX();
        let secondaryTargetY = monster.getY();

        let fallbackTargetX1 = monster.getX();
        let fallbackTargetY1 = monster.getY();

        let fallbackTargetX2 = monster.getX();
        let fallbackTargetY2 = monster.getY();


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
            fallbackTargetY1 = monster.getY() + 1;
            fallbackTargetY2 = monster.getY() - 1;
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

            fallbackTargetX1 = monster.getX() + 1;
            fallbackTargetX2 = monster.getX() - 1;
        }

        return {
            primaryTargetX,
            primaryTargetY,
            secondaryTargetX,
            secondaryTargetY,
            fallbackTargetX1,
            fallbackTargetY1,
            fallbackTargetX2,
            fallbackTargetY2
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
        fallbackTargetX1: number,
        fallbackTargetY1: number,
        fallbackTargetX2: number,
        fallbackTargetY2: number,
        allowMoveOntoTarget: boolean = false
    ): boolean {
    const previousPosition = monster.getPreviousPosition();

    const isPreviousTile = (x: number, y: number): boolean => {
        if (!previousPosition) return false;
        return previousPosition.x === x && previousPosition.y === y;
    };

    const canMoveToPrimary =
        map.isWalkable(primaryTargetX, primaryTargetY) &&
        !this.isAnotherMonsterAt(primaryTargetX, primaryTargetY, monster) &&
        !(monster.getX() === primaryTargetX && monster.getY() === primaryTargetY) &&
        (
            allowMoveOntoTarget ||
            !(hero.getX() === primaryTargetX && hero.getY() === primaryTargetY)
        );

    const canMoveToSecondary =
        map.isWalkable(secondaryTargetX, secondaryTargetY) &&
        !this.isAnotherMonsterAt(secondaryTargetX, secondaryTargetY, monster) &&
        !(monster.getX() === secondaryTargetX && monster.getY() === secondaryTargetY) &&
        !isPreviousTile(secondaryTargetX, secondaryTargetY) &&
        (
            allowMoveOntoTarget ||
            !(hero.getX() === secondaryTargetX && hero.getY() === secondaryTargetY)
        );

    const canMoveToFallback1 =
        map.isWalkable(fallbackTargetX1, fallbackTargetY1) &&
        !this.isAnotherMonsterAt(fallbackTargetX1, fallbackTargetY1, monster) &&
        !(monster.getX() === fallbackTargetX1 && monster.getY() === fallbackTargetY1) &&
        !isPreviousTile(fallbackTargetX1, fallbackTargetY1);

    const canMoveToFallback2 =
        map.isWalkable(fallbackTargetX2, fallbackTargetY2) &&
        !this.isAnotherMonsterAt(fallbackTargetX2, fallbackTargetY2, monster) &&
        !(monster.getX() === fallbackTargetX2 && monster.getY() === fallbackTargetY2) &&
        !isPreviousTile(fallbackTargetX2, fallbackTargetY2);



        if (canMoveToPrimary) {
            monster.savePreviousPosition();
            monster.setPosition(primaryTargetX, primaryTargetY);
            return true;
        }
        else if (canMoveToSecondary) {
            monster.savePreviousPosition();
            monster.setPosition(secondaryTargetX, secondaryTargetY);
            return true;
        }
        else if (canMoveToFallback1) {
            monster.savePreviousPosition();
            monster.setPosition(fallbackTargetX1, fallbackTargetY1);
            return true;
        }
        else if (canMoveToFallback2) {
            monster.savePreviousPosition();
            monster.setPosition(fallbackTargetX2, fallbackTargetY2);
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