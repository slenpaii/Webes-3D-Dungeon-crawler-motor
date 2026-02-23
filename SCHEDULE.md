[SCHEDULE.md](https://github.com/user-attachments/files/25484944/SCHEDULE.md)
# Project Schedule

* 2026-03-01: Projekt Inicializálás és Környezet Beállítása
* 2026-03-08: Renderelő Modul Implementálása
* 2026-03-15: JSON Pályabetöltés \& Adatmodell
* 2026-03-22: Mozgás \& Kamera Vezérlés
* 2026-03-29: Körökre Osztott Játékmenet Motor
* 2026-04-05: Harcrendszer Implementálása
* 2026-04-12: AI \& Látómező Algoritmus
* 2026-04-19: Procedurális Pályagenerálás
* 2026-04-26: HUD \& UI Modul
* 2026-05-03: Hibakezelés \& Teljesítmény Optimalizálás
* 2026-05-10: Tesztelés \& Rendszerintegráció
* 2026-05-17: Dokumentáció \& Véglegesítés

## Projekt Inicializálás és Környezet Beállítása

A fejlesztői környezet felállítása TypeScript és Vite használatával.
A könyvtárszerkezet kialakítása a generikus keretrendszer és a játékspecifikus demó projekt szétválasztásához.

## Renderelő Modul Implementálása

A Three.js motor integrálása a 3D grafikai megjelenítéshez.
A renderelési ciklus elindítása, kamera és fények beállítása, valamint a 3D objektumok alapvető létrehozása.

## JSON Pályabetöltés \& Adatmodell

A belső adatmodell (Map, Tile, Hero, Monster, GameState) implementálása.
A külső JSON fájlok beolvasása, validálása, és a rácsalapú pálya felépítése a memóriában.

## Mozgás \& Kamera Vezérlés

A billentyűzetes bemenetek lekezelése. 
A rácson belüli mozgás és a 90 fokos kameraforgatás megírása, kiegészítve a célmező járhatóságának validálásával.

## Körökre Osztott Játékmenet Motor

A demó projekt fő vezérlőjének megírása, amely a játékos lépéseit és a körváltásokat kezeli.
Az entitások statisztikáinak és állapotváltozásainak (pl. HP visszatöltés pihenéssel) nyilvántartása.

## Harcrendszer Implementálása

A harci logika automatikus szimulálása.
A támadó és védőértékek kiértékelése, a harc kimenetelének meghatározása és az életerő frissítése.

## AI \& Látómező Algoritmus

A szörnyek viselkedését irányító modul elkészítése.

A látómező kiszámítása a hős észleléséhez, valamint az ezt követő üldözés, keresés és várakozás logikájának létrehozása.

## Procedurális Pályagenerálás

A rácsalapú labirintus generáló algoritmus megírása az újrajátszhatóság biztosítására.

A kezdőpont, a célpont és a szörnyek pozíciójának automatikus elhelyezése a pályán.

## HUD \& UI Modul

A felhasználói felület elkészítése, amely megjeleníti a hős életerejét, a körszámot és a statisztikákat.

Az automatikus térkép funkció implementálása, amely csak a felfedezett mezőket mutatja.

## Hibakezelés \& Teljesítmény Optimalizálás

A Frustum Culling technika véglegesítése a renderelő modulban, hogy csak a látható elemek rajzolódjanak ki.

A JSON betöltés és a futásidejű működés hibakezelésének beállítása a stabilitás érdekében.

## Tesztelés \& Rendszerintegráció

A keretrendszer API-jainak és a demó projekt eseményalapú logikáinak teljes körű összekötése.

Funkcionális és integrációs tesztek futtatása.

## Dokumentáció \& Véglegesítés

A forráskód végső megtisztítása.

A projekt architektúrájának és működésének dokumentálása, felkészítve a szoftvert a nyílt forráskódú közzétételre.







