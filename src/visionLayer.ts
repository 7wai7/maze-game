import { Ray, RaycastResult, vec2 } from "p2";
import Vec from "./vector";
import Runner from "./players/runner";
import Core from "./core";
import Behaviour from "./baseBehaviour";
import { FOV_INDEX, FOW_RAYCAST_GROUP } from "./constants";
import type Renderable from "./renderable/renderable";

export default class VisionLayer extends Behaviour implements Renderable {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    raysCount = 180;
    fowRadius = 500;
    scaleFactor = .25;
    zIndex = FOV_INDEX;

    private raycastResult = new RaycastResult();
    private ray = new Ray({
        from: [0, 0],
        to: [0, 0],
        mode: Ray.CLOSEST,
        collisionGroup: FOW_RAYCAST_GROUP
    });
    private hitPoint = vec2.create();
    private fieldOfView: Vec[];

    constructor() {
        super();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.canvas.width = Core.game.worldWidth * this.scaleFactor;
        this.canvas.height = Core.game.worldHeight * this.scaleFactor;
        this.fieldOfView = Array.from({ length: this.raysCount }, () => new Vec());
        Core.renderer.addRenderable(this);
    }

    postUpdate() {
        if (!Core.debugTools.useTools || Core.debugTools.render.fov || Core.debugTools.render.fovRays) this.updateFOV();
    }

    private updateFOV() {
        const angleStep = Math.PI * 2 / this.fieldOfView.length;
        const rayStart = Vec.fromArray(Core.game.currentPlayer.body.position);

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
            Core.game.world.raycast(this.raycastResult, this.ray);

            if (this.raycastResult.hasHit()) {
                this.raycastResult.getHitPoint(this.hitPoint, this.ray);
                rayEnd.setArray(this.hitPoint);
            }
        }
    }


    render(ctx: CanvasRenderingContext2D) {
        this.clear();
        this.renderRaysFOV();
        this.renderFOV();
        ctx.drawImage(this.canvas, 0, 0, Core.game.worldWidth, Core.game.worldHeight)
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private renderFOV() {
        if (Core.debugTools.useTools && !Core.debugTools.render.fov) return;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.scale(this.scaleFactor, this.scaleFactor);
        this.ctx.globalCompositeOperation = 'destination-out';

        const currentPlayer = Core.game.currentPlayer;
        const r = Math.random();
        const flicker = currentPlayer instanceof Runner ? ((r * 10) * this.scaleFactor) : 0;
        this.ctx.filter = `blur(${(12 + flicker) * this.scaleFactor}px)`;

        const flickerAlpha = currentPlayer instanceof Runner ? (0.9 + r * 0.1) : 1; // 0.9–1.0
        const attenuationFactor = currentPlayer instanceof Runner ? currentPlayer.torchAttenuationFactor : 0;
        const alpha = Math.max(flickerAlpha - attenuationFactor, .2);
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
        if (!Core.debugTools.useTools || !Core.debugTools.render.fovRays) return;
        const [startX, startY] = Core.game.currentPlayer.body.position;

        this.ctx.strokeStyle = 'yellow';
        this.ctx.lineWidth = .5;
        this.ctx.beginPath();
        for (let i = 0; i < this.fieldOfView.length; i++) {
            const { x, y } = this.fieldOfView[i];
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.stroke();

        this.ctx.strokeStyle = 'green';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        const { x: x0, y: y0 } = this.fieldOfView[0];
        this.ctx.moveTo(x0, y0);
        for (let i = 1; i < this.fieldOfView.length; i++) {
            const { x, y } = this.fieldOfView[i];
            this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
}