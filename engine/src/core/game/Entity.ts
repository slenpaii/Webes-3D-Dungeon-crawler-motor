export class Entity {
    protected x: number;
    protected y: number;
    
    protected hp: number;
    protected attack: number;
    protected defense: number;

    constructor(x: number, y: number, hp: number, attack: number, defense: number) {
        this.x = x;
        this.y = y;

        this.hp = hp;
        this.attack = attack;
        this.defense = defense;
    }

    // Getterek
    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public getHp(): number {
        return this.hp;
    }

    public getAttack(): number {
        return this.attack;
    }

    public getDefense(): number {
        return this.defense;
    }

    // Setter
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }


    
    // Egyéb metódusok
    public takeDamage(amount: number): void {
        this.hp -= amount;

        if (this.hp < 0) {
            this.hp = 0;
        }
    }

    public isDead(): boolean {
        return this.hp <= 0;
    }

}