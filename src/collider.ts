import type GameObject from "./gameObject";
import Vec from "./vector";

export default abstract class Collider {
    center: Vec;
    isStatic: boolean;
    object?: GameObject;

    constructor(center: Vec, isStatic = true) {
        this.center = center;
        this.isStatic = isStatic;
    }

    setGameObject(object: GameObject) {
        this.object = object;
        this.isStatic = false;
        this.center = object.position;
    }

    abstract getType(): string;

    abstract render(ctx: CanvasRenderingContext2D): void;
}