import Vec from "./vector";

export default class Camera {
    position: Vec;
    scale: number;
    speed: number;
    zoomStep: number;

    constructor(position = new Vec(), scale = 2) {
        this.position = position; // центр камери у світових координатах
        this.scale = scale;
        this.speed = 5;
        this.zoomStep = .2;
    }

    // Переміщення камери в точку
    moveTo(target: Vec) {
        this.position.setVec(target);
    }

    // Плавне слідування за об’єктом (наприклад гравцем)
    follow(target: Vec, dt: number) {
        this.position.addLocal(
            target.sub(this.position).scale(this.speed).scale(dt)
        )
    }

    // Збільшення / зменшення масштабу
    zoom(factor: number) {
        this.scale += this.zoomStep * factor;
        this.scale = Math.max(.5, Math.min(this.scale, 4));
    }

    // Застосувати камеру до контексту
    apply(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.scale(this.scale, this.scale);

        // зсув світу так, щоб камера "дивилась" у свою позицію
        ctx.translate(-this.position.x, -this.position.y);
    }

    // Скинути трансформацію (після відмалювання)
    reset(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }
}
