import Vec from "./vector";

export default abstract class GameObject {
    position: Vec;
    lastPosition: Vec;
    velocity: Vec;
    mass: number;

    constructor(position = new Vec(), mass = 1) {
        this.position = position;
        this.lastPosition = this.position.copy();
        this.velocity = new Vec();
        this.mass = mass;
    }

    update(dt: number) {
        this.lastPosition.setVec(this.position);
        this.position.addLocal(this.velocity.scale(dt));
    }

    abstract render(ctx: CanvasRenderingContext2D): void;
}