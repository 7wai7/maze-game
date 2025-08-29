import Vec from "./vector";
import Collider from "./collider";

export default class CircleCollider extends Collider {
    radius: number;

    constructor(center: Vec, radius: number) {
        super(center);
        this.radius = radius;
    }

    getType(): string {
        return 'circle';
    }

    render(ctx: CanvasRenderingContext2D) {
        const { x, y } = this.object ? this.object.position : this.center;

        ctx.beginPath();
        ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}