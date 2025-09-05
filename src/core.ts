import type Behaviour from "./baseBehaviour";
import EventEmitter from "./EventEmitter";
import type Game from "./game";
import type InputManager from "./inputManager";
import type Renderer from "./renderer";

export default class Core {
    static game: Game;
    static renderer: Renderer;
    static inputManager: InputManager;
    static emitter = new EventEmitter();
    static gameObjects: Behaviour[] = [];

    static debugTools = {
        useTools: true,
        game: {
            collisions: true,
            fastSpeed: true
        },
        render: {
            fov: false,
            fovRays: false,
            aiWay: true,
            mazeNumbers: false
        }
    }
}