import CircleCollider from "./circleCollider";
import GameObject from "./gameObject";
import Vec from "./vector";

export default class Player extends GameObject {
    speed: number;
    runSpeed: number;
    isRun: boolean;
    radius: number;
    collider: CircleCollider;

    constructor() {
        super();
        this.speed = .15;
        this.runSpeed = this.speed * 3;
        this.isRun = false;
        this.radius = 10;
        
        this.collider = new CircleCollider(this.position, this.radius);
        this.collider.setGameObject(this);
    }

    move(dir: Vec) {
        const speed = this.isRun ? this.runSpeed : this.speed;
        this.velocity.setVec(dir.scale(speed));
    }

    update(dt: number) {
        this.lastPosition.setVec(this.position);
        this.position.addLocal(this.velocity.scale(dt));
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.fillStyle = 'red';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 10, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    }
}