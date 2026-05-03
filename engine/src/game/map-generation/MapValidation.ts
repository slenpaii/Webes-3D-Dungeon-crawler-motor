import { Map } from "../../core/map/Map";
import type { GridPosition } from "../../core/map/MapData";

export function isReachable(
    map: Map,
    start: GridPosition,
    target: GridPosition
): boolean {
    const queue: GridPosition[] = [start];
    const visited = new Set<string>();

    visited.add(`${start.x},${start.y}`);

    const directions = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 }
    ];

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current) {
            continue;
        }

        if (current.x === target.x && current.y === target.y) {
            return true;
        }
        
        for (const direction of directions) {
            const next = {
                x: current.x + direction.x,
                y: current.y + direction.y
            };

            const key = `${next.x},${next.y}`;

            if (visited.has(key)) {
                continue;
            }

            if (!map.isWalkable(next.x, next.y)) {
                continue;
            }

            visited.add(key);
            queue.push(next);
        }
    }

    return false;
}