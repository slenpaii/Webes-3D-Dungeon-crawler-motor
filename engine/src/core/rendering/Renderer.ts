/*  
    Renderer modul
    A 3D jelenet megjelenítéséért felelős.
    Kezeli a Three.js Scene-t, Camera-t és WebGLRenderer-t,
    valamint a render ciklust.
*/

import * as THREE from "three";
import { Map } from "../map/Map";
import { TileType } from "../map/TileType";
import { Hero } from "../game/Hero";
import type { Monster } from "../game/Monster";

export class Renderer {

private container : HTMLElement;

//private cube      !: THREE.Mesh; // Tesztkocka a renderelés teszteléséhez

private scene     !: THREE.Scene;
private camera    !: THREE.PerspectiveCamera;
private renderer  !: THREE.WebGLRenderer;

private animationFrameId: number | null = null;

private mapObjects: THREE.Object3D[] = []; // A jelenetben megjelenített térkép objektumok listája
private heroObject: THREE.Object3D | null = null; // A jelenetben megjelenített hős objektuma
private monsterObjects: THREE.Object3D[] = []; // A jelenetben megjelenített szörny objektumok listája

private readonly tileSize: number = 1; // A tile-ok mérete a világban
private readonly wallHeight: number = 1; // A falak magassága a világban



constructor(container: HTMLElement) {
    this.container = container;

    this.setupScene();
    this.setupCamera();
    this.setupRenderer();

    this.setupLights();
    this.setupHelpers();

    // Tesztkocka
    //this.cube = this.createDebugCube();
    //this.addObject(this.cube);

    window.addEventListener("resize", () => this.onResize());
}




    // Jelenet létrehozása
    private setupScene(): void {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
    }

    // Kamera létrehozása
    private setupCamera(): void {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.camera.position.set(10, 20, 10); // Kamera pozíciójának beállítása, hogy a térkép jól látható legyen
        this.camera.lookAt(0, 0, 0);
    }

    // Renderer létrehozása
    private setupRenderer(): void {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.container.appendChild(this.renderer.domElement);
    }

    // Fények létrehozása
    private setupLights(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.addObject(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.addObject(directionalLight);
    }

    // Segédeszközök létrehozása
    private setupHelpers(): void {
        const gridHelper = new THREE.GridHelper(30, 30);
        this.addObject(gridHelper);
}



    // A hős kirajzolása a jelenetbe
    public renderHero(hero: Hero, map: Map): void {
        // Törlődik a jelenetből az aktuálisan kirajzolt hős objektum
        if (this.heroObject !== null) {
            this.removeObject(this.heroObject);
            this.heroObject = null;
        }

        const heroX = hero.getX();
        const heroY = hero.getY();

        const offsetX = Math.floor(map.width / 2);
        const offsetZ = Math.floor(map.height / 2);

        const worldX = (heroX - offsetX) * this.tileSize;
        const worldZ = (heroY - offsetZ) * this.tileSize;

        //Hős megjelenítése (teszt jelleggel)
        const geometry = new THREE.CylinderGeometry(
            this.tileSize * 0.3,
            this.tileSize * 0.3,
            this.tileSize,
            16
        );
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

        const heroMesh = new THREE.Mesh(geometry, material);

        heroMesh.position.set(
            worldX,
            this.tileSize / 2,
            worldZ
        );

        this.addObject(heroMesh);
        this.heroObject = heroMesh;
    }

    // A szörny kirajzolása a jelenetbe
    public renderMonster(monster: Monster, map: Map): void {
            this.clearMonsters(); // Törlődnek a jelenetből az aktuálisan kirajzolt szörny objektumok, hogy csak a megadott szörny legyen kirajzolva
            const monsterX = monster.getX();
            const monsterY = monster.getY();

            const offsetX = Math.floor(map.width / 2);
            const offsetZ = Math.floor(map.height / 2);

            const worldX = (monsterX - offsetX) * this.tileSize;
            const worldZ = (monsterY - offsetZ) * this.tileSize;

            // Szörny megjelenítése (teszt jelleggel)
            const geometry = new THREE.ConeGeometry(
                this.tileSize * 0.4,
                this.tileSize,
                16
            );
            const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

            const monsterMesh = new THREE.Mesh(geometry, material);

            monsterMesh.position.set(
                worldX,
                this.tileSize / 2,
                worldZ
            );

            this.addObject(monsterMesh);
            this.monsterObjects.push(monsterMesh);
    }

    // A jelenetből eltávolítja az összes szörny objektumot
    public clearMonsters(): void {
        for (const monsterObject of this.monsterObjects) {
            this.removeObject(monsterObject);
        }

        this.monsterObjects = [];
    }

    // A megadott map tile-jait kirajzolja a jelenetbe
    public renderMap(map: Map): void {
        this.clearMap(); // Először töröljük a jelenetből az aktuálisan kirajzolt pálya objektumait

        const tiles = map.getTiles();
        const width = map.width;
        const height = map.height;

        // A térkép közepére helyezzük a koordináta-rendszert, így a (0,0) koordináta a térkép közepén lesz
        const offsetX = Math.floor(width / 2);
        const offsetZ = Math.floor(height / 2);

        // Végigmegyünk a térkép tile-jain és kirajzoljuk őket a jelenetbe
        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                const tile = tiles[z][x];

                const worldX = x - offsetX;
                const worldZ = z - offsetZ;

                // Ha a tile padló, akkor kirajzoljuk a padló elemet
                if (tile.type === TileType.Floor) {
                    const floorTile = this.createFloorTile(worldX, worldZ);
                    this.addObject(floorTile);
                    this.mapObjects.push(floorTile);
                }

                // Ha a tile fal, akkor először kirajzoljuk a padló elemet, majd a fal elemet, hogy a fal a padló fölött legyen
                if (tile.type === TileType.Wall) {
                    const floorTile = this.createFloorTile(worldX, worldZ);
                    this.addObject(floorTile);
                    this.mapObjects.push(floorTile);

                    const wallTile = this.createWallTile(worldX, worldZ);
                    this.addObject(wallTile);
                    this.mapObjects.push(wallTile);
                }
            }
        }
    }

    // Eltávolítja a jelenetből az aktuálisan kirajzolt pálya objektumait
    public clearMap(): void {
        for (const object of this.mapObjects) {
            this.removeObject(object);
        }

        this.mapObjects = [];
    }

    // Új objektum hozzáadása a jelenethez
    public addObject(object: THREE.Object3D): void {
        this.scene.add(object);
    }

    // Meglévő objektum eltávolítása a jelenetből
    public removeObject(object: THREE.Object3D): void {
        this.scene.remove(object);
    }

    // Renderelés
    public render(): void{
        this.renderer.render(this.scene, this.camera);
    }

    // Render ciklus indítása
    public start(): void {
        const animate = () => {

            this.animationFrameId = requestAnimationFrame(animate);

            //this.updateDebug() // Tesztkocka forgatása teszteléshez

            this.render();
    };
        animate();
    }

    // Render ciklus leállítása
    public stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // Ablak méretének változásakor a kamera és a renderer méretének frissítése
    public onResize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }




//TESZTELÉSHEZ KÉSZÜLT SEGÉDFÜGGVÉNYEK

    // Tesztkocka létrehozása teszteléshez
    /*private createDebugCube(): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xDAA06D });

        const cube = new THREE.Mesh(geometry, material);

        cube.position.y = 0.5;

        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFAF9F6 });
        const edgeLines = new THREE.LineSegments(edges, lineMaterial);

        cube.add(edgeLines);

    return cube;
}*/

    // Tesztkocka forgatása teszteléshez---------------------------
    /*private updateDebug(): void {
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;
    }*/

    // Padlóelem létrehozása a rácsban
    private createFloorTile(gridX: number, gridZ: number): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(this.tileSize, 0.1, this.tileSize); // Lapos kocka, padlóelem
        const material = new THREE.MeshStandardMaterial({ color: 0x666666 });

        const tile = new THREE.Mesh(geometry, material);

        tile.position.set(gridX * this.tileSize, -0.05, gridZ * this.tileSize); //tile magasság 0.1, így a mesh középpontja középre kerül (0.05+0.05)

        return tile;
    }

    private createWallTile(gridX: number, gridZ: number): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(this.tileSize, this.wallHeight, this.tileSize);
        const material = new THREE.MeshStandardMaterial({ color: 0x999999 });

        const wall = new THREE.Mesh(geometry, material);

        // Wall magasság 1, így a mesh középpontja középre kerül
        wall.position.set(
            gridX * this.tileSize,
            this.wallHeight / 2,
            gridZ * this.tileSize
        );
        
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xdddddd });
        const edgeLines = new THREE.LineSegments(edges, lineMaterial);

        wall.add(edgeLines);

        return wall;
    }
}