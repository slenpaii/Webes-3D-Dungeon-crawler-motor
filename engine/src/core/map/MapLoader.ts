import { Map } from "./Map";
import { Tile } from "./Tile";
import { TileType } from "./TileType";
import type { MapData } from "./MapData";

export class MapLoader {

    // Betölti a pályát a megadott adatok alapján
    public loadFromData(data: MapData): Map {

        // Ellenőrzi, hogy a szükséges mezők jelen vannak-e az adatokban
        if (!data || data.width === undefined || data.height === undefined || !Array.isArray(data.tiles)) {
            throw new Error("Érvénytelen map adat: hiányzó width, height vagy tiles mező.");
        }

        const width = data.width;
        const height = data.height;

        // Ellenőrzi, hogy a tiles tömb mérete megfelel-e a width és height értékeknek
        if (data.tiles.length !== height) {
            throw new Error("Érvénytelen map adat: a tiles sorainak száma nem egyezik a height értékkel.");
        }

        // Ellenőrzi, hogy minden sor egy tömb-e és hogy minden sor hossza megfelel-e a width értéknek
        for (let y = 0; y < height; y++) {
            if (!Array.isArray(data.tiles[y])) {
                throw new Error(`Érvénytelen map adat: a ${y}. sor nem tömb.`);
            }

            if (data.tiles[y].length !== width) {
                throw new Error(`Érvénytelen map adat: a ${y}. sor hossza nem egyezik a width értékkel.`);
            }
        }

        const tiles: Tile[][] = [];
        
        for (let y = 0; y < height; y++) {
            const row: Tile[] = [];
            for (let x = 0; x < width; x++) {
                const tileType = data.tiles[y][x];

                // Ellenőrzi, hogy a tile érték érvényes-e
                if (tileType !== TileType.Floor && tileType !== TileType.Wall) {
                    throw new Error(`Érvénytelen tile érték a (${x}, ${y}) pozíción: ${tileType}`);
                }

                const tile = new Tile(x, y, tileType);
                row.push(tile);
            }
            tiles.push(row);
        }

        const map = new Map(width, height, tiles);
        return map;

    }

}