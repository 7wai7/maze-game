import Behaviour from "../baseBehaviour";
import Core from "../core";
import Runner from "../players/runner";

export default class HurtOverlay extends Behaviour {
    img: HTMLImageElement;

    constructor() {
        super();
        this.img = document.getElementById('hurt-overlay') as HTMLImageElement;
    }

    postUpdate(): void {
        const p = Core.game.currentPlayer;
        if (!(p instanceof Runner)) return;
        const opacity = 1 - p.damageTimer.elapsed01();
        this.img.style.opacity = String(opacity);
    }
}