import Core from "../core";
import ParticleSystem from "../particleSystem";
import Timer from "../timer";
import { clamp, loadImage } from "../utils";
import Vec from "../vector";
import Player from "./player";

export default class Runner extends Player {
    hp = 100;
    isDead = false;
    invulnerabilityTimer = new Timer(1000);
    damageTimer = new Timer(1000);

    torchAttenuation = 0;
    torchAttenuationFactor = 0;

    private torchAttenuationSpeed = 5;
    private torch: ParticleSystem;
    private torchSprite?: HTMLImageElement;
    private torchOffset = new Vec(9, 5);

    constructor() {
        super();
        this.torch = new ParticleSystem();

        this.getRenderTorchSprite()
            .then(s => this.torchSprite = s);
    }

    canGetDamage() {
        return !this.isDead && (this.invulnerabilityTimer.isElapsed());
    }

    getDamage(damage: number) {
        if (!this.canGetDamage() || damage <= 0) return;

        this.invulnerabilityTimer.reset();
        this.damageTimer.reset();
        const incurredDamage = Math.min(damage, this.hp);
        this.hp -= incurredDamage;

        if (this.hp <= 0) {
            this.isDead = true;
            Core.emitter.emit('player-was-killed');
        }
    }

    move(dir: Vec, speed?: number) {
        if (!this.isDead) super.move(dir, speed);
    }

    update(dt: number) {
        if (this.isDead && this.torchAttenuationFactor < 1) {
            this.torchAttenuation = clamp(this.torchAttenuation + dt, 0, this.torchAttenuationSpeed);
            this.torchAttenuationFactor = this.torchAttenuation / this.torchAttenuationSpeed;
            this.torch.frequency = Math.max(this.torch.frequency - dt * 10, 0);
        }

        const p = this.torchOffset.copy().setAngle(this.torchOffset.getAngle() + this.body.angle);
        this.torch.origin.setArray(this.body.position).addLocal(p);
    }

    postUpdate(_dt: number): void { }

    render(ctx: CanvasRenderingContext2D) {
        if (!this.sprite || !this.torchSprite) return;

        const [x, y] = this.body.position;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.body.angle);

        ctx.save();
        ctx.translate(this.torchOffset.x - 2.5, this.torchOffset.y + .5);
        ctx.rotate(80 * Vec.DEGTORAD);
        ctx.drawImage(this.torchSprite, -this.torchSprite.width / 2, -this.torchSprite.height / 2);
        ctx.restore();

        if (this.isDead) ctx.filter = "grayscale(100%)"; // робить зображення сірим
        ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);
        ctx.filter = "none";
        ctx.restore();

        this.torch.render(ctx);
    }

    private async getRenderTorchSprite() {
        if (this.torchSprite) return this.sprite;

        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 7;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

        ctx.fillStyle = 'rgba(57, 33, 0, 1)'
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.torchSprite = await loadImage(canvas.toDataURL("image/png"));
        return this.torchSprite;
    }
}