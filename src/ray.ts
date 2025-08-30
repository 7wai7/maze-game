import Collider from "./collider";
import Vec from "./vector";

export default class Ray extends Collider {
    dir: Vec;
    length: number;
    collision?: Collider; // Колайдер, з яким сталося зіткнення
    point: Vec; // Точка перетину

    constructor(start: Vec, dir: Vec, length: number) {
        super(start, false); // Промені не є статичними, але не прив’язані до GameObject
        this.dir = dir.normalize(); // Нормалізуємо напрямок
        this.length = length;
        this.point = new Vec();
    }

    getType(): string {
        return "ray";
    }

    render(ctx: CanvasRenderingContext2D): void {
        // const end = this.center.add(this.dir.scale(this.length));

        ctx.beginPath();
        ctx.moveTo(this.center.x, this.center.y);
        ctx.lineTo(this.point.x, this.point.y);
        ctx.strokeStyle = "yellow";
        ctx.stroke();

        console.log("render", this.point);
        
        // Рендеримо точку перетину, якщо є
        ctx.beginPath();
        ctx.arc(this.point.x, this.point.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
    }
}