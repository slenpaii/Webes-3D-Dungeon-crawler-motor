//A tile típusát definiáló konstansok
export const TileType = {
    Floor: 0,
    Wall: 1
} as const;

export type TileType = typeof TileType[keyof typeof TileType];