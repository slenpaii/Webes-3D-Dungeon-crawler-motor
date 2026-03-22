import "./style.css";
import { Renderer } from "./core/rendering/Renderer";
import { MapLoader } from "./core/map/MapLoader";
import testMapData from "./data/test-map.json";
import { Hero } from "./core/game/Hero";
import { Monster } from "./core/game/Monster";
import { GameState } from "./core/game/GameState";
import { MovementController } from "./core/game/MovementController";

const container = document.body;
const renderer = new Renderer(container);

const mapLoader = new MapLoader();
const map = mapLoader.loadFromData(testMapData);

const hero = new Hero(1, 1, 20, 5, 2);
const monster = new Monster(5, 3, 10, 4, 1);

const gameState = new GameState(map, hero, [monster]);

const movementController = new MovementController(gameState, renderer);

console.log("Betöltött map:", map);
console.log("Map mérete:", map.width, "x", map.height);

renderer.renderMap(gameState.getMap());
renderer.renderHero(gameState.getHero(), gameState.getMap());

// TODO: később több szörny kirajzolása a teljes monsters tömbből
renderer.renderMonster(gameState.getMonsters()[0], gameState.getMap());

// TODO: induló direction kiszervezése közös konstansba / enumba
renderer.updateCamera(gameState.getHero(), gameState.getMap(), 0);

window.addEventListener("keydown", (event) => {
    if (event.repeat) {
        return
    }
    
    movementController.handleInput(event.key);
});

renderer.start();
console.log("Dungeon crawler engine starting...");