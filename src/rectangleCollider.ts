import Collider from "./collider";
import Vec from "./vector";

export default class RectangleCollider extends Collider {
    width: number; // Width of the rectangle
    height: number; // Height of the rectangle

    constructor(center: Vec, width: number, height: number) {
        super(center);
        this.width = width;
        this.height = height;
    }

    // Get the min (top-left) and max (bottom-right) corners
    getMin(): Vec {
        const { x, y } = this.object ? this.object.position : this.center;
        return new Vec(x - this.width / 2, y - this.height / 2);
    }

    getMax(): Vec {
        const { x, y } = this.object ? this.object.position : this.center;
        return new Vec(x + this.width / 2, y + this.height / 2);
    }

    getType(): string {
        return 'rectangle'
    }

    render(ctx: CanvasRenderingContext2D) {
        const { x, y } = this.getMin();

        ctx.beginPath();
        ctx.rect(x, y, this.width, this.height);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}