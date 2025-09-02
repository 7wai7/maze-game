import { Body, Circle } from "p2";
import Vec from "./vector";
import ParticleSystem from "./particleSystem";

export default class Player {
    id: number;
    body: Body;
    speed: number;
    runSpeed: number;
    isRun: boolean;
    radius: number;
    bodyColor: string;
    bodyBorderColor: string;
    sprite?: HTMLImageElement;
    canvasSize = 100;

    torch: ParticleSystem;
    torchSprite?: HTMLImageElement;
    private torchOffset = new Vec(9, 5);

    constructor() {
        this.id = Math.random() * 1000;
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

        this.torch = new ParticleSystem();
        this.torch.origin = Vec.fromArray(this.body.position);

        this.getRenderSprite()
            .then(s => this.sprite = s);

        this.getRenderTorchSprite()
            .then(s => this.torchSprite = s);
    }

    update(dt: number) {
        this.torch.update(dt);

        const p = this.torchOffset.copy().setAngle(this.torchOffset.getAngle() + this.body.angle);
        this.torch.origin.setArray(this.body.position).addLocal(p);
    }

    move(dir: Vec) {
        if (dir.x === 0 && dir.y === 0) return;

        const speed = this.isRun ? this.runSpeed : this.speed;
        this.body.velocity = dir.scale(speed).toArray();
        this.body.angle = Math.atan2(dir.y, dir.x);
    }


    loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    render(ctx: CanvasRenderingContext2D) {
        if (!this.sprite) return;

        const [x, y] = this.body.position;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.body.angle);

        if (this.torchSprite) {
            ctx.save();
            ctx.translate(this.torchOffset.x - 2.5, this.torchOffset.y + .5);
            ctx.rotate(80 * Vec.DEGTORAD);
            ctx.drawImage(this.torchSprite, -this.torchSprite.width / 2, -this.torchSprite.height / 2);
            ctx.restore();
        }

        ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);

        ctx.restore();

        this.torch.render(ctx);
    }



    async getRenderSprite() {
        if (this.sprite) return this.sprite;

        const canvas = document.createElement('canvas');
        canvas.width = this.canvasSize;
        canvas.height = this.canvasSize;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
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

        ctx.restore();

        this.sprite = await this.loadImage(canvas.toDataURL("image/png"));
        return this.sprite;
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

    private async getRenderTorchSprite() {
        this.torchSprite
        if (this.torchSprite) return this.sprite;

        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 7;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

        ctx.fillStyle = 'rgba(57, 33, 0, 1)'
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.torchSprite = await this.loadImage(canvas.toDataURL("image/png"));
        return this.torchSprite;
    }
}