export interface GridPosition {
    x: number;
    y: number;
}

export interface MapData {
    width: number;
    height: number;
    tiles: number[][];
    heroStart?: GridPosition;
    exit?: GridPosition;
    monsterSpawns?: GridPosition[];
}