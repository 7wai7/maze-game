import Camera from "./camera";
import Vec from "./vector";
import type Game from "./game";
import VisionLayer from "./visionLayer";
import RenderSystem from "./renderSystem";
import type InputManager from "./inputManager";

export default class Renderer {
    game: Game;
    input: InputManager;
    camera = new Camera();
    renderSystem = new RenderSystem();
    renderTimeEl!: HTMLElement;
    fpsEl!: HTMLElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    vision!: VisionLayer;
    worldWidth: number;
    worldHeight: number;
    inited = false;

    private frameCount = 0;
    private lastTime = performance.now();


    constructor(game: Game, input: InputManager) {
        this.game = game;
        this.input = input;
        this.renderTimeEl = document.getElementById('render-time') as HTMLElement;
        this.fpsEl = document.getElementById('fps') as HTMLElement;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.resizeCanvas();

        this.worldWidth = game.worldWidth;
        this.worldHeight = game.worldHeight;

        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('wheel', (e) => this.camera.zoom(e.deltaY > 0 ? -1 : 1));

        document.body.appendChild(this.canvas);
    }

    async init() {
        this.vision = new VisionLayer(this);
        const sprite = await this.game.maze.getRenderSprite();
        this.renderSystem.add((ctx) => ctx.drawImage(sprite, 0, 0), 0);

        this.renderSystem.add((ctx) => {
            for (const p of this.game.players) p.render(ctx);
        }, 1);

        this.renderSystem.add(() => this.vision.render(), 5);

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


            this.game.update(dt);
            this.camera.setTarget(Vec.fromArray(this.game.currentPlayer.body.position));
            if (this.input.clicked.has('r')) this.vision.isRenderFOV = !this.vision.isRenderFOV;
            if (this.input.clicked.has('y')) this.vision.isRayRenderFOV = !this.vision.isRayRenderFOV;

            this.vision.update(dt);
            this.camera.postUpdate();

            this.render();
            this.input.clicked.clear();

            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

    averageRenderTime: number[] = Array(100).fill(0);
    lastRenderIndex = 0;
    render() {
        if (!this.inited) return;
        this.ctx.imageSmoothingEnabled = false;
        const start = performance.now();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.vision.clear();

        this.camera.apply(this.ctx);
        this.renderSystem.render(this.ctx);

        this.ctx.drawImage(
            this.vision.canvas,
            0, 0, this.worldWidth, this.worldHeight
        );

        this.camera.reset(this.ctx);


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