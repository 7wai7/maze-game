import { Body, Circle } from "p2";
import Vec from "./vector";

export default class Player {
    body: Body;
    speed: number;
    runSpeed: number;
    isRun: boolean;
    radius: number;
    bodyColor: string;
    bodyBorderColor: string;

    constructor() {
        this.speed = 5;
        this.runSpeed = this.speed * 3;
        this.isRun = false;
        this.radius = 5;
        this.body = new Body({
            mass: 1,
            damping: .99,
            angularDamping: .3
        });
        this.body.addShape(new Circle({
            radius: this.radius,
            collisionGroup: 0x0002,
            collisionMask: 0x0002 | 0x0004
        }))

        this.bodyColor = '#ffe5aeff';
        this.bodyBorderColor = '#92815bff';
    }

    move(dir: Vec) {
        if(dir.x === 0 && dir.y === 0) return;

        const speed = this.isRun ? this.runSpeed : this.speed;
        this.body.velocity = dir.scale(speed).toArray();
        this.body.angle = Math.atan2(dir.y, dir.x);
    }


    private renderHand(ctx: CanvasRenderingContext2D, isLeft = false) {
        const offset = this.radius;

        ctx.beginPath();
        ctx.arc(isLeft ? -offset : offset, -this.radius / 2, this.radius / 2, 0, Math.PI * 2); // Основне коло 
        ctx.fillStyle = this.bodyColor; // Колір тіла
        ctx.fill();
        ctx.strokeStyle = this.bodyBorderColor; // Темніший край
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    }

    render(ctx: CanvasRenderingContext2D) {
        // ctx.save();
        // ctx.translate(this.body.position[0], this.body.position[1]);
        // ctx.fillStyle = 'red';
        // ctx.lineWidth = 2;
        // ctx.beginPath();
        // ctx.ellipse(0, 0, this.radius, this.radius, 0, 0, 2 * Math.PI);
        // ctx.fill();
        // ctx.restore();

        const [x, y] = this.body.position;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.body.angle + Math.PI / 2);

        // Малювання лівої руки
        this.renderHand(ctx, true);

        // Малювання правої руки
        this.renderHand(ctx);

        // Малювання персонажа
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2); // Основне коло (тіло)
        ctx.fillStyle = this.bodyColor; // Колір тіла
        ctx.fill();
        ctx.strokeStyle = this.bodyBorderColor; // Темніший край
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();

        
        // Полум'я
        ctx.translate(-this.radius + 1, -this.radius / 2 - 3);
        ctx.rotate(Math.PI / 10);

        ctx.beginPath();
        ctx.fillStyle = 'orange';
        ctx.moveTo(-3, 0);
        ctx.lineTo(-2 + Math.random(), -(10 + Math.random() * 3));
        ctx.lineTo(-1, 0);
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = '#8b5a2b'; // Ручка факела
        ctx.fillRect(-3, -1, 2, 7);

        ctx.restore();
    }
}