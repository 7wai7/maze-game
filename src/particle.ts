import Vec from "./vector";

export interface ParticleValuesRanges {
    position: Vec | [Vec, Vec];
    velocity: Vec | [Vec, Vec];
    life: number | [number, number];
    size: number | [number, number];
    opacity: number | [number, number];
    img: HTMLCanvasElement;
}

function getRandomRangeVec([v1, v2]: [Vec, Vec]): Vec {
    return new Vec(
        v1.x + Math.random() * (v2.x - v1.x),
        v1.y + Math.random() * (v2.y - v1.y)
    )
}

function getRandomRangeValue([min, max]: [number, number]): number {
    return min + Math.random() * (max - min);
}

export default class Particle {
    position: Vec;
    velocity: Vec;
    life: number;  // залишилось часу (секунди)
    size: number;
    opacity: number;
    img: HTMLCanvasElement;

    private maxLife: number;

    constructor(values: ParticleValuesRanges) {
        this.position = Array.isArray(values.position) ? getRandomRangeVec(values.position) : values.position;
        this.velocity = Array.isArray(values.velocity) ? getRandomRangeVec(values.velocity) : values.velocity;
        this.life = Array.isArray(values.life) ? getRandomRangeValue(values.life) : values.life;
        this.size = Array.isArray(values.size) ? getRandomRangeValue(values.size) : values.size;
        this.opacity = Array.isArray(values.opacity) ? getRandomRangeValue(values.opacity) : values.opacity;
        this.img = values.img;

        this.maxLife = this.life;
    }

    update(dt: number) {
        this.life -= dt;
        this.position.addLocal(this.velocity.scale(dt * 60));
    }


    render(ctx: CanvasRenderingContext2D) {
        if (this.life <= 0) return;



        const t = this.life / this.maxLife;

        ctx.save();
        ctx.globalAlpha = this.opacity * t;
        ctx.translate(this.position.x, this.position.y);
        ctx.scale(this.size, this.size);
        ctx.drawImage(this.img, -this.img.width / 2, -this.img.height / 2);
        ctx.restore();
    }
}