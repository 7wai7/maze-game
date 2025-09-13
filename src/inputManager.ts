type InputGameKey =
  | "KeyW"
  | "KeyA"
  | "KeyS"
  | "KeyD"
  | "KeyQ"
  | "KeyE"
  | "Space"
  | "ShiftLeft";


export default class InputManager {
    pressed = new Set<InputGameKey>();
    clicked = new Set<InputGameKey>();

    private onKeyDown = (e: KeyboardEvent) => {
        const code = e.code as InputGameKey; // відслідковуємо клавішу, а не символ
        if (!this.pressed.has(code)) { 
            // перший раз натиснули
            this.clicked.add(code);
        }
        this.pressed.add(code);
    };

    private onKeyUp = (e: KeyboardEvent) => {
        this.pressed.delete(e.code as InputGameKey);
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
