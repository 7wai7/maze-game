import Behaviour from "../baseBehaviour";
import Core from "../core";
import type Player from "../players/player";

export default class HPBars extends Behaviour {
    red: HTMLElement;
    darkRed: HTMLElement;
    green: HTMLElement;

    private maxWidth: number;

    constructor() {
        super();
        this.red = document.getElementById('hide-bar-red') as HTMLElement;
        this.darkRed = document.getElementById('hide-bar-dark-red') as HTMLElement;
        this.green = document.getElementById('hide-bar-green') as HTMLElement;

        const style = getComputedStyle(document.documentElement);
        const hpBarWidth = style.getPropertyValue("--hp-bar-width").trim();
        this.maxWidth = parseInt(hpBarWidth, 10);

        Core.emitter.on('player-damaged', (player: Player) => {
            if (Core.game.currentPlayer !== player) return;
            this.setValuesByPlayer(player);
        })

        Core.emitter.on('change-current-player', (player: Player) => {
            this.setValuesByPlayer(player);
        });
    }

    setValuesByPlayer(player: Player) {
        const redFactor = player.hp / player.maxHp;
        this.red.style.width = `${this.maxWidth * redFactor}px`;

        const darkRedfactor = player.damageReductionCurrentValue / player.maxHp;
        this.darkRed.style.width = `${this.maxWidth * darkRedfactor}px`;

        const greenFactor = player.endurance / player.maxEndurance;
        this.green.style.width = `${this.maxWidth * greenFactor}px`;
    }

    update(): void {
        const p = Core.game.currentPlayer;
        const factor = p.damageReductionCurrentValue / p.maxHp;
        this.darkRed.style.width = `${this.maxWidth * factor}px`;
        const greenFactor = p.endurance / p.maxEndurance;
        this.green.style.width = `${this.maxWidth * greenFactor}px`;
    }
}