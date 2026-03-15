import "./style.css";
import { Renderer } from "./core/rendering/Renderer";
import { MapLoader } from "./core/map/MapLoader";
import testMapData from "./data/test-map.json";

const container = document.body;
const renderer = new Renderer(container);

const mapLoader = new MapLoader();
const map = mapLoader.loadFromData(testMapData);

console.log("Betöltött map:", map);
console.log("Map mérete:", map.width, "x", map.height);

renderer.renderMap(map);

renderer.start();
console.log("Dungeon crawler engine starting...");