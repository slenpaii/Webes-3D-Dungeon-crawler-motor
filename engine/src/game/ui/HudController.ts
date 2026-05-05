import { GameState } from "../../core/game/GameState";

export class HudController {
    private container: HTMLDivElement;

    private turnText: HTMLDivElement;

    private messageText: HTMLDivElement;
    private messageOverlay: HTMLDivElement;
    private overlayTitle: HTMLDivElement;
    private overlayButton: HTMLButtonElement;

    private hpBarFill: HTMLDivElement;
    private hpBarText: HTMLDivElement;
    private statsContainer: HTMLDivElement;
    private minimapContainer: HTMLDivElement;

    constructor(parent: HTMLElement) {
        // Fő HUD container
        this.container = document.createElement("div");
        this.container.id = "hud";

        // Felső középső panel (visszajelzések)
        this.messageText = document.createElement("div");
        this.messageText.id = "hud-top-center";

        // Bal felső panel
        const topLeftPanel = document.createElement("div");
        topLeftPanel.id = "hud-top-left";

        // Jobb felső panel (HP + statok)
        const topRightPanel = document.createElement("div");
        topRightPanel.id = "hud-top-right";

        // Bal alsó panel (minimap)
        this.minimapContainer = document.createElement("div");
        this.minimapContainer.id = "hud-minimap";

        // HP bar container
        const hpBarContainer = document.createElement("div");
        hpBarContainer.id = "hud-hp-bar";

        // HP bar fill
        this.hpBarFill = document.createElement("div");
        this.hpBarFill.id = "hud-hp-bar-fill";

        this.hpBarText = document.createElement("div");
        this.hpBarText.id = "hud-hp-bar-text";

        hpBarContainer.appendChild(this.hpBarFill);
        hpBarContainer.appendChild(this.hpBarText);
        topRightPanel.appendChild(hpBarContainer);

        // Statok (szöveges)
        this.statsContainer = document.createElement("div");
        this.statsContainer.id = "hud-stats";

        topRightPanel.appendChild(this.statsContainer);

        // Szövegek
        this.turnText = document.createElement("div");

        topLeftPanel.appendChild(this.turnText);


        this.container.appendChild(topLeftPanel);
        this.container.appendChild(this.messageText);
        this.container.appendChild(topRightPanel);
        this.container.appendChild(this.minimapContainer);


        // Overlay (game over / win)
        this.messageOverlay = document.createElement("div");
        this.messageOverlay.id = "hud-overlay";

        this.overlayTitle = document.createElement("div");
        this.overlayTitle.id = "hud-overlay-title";

        this.overlayButton = document.createElement("button");
        this.overlayButton.id = "hud-overlay-button";

        this.overlayButton.addEventListener("click", () => {
            window.location.reload();
        });

        this.messageOverlay.appendChild(this.overlayTitle);
        this.messageOverlay.appendChild(this.overlayButton);

        // DOM-ba rakás
        parent.appendChild(this.container);
        parent.appendChild(this.messageOverlay);
    }

    public update(gameState: GameState): void {
        const hero = gameState.getHero();

        const hpPercent = Math.max(0, Math.min(100, hero.getHp()));

        this.turnText.textContent = `Turn: ${gameState.getTurnCount()}`;

        this.hpBarFill.style.width = `${hpPercent}%`;
        this.hpBarText.textContent = `${hero.getHp()} / 100`;
        
        const enemies = gameState.getMonsters().length;


        this.statsContainer.innerHTML = `
            <div class="hud-stat-row">
                <span>Támadás</span>
                <strong>${hero.getAttack()}</strong>
            </div>
            <div class="hud-stat-row">
                <span>Védelem</span>
                <strong>${hero.getDefense()}</strong>
            </div>
            <div class="hud-stat-row">
                <span>Ellenfelek</span>
                <strong>${enemies}</strong>
            </div>
        `;

        this.renderMinimap(gameState);
        
        if (gameState.getIsGameOver()) {
            this.overlayTitle.textContent = "GAME OVER";
            this.overlayButton.textContent = "Retry";
            this.messageOverlay.classList.add("visible");
        } else if (gameState.getIsGameWon()) {
            this.overlayTitle.textContent = "VICTORY!";
            this.overlayButton.textContent = "Next Round";
            this.messageOverlay.classList.add("visible");
        }
    }

    public showMessage(message: string): void {
        this.messageText.textContent = message;
        this.messageText.classList.add("visible");

        window.setTimeout(() => {
            this.messageText.classList.remove("visible");
        }, 1500);
    }

    private renderMinimap(gameState: GameState): void {
        const map = gameState.getMap();

        this.minimapContainer.innerHTML = "";

        for (let y = map.height - 1; y >= 0; y--) {
            for (let x = map.width - 1; x >= 0; x--) {
                const cell = document.createElement("div");
                cell.className = "hud-minimap-cell";

                const hero = gameState.getHero();
                if (hero.getX() === x && hero.getY() === y) {
                    cell.classList.add("hero");
                }

                if (gameState.isTileExplored(x, y)) {
                    const tile = map.getTile(x, y);

                    if (tile !== null && tile.isWalkable()) {
                        cell.classList.add("floor");
                    } else {
                        cell.classList.add("wall");
                    }
                }

                this.minimapContainer.appendChild(cell);
            }
        }
    }
}