import Core from "./core";

export default abstract class Behaviour {
    protected game = Core.game;
    protected renderer = Core.renderer;

    constructor() {
        Core.gameObjects.push(this);
    }

    update?(dt: number): void;
    postUpdate?(dt: number): void;
}