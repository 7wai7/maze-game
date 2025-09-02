import { Ray, RaycastResult, vec2 } from "p2";
import Vec from "./vector";
import type Renderer from "./renderer";

export default class VisionLayer {
    renderer: Renderer;
    canvas: HTMLCanvasElement;
    visionCtx: CanvasRenderingContext2D;
    isRenderFOV = true;
    raysCount = 180;
    fowDist = 500;

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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.visionCtx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        this.fieldOfView = Array.from({ length: this.raysCount }, () => new Vec());
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    clear() {
        this.visionCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.isRenderFOV) this.fillVision();
    }

    private fillVision() {
        this.visionCtx.fillStyle = 'rgba(0,0,0,1)';
        this.visionCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    update() {
        if (!this.isRenderFOV) return;

        this.updateFOV();

        this.visionCtx.globalCompositeOperation = 'destination-out';
        this.visionCtx.filter = `blur(${15 * this.renderer.camera.scale}px)`;
        this.visionCtx.fillStyle = 'rgba(0, 0, 0, 1)';

        this.visionCtx.beginPath();
        const { x: x0, y: y0 } = this.fieldOfView[0];
        this.visionCtx.moveTo(x0, y0);
        for (let i = 1; i < this.fieldOfView.length; i++) {
            const { x, y } = this.fieldOfView[i];
            this.visionCtx.lineTo(x, y);
        }
        this.visionCtx.closePath();
        this.visionCtx.fill();
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

            const rayEnd = rayStart.copy().addLocal(dir.scale(this.fowDist));

            vec2.copy(this.ray.from, rayStart.toArray());
            vec2.copy(this.ray.to, rayEnd.toArray());
            this.ray.update();
            this.raycastResult.reset();
            this.renderer.game.world.raycast(this.raycastResult, this.ray);

            let hit: Vec;
            if (this.raycastResult.hasHit()) {
                this.raycastResult.getHitPoint(this.hitPoint, this.ray);
                hit = Vec.fromArray(this.hitPoint);
            }
            else {
                hit = rayEnd;
            }

            this.fieldOfView[i].setVec(hit);
        }
    }

    private resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}