import type { ParticleValuesRanges } from "./particle";
import Particle from "./particle";
import Vec from "./vector";

export default class ParticleSystem {
    particles: Particle[] = [];
    maxCount = 1000;
    frequency = 50; // кількість частинок за секунду
    lastCreatedTime = 0;
    origin: Vec = new Vec();

    private fireCanvas!: HTMLCanvasElement;

    constructor() {
        this.createFireCanvas();
    }

    update(dt: number) {
        // створення нових частинок згідно з frequency
        const now = performance.now();
        if (now - this.lastCreatedTime > 1000 / this.frequency) {
            this.create(this.getFireRanges());
            this.lastCreatedTime = now;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(dt);
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        this.particles.forEach(p => p.render(ctx));
    }

    createFire() {
        this.create(this.getFireRanges());
    }

    create(values: ParticleValuesRanges) {
        if (this.particles.length >= this.maxCount) return;
        this.particles.push(new Particle(values));
    }

    getFireRanges(): ParticleValuesRanges {
        return {
            position: this.origin.copy(),
            velocity: [new Vec(-.3, -1), new Vec(.3, -2)],
            life: .1,
            size: [.1, .3],
            opacity: [.7, 1],
            img: this.fireCanvas
        }
    }


    createFireCanvas() {
        this.fireCanvas = document.createElement('canvas');
        this.fireCanvas.width = 100;
        this.fireCanvas.height = 100;
        const ctx = this.fireCanvas.getContext('2d') as CanvasRenderingContext2D;
        ctx.save();
        ctx.translate(this.fireCanvas.width / 2, this.fireCanvas.height / 2);
        ctx.filter = `blur(2px)`;
        ctx.fillStyle = "rgba(255, 102, 0, 1)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}