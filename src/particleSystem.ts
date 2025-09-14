import Behaviour from "./baseBehaviour";
import Core from "./core";
import type Renderable from "./renderable/renderable";
import type { ParticleValuesRanges } from "./particle";
import Particle from "./particle";
import Vec from "./vector";

export default class ParticleSystem extends Behaviour implements Renderable {
    frequency = 50; // кількість частинок за секунду
    origin: Vec = new Vec();
    zIndex = 0;

    private particles: Particle[] = [];
    private maxCount = 1000;
    private lastCreatedTime = 0;
    private fireCanvas!: HTMLCanvasElement;
    private deadIndex = -1;

    constructor(options: Partial<ParticleSystem> = {}) {
        super();
        this.frequency = options.frequency ?? this.frequency;
        this.origin = options.origin ?? this.origin;
        this.zIndex = options.zIndex ?? this.zIndex;
        this.createFireCanvas();
        Core.renderer.addRenderable(this);
    }

    update(dt: number) {
        // створення нових частинок згідно з frequency
        const now = performance.now();
        if (now - this.lastCreatedTime > 1000 / this.frequency) {
            this.create(this.getFireRanges());
            this.lastCreatedTime = now;
        }

        this.deadIndex = -1;
        this.particles.forEach((p, i) => {
            p.update(dt);
            if (p.life <= 0 && this.deadIndex === -1) this.deadIndex = i; // шукаємо першу мертву частинку
        })
    }

    render(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => p.render(ctx));
    }

    createFire() {
        this.create(this.getFireRanges());
    }

    create(values: ParticleValuesRanges) {
        if (this.deadIndex !== -1) {
            // перезаписуємо мертву частинку
            this.particles[this.deadIndex].updateValues(values);
        } else if (this.particles.length < this.maxCount) {
            // додаємо нову, якщо не досягли maxCount
            this.particles.push(new Particle(values));
        }
    }

    getFireRanges(): ParticleValuesRanges {
        return {
            position: this.origin.copy(),
            velocity: [new Vec(-.3, -1), new Vec(.3, -2)],
            life: .1,
            size: [.3, .5],
            opacity: [.7, 1],
            img: this.fireCanvas
        }
    }

    createFireCanvas() {
        this.fireCanvas = document.createElement('canvas');
        this.fireCanvas.width = 20;
        this.fireCanvas.height = 20;
        const ctx = this.fireCanvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.save();
        ctx.translate(this.fireCanvas.width / 2, this.fireCanvas.height / 2);
        ctx.filter = `blur(1px)`;
        ctx.fillStyle = "rgba(255, 102, 0, 1)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}