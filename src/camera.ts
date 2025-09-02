import Vec from "./vector";

export default class Camera {
    position: Vec;
    lastPosition: Vec;
    scale: number;
    lastScale: number;
    speed: number;
    scaleSpeed: number;
    zoomStep: number;
    target?: Vec;
    targetScale: number;

    constructor(position = new Vec(), scale = 2) {
        this.position = position; // центр камери у світових координатах
        this.lastPosition = position.copy();
        this.scale = scale;
        this.lastScale = scale;
        this.targetScale = scale;
        
        this.speed = .1;
        this.scaleSpeed = .05;
        this.zoomStep = .2;
    }

    postUpdate() {
        this.lastScale = this.scale;
        this.lastPosition.setVec(this.position);

        this.scale += (this.targetScale - this.scale) * this.scaleSpeed;

        if (this.target) {
            this.position.addLocal(
                this.target.sub(this.position).scale(this.speed)
            )
        }
    }

    setTarget(target: Vec) {
        this.target ? this.target.setVec(target) : this.target = target;
    }

    setZoom(zoom: number) {
        this.targetScale = zoom;
        this.restrictZoom();
    }

    // Збільшення / зменшення масштабу
    zoom(factor: number) {
        this.targetScale += this.zoomStep * factor;
        this.restrictZoom();
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
    
    private restrictZoom() {
        this.targetScale = Math.max(.5, Math.min(this.targetScale, 4));
    }
}
