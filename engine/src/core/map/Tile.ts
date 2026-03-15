// Egyetlen pálya mezőt reprezentál a rácsban.
// Tartalmazza a koordinátákat és a tile típusát (Floor / Wall).

import { TileType } from "./TileType";

export class Tile {
    //A tile pozíciója és típusa
    public readonly x: number;
    public readonly y: number;
    public readonly type: TileType;

    constructor(x: number, y: number, type: TileType) {
        //Inicializálja a tile pozícióját és típusát
        this.x = x;
        this.y = y;
        this.type = type;
    }

    //Járható-e a tile
    public isWalkable(): boolean {
        return this.type === TileType.Floor;
    }
}