import Camera from "./camera";
import VisionLayer from "./visionLayer";
import Core from "./core";
import Sprite from "./renderable/sprite";
import type Renderable from "./renderable/renderable";

export default class Renderer {
    camera = new Camera();
    rootSprite = new Sprite(true);
    isModifiedQueue: boolean = false;
    private renderQueue: Renderable[] = [];

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private frameCount = 0;
    private lastTime = performance.now();

    private renderTimeEl!: HTMLElement;
    private fpsEl!: HTMLElement;
    private inited = false;


    constructor() {
        this.renderTimeEl = document.getElementById('render-time') as HTMLElement;
        this.fpsEl = document.getElementById('fps') as HTMLElement;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('wheel', (e) => this.camera.zoom(e.deltaY > 0 ? -1 : 1));
        document.body.appendChild(this.canvas);

        Core.emitter.on('change-current-player', () => {
            Core.game.currentPlayer.miniMap.render();
        })
    }

    async init() {
        new VisionLayer();
        Core.game.maze.renderSprite();
        Core.game.maze.renderNumbers();
        this.inited = true;
    }

    addRenderable(r: Renderable) {
        this.renderQueue.push(r);
        this.isModifiedQueue = true;
    }

    start() {
        let lastUpdate = performance.now();
        const loop = () => {
            const now = performance.now();
            const dt = (now - lastUpdate) / 1000;
            lastUpdate = now;
            this.frameCount++;

            if (now - this.lastTime >= 1000) {
                this.fpsEl.innerText = `${this.frameCount.toFixed(2)}`;
                this.frameCount = 0;
                this.lastTime = now;
            }


            Core.game.update(dt);
            Core.game.postUpdate(dt);

            this.render();
            Core.inputManager.postUpdate();

            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

    render() {
        if (!this.inited) return;

        this.ctx.imageSmoothingEnabled = false;
        const start = performance.now();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.camera.apply(this.ctx);
        this.rootSprite.updateWorldTransform();

        if (this.isModifiedQueue) {
            this.renderQueue.sort((a, b) => b.zIndex - a.zIndex);
            this.isModifiedQueue = false;
        }

        for (const s of this.renderQueue) s.render(this.ctx);
        for (let i = this.renderQueue.length - 1; i >= 0; i--) {
            const s = this.renderQueue[i];
            s.render(this.ctx);
            if (s.isDestroyed) {
                this.renderQueue.splice(i, 1);
            }
        }

        this.camera.reset(this.ctx);

        this.calculateAverageRenderTime(start);
    }

    private averageRenderTime: number[] = Array(100).fill(0);
    private lastRenderIndex = 0;
    calculateAverageRenderTime(start: number) {
        const end = performance.now();
        const time = end - start;
        this.averageRenderTime[this.lastRenderIndex] = time;
        this.lastRenderIndex++;
        if (this.lastRenderIndex >= this.averageRenderTime.length) {
            this.lastRenderIndex = 0;

            // середній час рендеру (ms)
            let avgTime = 0;
            this.averageRenderTime.forEach(t => avgTime += t);
            avgTime /= this.averageRenderTime.length;
            this.renderTimeEl.innerText = `${avgTime.toFixed(2)}`;
        }
    }


    private resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.render();
    }
}