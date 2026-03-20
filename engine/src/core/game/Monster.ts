import { Entity } from "./Entity";

export class Monster extends Entity {

    constructor(x: number, y: number, hp: number, attack: number, defense: number) {
        super(x, y, hp, attack, defense);
    }
    
}