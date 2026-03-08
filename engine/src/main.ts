import "./style.css";
import { Renderer } from "./core/rendering/Renderer";

const container = document.body; // A teljes body elem a renderelés helye -> teszt
const renderer = new Renderer(container);

renderer.start();
console.log("Dungeon crawler engine starting...");