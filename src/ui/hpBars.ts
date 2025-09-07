import Behaviour from "../baseBehaviour";
import Core from "../core";
import type Player from "../players/player";
import Runner from "../players/runner";

export default class HPBars extends Behaviour {
    red: HTMLElement;
    darkRed: HTMLElement;
    green: HTMLElement;

    private barsContainer: HTMLElement;
    private maxWidth: number;

    constructor() {
        super();
        this.barsContainer = document.querySelector('.bars-container') as HTMLElement;
        this.red = document.getElementById('hide-bar-red') as HTMLElement;
        this.darkRed = document.getElementById('hide-bar-dark-red') as HTMLElement;
        this.green = document.getElementById('hide-bar-green') as HTMLElement;

        const style = getComputedStyle(document.documentElement);
        const hpBarWidth = style.getPropertyValue("--hp-bar-width").trim();
        this.maxWidth = parseInt(hpBarWidth, 10);

        Core.emitter.on('player-damaged', (player: Runner) => {
            if (Core.game.currentPlayer !== player) return;
            this.setValuesByPlayer(player);
        })

        Core.emitter.on('change-current-player', (player: Player) => {
            this.setValuesByPlayer(player);
        });
    }

    setValuesByPlayer(player: Player) {
        if (player instanceof Runner) {
            this.barsContainer.style.visibility = 'visible';

            const redFactor = player.hp / player.maxHp;
            this.red.style.width = `${this.maxWidth * redFactor}px`;

            const darkRedfactor = player.damageReductionCurrentValue / player.maxHp;
            this.darkRed.style.width = `${this.maxWidth * darkRedfactor}px`;

            const greenFactor = player.endurance / player.maxEndurance;
            this.green.style.width = `${this.maxWidth * greenFactor}px`;
        } else {
            this.barsContainer.style.visibility = 'hidden';
        }
    }

    update(_dt: number): void {
        const p = Core.game.currentPlayer;
        if (p instanceof Runner) {
            const factor = p.damageReductionCurrentValue / p.maxHp;
            this.darkRed.style.width = `${this.maxWidth * factor}px`;
            const greenFactor = p.endurance / p.maxEndurance;
            this.green.style.width = `${this.maxWidth * greenFactor}px`;
        }
    }
}