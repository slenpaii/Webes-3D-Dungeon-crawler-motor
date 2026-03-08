/*  
    Renderer modul
    A 3D jelenet megjelenítéséért felelős.
    Kezeli a Three.js Scene-t, Camera-t és WebGLRenderer-t,
    valamint a render ciklust.
*/

import * as THREE from "three";

export class Renderer {

private container : HTMLElement;

private cube      !: THREE.Mesh; // Tesztkocka a renderelés teszteléséhez

private scene     !: THREE.Scene;
private camera    !: THREE.PerspectiveCamera;
private renderer  !: THREE.WebGLRenderer;

private animationFrameId: number | null = null;



constructor(container: HTMLElement) {
    this.container = container;

    this.setupScene();
    this.setupCamera();
    this.setupRenderer();

    this.setupLights();
    this.setupHelpers();

    // Tesztkocka
    this.cube = this.createDebugCube();
    this.addObject(this.cube);

    // Tesztmap
    const testMap = [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1]];
    this.createMapFromArray(testMap);

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

        this.camera.position.set(5, 5, 5);
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
        const gridHelper = new THREE.GridHelper(20, 20);
        this.addObject(gridHelper);
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

            //this.updateDebug()

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
    private createDebugCube(): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xDAA06D });

        const cube = new THREE.Mesh(geometry, material);

        cube.position.y = 0.5;

        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFAF9F6 });
        const edgeLines = new THREE.LineSegments(edges, lineMaterial);

        cube.add(edgeLines);

    return cube;
}

    // Tesztkocka forgatása teszteléshez
    /*private updateDebug(): void {

        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

}*/

    // Padlóelem létrehozása a rácsban
    private createFloorTile(gridX: number, gridZ: number): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(1, 0.1, 1); // Lapos kocka, padlóelem
        const material = new THREE.MeshStandardMaterial({ color: 0x666666 });

        const tile = new THREE.Mesh(geometry, material);

        tile.position.set(gridX, -0.05, gridZ); //tile magasság 0.1, így a mesh középpontja középre kerül (0.05+0.05)

        return tile;
    }

    private createWallTile(gridX: number, gridZ: number): THREE.Mesh {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x999999 });

        const wall = new THREE.Mesh(geometry, material);

        wall.position.set(gridX, 0.5, gridZ); //wall magasság 1, így a mesh középpontja középre kerül
        
        return wall;
    }

    // Padló rács létrehozása a megadott szélességgel és magassággal
    private createFloorGrid(width: number, height: number): void {

        const offsetX = Math.floor(width / 2);
        const offsetZ = Math.floor(height / 2);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const worldX = x - offsetX;
                const worldZ = y - offsetZ;

                const tile = this.createFloorTile(worldX, worldZ);
                this.addObject(tile);
            }
        }
    }

    // Tömbből térkép létrehozása, ahol 0 = padló, 1 = fal
    private createMapFromArray(mapData: number[][]): void {
        const height = mapData.length;
        const width = mapData[0].length;

        const offsetX = Math.floor(width / 2);
        const offsetY = Math.floor(height / 2);

        for (let z = 0; z < height; z++) {
            for (let x = 0; x < width; x++) {
                const cell = mapData[z][x];

                const worldX = x - offsetX;
                const worldZ = z - offsetY;

                if (cell === 0) {
                    const floorTile = this.createFloorTile(worldX, worldZ);
                    this.addObject(floorTile);
                }

                if (cell === 1) {
                    const floorTile = this.createFloorTile(worldX, worldZ);
                    this.addObject(floorTile);

                    const wallTile = this.createWallTile(worldX, worldZ);
                    this.addObject(wallTile);
                }
            }
        }
    }
}