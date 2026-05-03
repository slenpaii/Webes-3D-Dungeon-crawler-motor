import type { MapData } from "../../core/map/MapData";
import { MapLoader } from "../../core/map/MapLoader";
import { isReachable } from "./MapValidation";

export class MapGenerator {

    public generate(width: number, height: number): MapData {
        const maxAttempts = 10;
        const mapLoader = new MapLoader();

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const mapData = this.generateBasicMap(width, height);
            const map = mapLoader.loadFromData(mapData);

            if (!mapData.heroStart || !mapData.exit) {
                continue;
            }

            const isExitReachable = isReachable(map, mapData.heroStart, mapData.exit);

            const areAllMonstersReachable = (mapData.monsterSpawns ?? []).every((spawn) => {
                return isReachable(map, mapData.heroStart!, spawn);
            });

            if (isExitReachable && areAllMonstersReachable) {

                // TODO: debug log – később kikapcsolni
                console.log(`Valid generált pálya létrejött. Próbálkozás: ${attempt + 1}`);
                return mapData;
                
            }
        }

        throw new Error("Nem sikerült érvényes, bejárható pályát generálni.");
    }

    private generateBasicMap(width: number, height: number): MapData {
        const heroStart = { x: 1, y: 1 };
        const exit = { x: width - 2, y: height - 2 };

        const tiles: number[][] = [];

        for (let y = 0; y < height; y++) {
            const row: number[] = [];

            for (let x = 0; x < width; x++) {
                const isBorder = x === 0 || y === 0 || x === width - 1 || y === height - 1;
                const isRandomWall = Math.random() < 0.22;

                row.push(isBorder || isRandomWall ? 1 : 0);
            }

            tiles.push(row);
        }

        tiles[heroStart.y][heroStart.x] = 0;
        tiles[exit.y][exit.x] = 0;

        const monsterSpawns: { x: number; y: number }[] = [];
        const targetMonsterCount = 3;
        const minDistanceFromHero = 4;
        let spawnAttempts = 0;
        const maxSpawnAttempts = 50;

        while (monsterSpawns.length < targetMonsterCount && spawnAttempts < maxSpawnAttempts) {
            spawnAttempts++;

            const spawn = {
                x: this.getRandomInt(1, width - 2),
                y: this.getRandomInt(1, height - 2)
            };

            if (this.getManhattanDistance(spawn, heroStart) < minDistanceFromHero) {
                continue;
            }

            const isAlreadyUsed = monsterSpawns.some((existingSpawn) => {
                return existingSpawn.x === spawn.x && existingSpawn.y === spawn.y;
            });

            if (isAlreadyUsed) {
                continue;
            }

            const isExitPosition = spawn.x === exit.x && spawn.y === exit.y;

            if (isExitPosition) {
                continue;
            }

            const isWall = tiles[spawn.y][spawn.x] === 1;

            if (isWall) {
                continue;
            }

            monsterSpawns.push(spawn);
        }

        return {
            width,
            height,
            tiles,
            heroStart,
            exit,
            monsterSpawns
        };
    }

    private getManhattanDistance(
        a: { x: number; y: number },
        b: { x: number; y: number }
    ): number {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    private getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

}