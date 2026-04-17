import "./style.css";
import { Renderer } from "./core/rendering/Renderer";
import { MapLoader } from "./core/map/MapLoader";
import testMapData from "./data/test-map.json";
import { Hero } from "./core/game/Hero";
import { Monster } from "./core/game/Monster";
import { GameState } from "./core/game/GameState";
import { MovementController } from "./core/game/MovementController";
import { TurnController } from "./game/TurnController";

const container = document.body;
const renderer = new Renderer(container);

const mapLoader = new MapLoader();
const map = mapLoader.loadFromData(testMapData);

const hero = new Hero(3, 1, 20, 5, 2);
const monster = new Monster(10, 3, 10, 25, 1);

const gameState = new GameState(map, hero, [monster]);

const initialDirection = 2;
const movementController = new MovementController(gameState, renderer, initialDirection);

const turnController = new TurnController(gameState, movementController, renderer);

console.log("Betöltött map:", map);
console.log("Map mérete:", map.width, "x", map.height);

renderer.renderMap(gameState.getMap());
renderer.renderHero(gameState.getHero(), gameState.getMap());

// TODO: később több szörny kirajzolása a teljes monsters tömbből
renderer.renderMonster(gameState.getMonsters()[0], gameState.getMap());

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