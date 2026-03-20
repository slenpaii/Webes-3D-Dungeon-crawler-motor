import "./style.css";
import { Renderer } from "./core/rendering/Renderer";
import { MapLoader } from "./core/map/MapLoader";
import testMapData from "./data/test-map.json";
import { Hero } from "./core/game/Hero";
import { Monster } from "./core/game/Monster";
import { GameState } from "./core/game/GameState";

const container = document.body;
const renderer = new Renderer(container);

const mapLoader = new MapLoader();
const map = mapLoader.loadFromData(testMapData);

const hero = new Hero(2, 2, 20, 5, 2);
const monster = new Monster(5, 3, 10, 4, 1);

const gameState = new GameState(map, hero, [monster]);

console.log("Betöltött map:", map);
console.log("Map mérete:", map.width, "x", map.height);

renderer.renderMap(gameState.getMap());
renderer.renderHero(gameState.getHero(), gameState.getMap());
renderer.renderMonster(gameState.getMonsters()[0], gameState.getMap());

console.log("Hero pozíciója:", gameState.getHero().getX(), ";", gameState.getHero().getY());
console.log("Hero HP:", gameState.getHero().getHp());
console.log("Hero Attack:", gameState.getHero().getAttack());
console.log("Hero Defense:", gameState.getHero().getDefense());

renderer.start();
console.log("Dungeon crawler engine starting...");