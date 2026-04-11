import { Hero } from "../../core/game/Hero";
import { Monster } from "../../core/game/Monster";

export class CombatSystem {

    public simulateCombat(hero: Hero, monster: Monster): void {

        const heroDamage = Math.max(1, hero.getAttack() - monster.getDefense());

        monster.takeDamage(heroDamage);

        console.log("Hero támad! Sebzés: ", heroDamage);

        if (monster.isDead()) {
            console.log("A szörny meghalt!");
            return;
        }

        const monsterDamage = Math.max(1, monster.getAttack() - hero.getDefense());

        hero.takeDamage(monsterDamage);

        console.log("Szörny támad! Sebzés: ", monsterDamage);

        if (hero.isDead()) {
            console.log("A hős meghalt!");
        }

    }
}