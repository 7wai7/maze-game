import Behaviour from "../baseBehaviour";
import Core from "../core";

export default class HurtOverlay extends Behaviour {
    img: HTMLImageElement;

    constructor() {
        super();
        this.img = document.getElementById('hurt-overlay') as HTMLImageElement;
    }

    postUpdate(): void {
        const p = Core.game.currentPlayer;
        const opacity = 1 - p.damageTimer.elapsed01();
        this.img.style.opacity = String(opacity);
    }
}