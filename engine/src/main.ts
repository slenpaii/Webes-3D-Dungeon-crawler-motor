import "./style.css";
import { Renderer } from "./core/rendering/Renderer";
import { MapLoader } from "./core/map/MapLoader";
import testMapData from "./data/test-map.json";
import { Hero } from "./core/game/Hero";
import { Monster } from "./core/game/Monster";
import { GameState } from "./core/game/GameState";
import { MovementController } from "./core/game/MovementController";
import { TurnController } from "./game/TurnController";
import { MapGenerator } from "./game/map-generation/MapGenerator";
import type { MapData } from "./core/map/MapData";
import { isReachable } from "./game/map-generation/MapValidation";

const container = document.body;
const renderer = new Renderer(container);

const mapLoader = new MapLoader();

const USE_GENERATED_MAP = true;

let mapData: MapData = testMapData;

if (USE_GENERATED_MAP) {
    const generator = new MapGenerator();
    mapData = generator.generate(21, 21);
}

const map = mapLoader.loadFromData(mapData);

const heroStart = mapData.heroStart ?? { x: 4, y: 11 };
const hero = new Hero(heroStart.x, heroStart.y, 100, 5, 2);


const monsterSpawns = mapData.monsterSpawns ?? [
    { x: 10, y: 3 },
    { x: 10, y: 19 }
];

const monsters = monsterSpawns.map((spawn) => {
    return new Monster(spawn.x, spawn.y, 10, 10, 1);
});

const exitPosition = mapData.exit ?? null;

if (exitPosition) {
    if (!map.isInside(exitPosition.x, exitPosition.y)) {
        throw new Error("Exit pozíció pályán kívül van.");
    }

    if (!map.isWalkable(exitPosition.x, exitPosition.y)) {
        throw new Error("Exit nem járható mezőn van.");
    }

    if (!isReachable(map, heroStart, exitPosition)) {
        throw new Error("Exit nem elérhető a hős kezdőpozíciójából.");
    }
}

const gameState = new GameState(map, hero, monsters, exitPosition);
// TODO: debug log – később UI-ba kerül
console.log(`Monsterek száma: ${monsters.length}`);


const initialDirection = 1;
const movementController = new MovementController(gameState, renderer, initialDirection);

const turnController = new TurnController(gameState, movementController, renderer);

console.log("Betöltött map:", map);
console.log("Map mérete:", map.width, "x", map.height);

renderer.renderMap(gameState.getMap());

const currentExitPosition = gameState.getExitPosition();

if (currentExitPosition) {
    renderer.renderExit(currentExitPosition, gameState.getMap());
}

renderer.renderHero(gameState.getHero(), gameState.getMap());

for (const monster of gameState.getMonsters()) {
    renderer.renderMonster(monster, gameState.getMap());
}
// TODO: induló direction kiszervezése közös konstansba / enumba
renderer.updateCamera(gameState.getHero(), gameState.getMap(), movementController.getDirection());


window.addEventListener("keydown", (event) => {
    if (event.repeat) {
        return;
    }

    turnController.handleInput(event.key);
});

renderer.start();

function gameLoop(): void {
    turnController.update();
    requestAnimationFrame(gameLoop);
}

gameLoop();

console.log("Dungeon crawler engine starting...");