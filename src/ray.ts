import Collider from "./collider";
import type Vec from "./vector";

export default class Ray extends Collider {
    dir: Vec;
    length: number;
    collision?: Collider;
    point?: Vec;

    constructor(start: Vec, dir: Vec, length: number) {
        super(start);
        this.dir = dir;
        this.length = length;
    }

    getType(): string {
        return 'rey';
    }

    render(ctx: CanvasRenderingContext2D): void {
        const end = this.center.add(this.dir.scale(this.length));

        ctx.moveTo(this.center.x, this.center.y);
        ctx.lineTo(end.x, end.y);
    }
}