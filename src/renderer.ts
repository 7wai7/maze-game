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
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    vision!: VisionLayer;
    w = 0;
    h = 0;
    inited = false;


    constructor(game: Game, input: InputManager) {
        this.game = game;
        this.input = input;
        this.renderTimeEl = document.getElementById('render-time') as HTMLElement;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
        this.resizeCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('wheel', (e) => this.camera.zoom(e.deltaY > 0 ? -1 : 1));

        document.body.appendChild(this.canvas);
    }

    async init() {
        // create vision layer
        this.vision = new VisionLayer(this);

        // request maze sprite and register render callbacks
        const sprite = await this.game.maze.getRenderSprite();
        this.renderSystem.add((ctx) => ctx.drawImage(sprite, 0, 0), 0);

        // players
        this.renderSystem.add((ctx) => {
            for (const p of this.game.players) p.render(ctx);
        }, 1);

        // vision update should be run before final draw
        this.renderSystem.add(() => this.vision.update(), 5);

        this.inited = true;
    }

    start() {
        let lastUpdate = Date.now();
        const loop = () => {
            const now = Date.now();
            const dt = (now - lastUpdate) / 1000;
            lastUpdate = now;


            this.game.update(dt);
            // this.particleSystem.update(dt);

            this.camera.setTarget(Vec.fromArray(this.game.currentPlayer.body.position));
            if (this.input.clicked.has('r')) this.vision.isRenderFOV = !this.vision.isRenderFOV;
            this.camera.postUpdate();


            this.render();
            this.input.clicked.clear();

            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop);
    }

    averageRenderTime: number[] = Array.from({ length: 100 });
    lastRenderIndex = 0;
    render() {
        if(!this.inited) return;

        this.ctx.imageSmoothingEnabled = false;
        const start = performance.now();
        
        this.ctx.clearRect(0, 0, this.w, this.h);
        this.vision.clear();

        this.camera.apply(this.ctx);
        if (this.vision.isRenderFOV) this.camera.apply(this.vision.visionCtx);

        this.renderSystem.render(this.ctx);

        if (this.vision.isRenderFOV) this.camera.reset(this.vision.visionCtx);
        this.camera.reset(this.ctx);

        this.ctx.drawImage(this.vision.visionCtx.canvas, 0, 0);

        const end = performance.now();
        const time = end - start;
        this.averageRenderTime[this.lastRenderIndex] = time;
        this.lastRenderIndex++;
        if (this.lastRenderIndex >= this.averageRenderTime.length) {
            this.lastRenderIndex = 0;
            let value = 0;
            this.averageRenderTime.forEach(t => value += t);
            value /= this.averageRenderTime.length;
            this.renderTimeEl.innerText = `${value.toFixed(2)}ms`;
        }
    }


    private resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.render();
    }
}