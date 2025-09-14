import Core from "../core";
import type Runner from "../players/runner";
import type { InventoryItem } from "../types/InventoryItem";

export default function Interaction() {
    const interactionTitleEl = document.querySelector('.interaction-title') as HTMLElement;

    Core.emitter.on('start-trigger-item', (_: InventoryItem, runner: Runner) => {
        if(Core.game.currentPlayer !== runner) return;
        interactionTitleEl.style.display = 'block';
    });
    
    Core.emitter.on('end-trigger-item', (_: InventoryItem, runner: Runner) => {
        if(Core.game.currentPlayer !== runner) return;
        interactionTitleEl.style.display = 'none';
    });
}