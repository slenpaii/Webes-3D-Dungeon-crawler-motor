import { Tile } from "./Tile";

export class Map {
    public readonly width: number;
    public readonly height: number;
    private readonly tiles: Tile[][];

    constructor(width: number, height: number, tiles: Tile[][]) {
        this.width = width;
        this.height = height;
        this.tiles = tiles;
    }

    // Ellenőrzi, hogy a megadott koordináták a pályán belül vannak-e
    public isInside(x: number, y: number): boolean {
        //ha mind igaz akkor a pályán vagyunk
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    //Visszaadja a tile-t a megadott koordinátákon, ha nincsenek a pályán, akkor null-t ad vissza
    public getTile(x: number, y: number): Tile | null {

        //Ha a koordináták nincsenek a pályán, akkor null-t ad vissza
        if (!this.isInside(x, y)) {
        return null;
        }

        //Visszaadja a tile-t a megadott koordinátákon
        return this.tiles[y][x];
    }

    //Visszaadja, hogy a megadott koordinátákon járható-e a tile
    public isWalkable(x: number, y: number): boolean {
        const tile = this.getTile(x, y);

        //Ha a tile null, akkor nem járható
        if (tile === null) {
            return false;
        }

        return tile.isWalkable();
    }

    //Visszaadja a pálya tile-jait kétdimenziós tömbben
    public getTiles(): Tile[][] {
        return this.tiles;
    }

}