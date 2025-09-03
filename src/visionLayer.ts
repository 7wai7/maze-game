import { Ray, RaycastResult, vec2 } from "p2";
import Vec from "./vector";
import type Renderer from "./renderer";
import Runner from "./players/runner";

export default class VisionLayer {
    renderer: Renderer;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    raysCount = 180;
    fowRadius = 500;
    scaleFactor = .2;

    isRenderFOV = true;
    isRayRenderFOV = false;

    private raycastResult = new RaycastResult();
    private ray = new Ray({
        from: [0, 0],
        to: [0, 0],
        mode: Ray.CLOSEST,
        collisionGroup: 0x0008
    });
    private hitPoint = vec2.create();
    private fieldOfView: Vec[];

    constructor(renderer: Renderer) {
        this.renderer = renderer;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvas.width = this.renderer.worldWidth * this.scaleFactor;
        this.canvas.height = this.renderer.worldHeight * this.scaleFactor;

        this.fieldOfView = Array.from({ length: this.raysCount }, () => new Vec());
    }

    update(_dt: number) {
        if (!this.isRenderFOV && !this.isRayRenderFOV) return;
        this.updateFOV();
    }

    private updateFOV() {
        const angleStep = Math.PI * 2 / this.fieldOfView.length;
        const rayStart = Vec.fromArray(this.renderer.game.currentPlayer.body.position);

        for (let i = 0; i < this.fieldOfView.length; i++) {
            const angle = angleStep * i;
            const dir = new Vec(
                Math.cos(angle),
                Math.sin(angle)
            );

            const rayEnd = this.fieldOfView[i]; // перевикористовуємо той самий Vec
            rayEnd.setVec(dir).scaleLocal(this.fowRadius).addLocal(rayStart);

            vec2.copy(this.ray.from, rayStart.toArray());
            vec2.copy(this.ray.to, rayEnd.toArray());
            this.ray.update();
            this.raycastResult.reset();
            this.renderer.game.world.raycast(this.raycastResult, this.ray);

            if (this.raycastResult.hasHit()) {
                this.raycastResult.getHitPoint(this.hitPoint, this.ray);
                rayEnd.setArray(this.hitPoint);
            }
        }
    }

    render() {
        if (this.isRenderFOV) this.renderFOV();
        if (this.isRayRenderFOV) this.renderRaysFOV();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.isRenderFOV) this.fillVision();
    }

    private fillVision() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private renderFOV() {
        const currentPlayer = this.renderer.game.currentPlayer;

        this.ctx.save();
        this.ctx.scale(this.scaleFactor, this.scaleFactor);

        this.ctx.globalCompositeOperation = 'destination-out';

        const r = Math.random();
        const flicker = currentPlayer instanceof Runner ? ((r * 10) * this.scaleFactor) : 0;
        this.ctx.filter = `blur(${(12 + flicker) * this.scaleFactor}px)`;

        const flickerAlpha = currentPlayer instanceof Runner ? (0.9 + r * 0.1) : 1; // 0.9–1.0
        const attenuationFactor = currentPlayer instanceof Runner ? currentPlayer.torchAttenuationFactor : 0;
        const alpha = Math.max(flickerAlpha - attenuationFactor, .1);
        this.ctx.fillStyle = `rgba(0,0,0,${alpha})`;

        this.ctx.beginPath();
        const { x: x0, y: y0 } = this.fieldOfView[0];
        this.ctx.moveTo(x0, y0);
        for (let i = 1; i < this.fieldOfView.length; i++) {
            const { x, y } = this.fieldOfView[i];
            this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    private renderRaysFOV() {
        this.renderer.renderSystem.add(
            (ctx) => {
                const [startX, startY] = this.renderer.game.currentPlayer.body.position;

                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = .5;
                ctx.beginPath();
                for (let i = 0; i < this.fieldOfView.length; i++) {
                    const { x, y } = this.fieldOfView[i];
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            },
            10,
            true
        )

        this.renderer.renderSystem.add(
            (ctx) => {
                ctx.strokeStyle = 'green';
                ctx.lineWidth = 1;
                ctx.beginPath();
                const { x: x0, y: y0 } = this.fieldOfView[0];
                ctx.moveTo(x0, y0);
                for (let i = 1; i < this.fieldOfView.length; i++) {
                    const { x, y } = this.fieldOfView[i];
                    ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            },
            11,
            true
        )
    }
}