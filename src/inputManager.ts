export default class InputManager {
    pressed = new Set<string>();
    clicked = new Set<string>();


    private onKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        this.pressed.add(k);
        this.clicked.add(k);
    };


    private onKeyUp = (e: KeyboardEvent) => {
        this.pressed.delete(e.key.toLowerCase());
    };


    constructor() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }


    postUpdate() {
        this.clicked.clear();
    }


    dispose() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}