import Camera from "./camera";
import VisionLayer from "./visionLayer";
import RenderSystem from "./renderSystem";
import Core from "./core";

export default class Renderer {
    camera = new Camera();
    renderSystem = new RenderSystem();

    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private vision!: VisionLayer;
    private inited = false;
    private frameCount = 0;
    private lastTime = performance.now();

    private renderTimeEl!: HTMLElement;
    private fpsEl!: HTMLElement;


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
        this.vision = new VisionLayer();
        const sprite = await Core.game.maze.getRenderSprite();

        this.renderSystem.add((ctx) => ctx.drawImage(sprite, 0, 0), 0);

        this.renderSystem.add((ctx) => {
            for (const p of Core.game.players) p.render?.(ctx);
        }, 10);

        this.renderSystem.add(
            (ctx) => {
                if (Core.debugTools.useTools && Core.debugTools.render.mazeNumbers) Core.game.maze.renderNumbers(ctx)
            }, 20
        )

        this.renderSystem.add((ctx) => {
            this.vision.render();
            ctx.drawImage(this.vision.canvas, 0, 0, Core.game.worldWidth, Core.game.worldHeight)
        }, 30);

        this.inited = true;
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
        this.renderSystem.render(this.ctx);
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