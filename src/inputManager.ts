export default class InputManager {
    pressed = new Set<string>();
    clicked = new Set<string>();

    private onKeyDown = (e: KeyboardEvent) => {
        const k = e.key.toLowerCase();
        if (!this.pressed.has(k)) { 
            // перший раз натиснули
            this.clicked.add(k);
        }
        this.pressed.add(k);
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
