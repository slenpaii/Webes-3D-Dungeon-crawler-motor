/*  
    Renderer modul
    A 3D jelenet megjelenítéséért felelős.
    Kezeli a Three.js Scene-t, Camera-t és WebGLRenderer-t,
    valamint a render ciklust.
*/

// TODO: window.innerWidth és window.innerHeight -> this.container.clientWidth onResize container-alapú méretezésre refaktor
// TODO: több helyen használt - duplikált eljárások (pl.: rendermonster,calculateCameraTarget) -> refaktor (gridToWorldPosition helper)

import * as THREE from "three";
import { Map } from "../map/Map";
import { TileType } from "../map/TileType";
import { Hero } from "../game/Hero";
import type { Monster } from "../game/Monster";

export class Renderer {

private container : HTMLElement;

private scene!: THREE.Scene;
private camera!: THREE.PerspectiveCamera;
private renderer!: THREE.WebGLRenderer;

private animationFrameId: number | null = null; // Az aktuális requestAnimationFrame ID-ja, hogy szükség esetén le lehessen állítani a render ciklust

private mapObjects: THREE.Object3D[] = []; // A jelenetben megjelenített térkép objektumok listája
private monsterObjects: globalThis.Map<Monster, THREE.Object3D> = new globalThis.Map(); // Szörny példány -> jelenetbeli objektum

private readonly tileSize: number = 1; // A tile-ok mérete a világban
private readonly wallHeight: number = 1; // A falak magassága a világban

// Kamera mozgásához kapcsolódó változók
private isCameraMoving: boolean = false; // Jelző, hogy a kamera éppen mozog-e
private cameraMoveStartTime: number = 0; // A kamera mozgásának kezdőideje
private readonly cameraMoveDuration: number = 200; // A kamera mozgásának időtartama (ms)

private cameraStartPosition: THREE.Vector3 = new THREE.Vector3(); // A kamera mozgásának kezdő pozíciója
private cameraTargetPosition: THREE.Vector3 = new THREE.Vector3(); // A kamera mozgásának cél pozíciója
private cameraStartLookAt: THREE.Vector3 = new THREE.Vector3(); // A kamera mozgásának kezdő nézési pozíciója
private cameraTargetLookAt: THREE.Vector3 = new THREE.Vector3(); // A kamera mozgásának cél nézési pozíciója


// Fények
private torchLight!: THREE.PointLight;


// Szörny mozgásához kapcsolódó változók
private readonly monsterMoveDuration: number = 200; // A szörny mozgás animációjának időtartama (ms)

private monsterAnimations: globalThis.Map<
    Monster,
    {
        object: THREE.Object3D;
        startPosition: THREE.Vector3;
        targetPosition: THREE.Vector3;
        startTime: number;
    }
    > = new globalThis.Map();


constructor(container: HTMLElement) {
    this.container = container;

    this.setupScene();
    this.setupCamera();
    this.setupRenderer();

    this.setupLights();
    //this.setupHelpers();

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

        // Kezdeti kameraállapot; indulás után az updateCamera() a hero nézetéhez igazítja.
        this.camera.position.set(0, 20, 10); 
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.08); // 0 -> semmi nem látható | 1 -> minden látszik
        this.addObject(ambientLight);

        this.torchLight = new THREE.PointLight(0xffaa55, 1.2, 5);
        this.torchLight.position.set(0, 0, 0);

        this.camera.add(this.torchLight);
        this.scene.add(this.camera);
    }

    // Segédeszközök létrehozása
    /*private setupHelpers(): void {
        const gridHelper = new THREE.GridHelper(50, 50);
        this.addObject(gridHelper);
    }*/

    // Kamera cél pozíciójának kiszámítása
    private calculateCameraTarget(hero: Hero, map: Map, direction: number): 
    { position: THREE.Vector3, lookAt: THREE.Vector3 } {
        const heroX = hero.getX();
        const heroY = hero.getY();

        const offsetX = Math.floor(map.width / 2);
        const offsetZ = Math.floor(map.height / 2);

        const worldX = (heroX - offsetX) * this.tileSize;
        const worldZ = (heroY - offsetZ) * this.tileSize;

        const eyeHeight = 0.7; // Kamera magassága a hősön
        const lookHeight = eyeHeight - 0.3;
        const lookDistance = this.tileSize * 2; // Milyen messzire nézzen a kamera a hőstől

        let lookX = worldX;
        let lookZ = worldZ;

        switch (direction) {
            case 0: // Észak
                lookZ = worldZ - lookDistance;
                break;
            case 1: // Kelet
                lookX = worldX + lookDistance;
                break;
            case 2: // Dél
                lookZ = worldZ + lookDistance;
                break;
            case 3: // Nyugat
                lookX = worldX - lookDistance;
                break;
        }
        return {
            position: new THREE.Vector3(worldX, eyeHeight, worldZ),
            lookAt: new THREE.Vector3(lookX, lookHeight, lookZ)
        }
    }

    // A kamera animációjának frissítése minden frameben
    private updateCameraAnimation(): void {
        if (!this.isCameraMoving) {
            return;
        }

        const elapsed = performance.now() - this.cameraMoveStartTime;
        const progress = Math.min(elapsed / this.cameraMoveDuration, 1);

        const currentPosition = new THREE.Vector3().lerpVectors(
            this.cameraStartPosition,
            this.cameraTargetPosition,
            progress
        );

        const currentLookAt = new THREE.Vector3().lerpVectors(
            this.cameraStartLookAt,
            this.cameraTargetLookAt,
            progress
        );

        this.camera.position.copy(currentPosition);
        this.camera.lookAt(currentLookAt);

        if (progress >= 1) {
            this.isCameraMoving = false;
        }
    }



    // A hős kirajzolása a jelenetbe
    public renderHero(_hero: Hero, _map: Map): void {
        // First-person nézetben a hero modell jelenleg nem kerül kirajzolásra.

    }

    // A szörny kirajzolása a jelenetbe
    public renderMonster(monster: Monster, map: Map): void {
        const existingMonsterObject = this.monsterObjects.get(monster);

        if (existingMonsterObject) {
            this.removeObject(existingMonsterObject);
            this.monsterObjects.delete(monster);
        }

        const monsterX = monster.getX();
        const monsterY = monster.getY();

        const worldPosition = this.gridToWorldPosition(
            monsterX,
            monsterY,
            map,
            this.tileSize / 2
        );

        // Szörny megjelenítése (teszt jelleggel)
        const geometry = new THREE.ConeGeometry(
            this.tileSize * 0.4,
            this.tileSize,
            16
        );

        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

        const monsterMesh = new THREE.Mesh(geometry, material);

        monsterMesh.position.copy(worldPosition);

        this.addObject(monsterMesh);
        this.monsterObjects.set(monster, monsterMesh);    
    }

    // Új kamera-célállapot beállítása és a smooth animáció elindítása
    public updateCamera(hero: Hero, map: Map, direction: number): void {
        const target = this.calculateCameraTarget(hero, map, direction);

        this.cameraStartPosition.copy(this.camera.position);
        this.cameraTargetPosition.copy(target.position);

        const currentLookDirection = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookDirection);

        const currentLookAt = this.camera.position.clone().add(currentLookDirection);
        this.cameraStartLookAt.copy(currentLookAt);
        this.cameraTargetLookAt.copy(target.lookAt);

        this.cameraMoveStartTime = performance.now();
        this.isCameraMoving = true;
    }

    // A kamera mozog-e éppen
    public isMoving(): boolean{
        return this.isCameraMoving;
    }



    // A jelenetből eltávolítja az összes szörny objektumot
    public clearMonsters(): void {
        for (const monsterObject of this.monsterObjects.values()) {
            this.removeObject(monsterObject);
        }

        this.monsterObjects.clear();
    }

    // A jelenetből eltávolítja a megadott szörny objektumot
    public clearMonster(monster: Monster): void {
        const monsterObject = this.monsterObjects.get(monster);

        if (!monsterObject) {
            return;
        }

        this.removeObject(monsterObject);
        this.monsterObjects.delete(monster);
    }

    // A szörny mozgásának animálása a jelenetben
    public animateMonsterMove(monster: Monster, map: Map): void {
        const monsterObject = this.monsterObjects.get(monster);

        if(!monsterObject) {
            this.renderMonster(monster, map);
            return;
        }

        const targetPosition = this.gridToWorldPosition(
            monster.getX(),
            monster.getY(),
            map,
            this.tileSize / 2
        );

        this.monsterAnimations.set(monster, {
            object: monsterObject,
            startPosition: monsterObject.position.clone(),
            targetPosition: targetPosition,
            startTime: performance.now()
        });
    }

    // A szörny mozgásának animációjának frissítése minden frame-ben
    public updateMonsterAnimations(): void {
    if (this.monsterAnimations.size === 0) {
        return;
    }
    for (const [monster, animation] of this.monsterAnimations) {
        const elapsed = performance.now() - animation.startTime;
        const progress = Math.min(elapsed / this.monsterMoveDuration, 1);

        const currentPosition = new THREE.Vector3().lerpVectors(
            animation.startPosition,
            animation.targetPosition,
            progress
        );

        animation.object.position.copy(currentPosition);

        if (progress >= 1) {
            animation.object.position.copy(animation.targetPosition);
            this.monsterAnimations.delete(monster);
        }
    }
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
                    //Padló
                    const floorTile = this.createFloorTile(worldX, worldZ);
                    this.addObject(floorTile);
                    this.mapObjects.push(floorTile);

                    //Plafon
                    const ceilingTile = this.createCeilingTile(worldX,worldZ);
                    this.addObject(ceilingTile);
                    this.mapObjects.push(ceilingTile);
                }

                // Ha a tile fal, akkor először kirajzoljuk a padló elemet, majd a fal elemet, hogy a fal a padló fölött legyen
                if (tile.type === TileType.Wall) {
                    //Padló
                    const floorTile = this.createFloorTile(worldX, worldZ);
                    this.addObject(floorTile);
                    this.mapObjects.push(floorTile);

                    //Fal
                    const wallTile = this.createWallTile(worldX, worldZ);
                    this.addObject(wallTile);
                    this.mapObjects.push(wallTile);

                    //Plafon
                    const ceilingTile = this.createCeilingTile(worldX,worldZ);
                    this.addObject(ceilingTile);
                    this.mapObjects.push(ceilingTile);
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

            this.updateCameraAnimation(); // Kamera animációjának frissítése, ha a kamera éppen mozog
            this.updateMonsterAnimations(); // Szörny mozgás animációjának frissítése
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




// BELSŐ SEGÉDFÜGGVÉNYEK

    // Padlóelem létrehozása a rácsban
    private createFloorTile(gridX: number, gridZ: number): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(this.tileSize, 0.1, this.tileSize); // Lapos kocka, padlóelem
        const material = new THREE.MeshStandardMaterial({ color: 0x666666 });

        const tile = new THREE.Mesh(geometry, material);

        tile.position.set(
            gridX * this.tileSize,
            -0.05,
            gridZ * this.tileSize
        ); //tile magasság 0.1, így a mesh középpontja középre kerül (0.05+0.05)

        return tile;
    }

    //Falelem létrehozása a rácsban
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
        
        //const edges = new THREE.EdgesGeometry(geometry);
        //const lineMaterial = new THREE.LineBasicMaterial({ color: 0xdddddd });
        //const edgeLines = new THREE.LineSegments(edges, lineMaterial);
        //wall.add(edgeLines);

        return wall;
    }

    // Plafonelem létrehozása a rácsban
    private createCeilingTile(gridX: number, gridZ: number): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(this.tileSize, 0.1, this.tileSize);
        const material = new THREE.MeshStandardMaterial({ color: 0x444444 });

        const tile = new THREE.Mesh(geometry, material);

        tile.position.set(
            gridX * this.tileSize,
            this.wallHeight + 0.05, //fal teteje
            gridZ * this.tileSize
        );

        return tile;
    }

    // Rács koordinátákból világ koordináták kiszámítása a szörny mozgásához
    private gridToWorldPosition(gridX: number, gridY: number, map: Map, worldY: number): THREE.Vector3 {
        const offsetX = Math.floor(map.width / 2);
        const offsetZ = Math.floor(map.height / 2);

        const worldX = (gridX - offsetX) * this.tileSize;
        const worldZ = (gridY - offsetZ) * this.tileSize;

        return new THREE.Vector3(worldX, worldY, worldZ);
    }
}