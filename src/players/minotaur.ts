import { Ray, RaycastResult, vec2, World } from "p2";
import Vec from "../vector";
import Player from "./player";
import hornsImgUrl from "/horns.png";
import Runner from "./runner";
import { loadImage } from "../utils";

export default class Minotaur extends Player {
    damage = 40;
    leapDist = 16;
    isLeapRun = false;
    leapDir = new Vec();
    leapRunSpeed: number;

    private leapTime = 0;
    private startLeapTime = 0;
    private hornsSprite?: HTMLImageElement;

    // промінь для перевірки стін перед мінотавром під час ривка
    private raycastResult = new RaycastResult();
    private ray = new Ray({
        from: [0, 0],
        to: [0, 0],
        mode: Ray.CLOSEST,
        collisionGroup: 0x0008
    });

    constructor() {
        super();
        this.radius = 7;
        this.mass = 15;
        this.leapRunSpeed = this.speed * 2.5;
        this.bodyColor = 'rgba(143, 50, 0, 1)';
        this.bodyBorderColor = '#642300ff';

        loadImage(hornsImgUrl)
            .then(s => this.hornsSprite = s);
    }

    init(world: World) {
        super.init(world);

        world.on("beginContact", (evt: any) => {
            const { bodyA, bodyB } = evt;

            if (bodyA.userData instanceof Minotaur && bodyB.userData instanceof Runner)
                this.collisionWithRunner(bodyB.userData as Runner);
            if (bodyB.userData instanceof Minotaur && bodyA.userData instanceof Runner)
                this.collisionWithRunner(bodyA.userData as Runner);
        });
    }

    collisionWithRunner(runner: Runner) {
        if (!runner.canGetDamage()) return;

        // якщо майже не рухається → урону нема
        if (this.moveDir.length() < 0.1) return;

        // відносна швидкість зіткнення
        const relVel = Vec.fromArray(runner.body.velocity)
            .sub(Vec.fromArray(this.body.velocity));
        const impactSpeed = relVel.length();

        if (impactSpeed < 2) return;

        // урон масштабований від швидкості
        const finalDamage = this.damage * (impactSpeed / this.leapRunSpeed);
        runner.getDamage(finalDamage);
    }


    leapForward() {
        if (this.isLeapRun) return;
        this.isLeapRun = true;
        this.startLeapTime = performance.now();
        this.leapTime = (this.leapDist / this.leapRunSpeed) * 1000;
        this.leapDir.setXY(
            Math.cos(this.body.angle),
            Math.sin(this.body.angle)
        )
    }

    move(dir: Vec) {
        if (!this.isLeapRun) super.move(dir);
    }

    leapUpdate() {
        if (!this.isLeapRun) return;
        if (performance.now() - this.startLeapTime > this.leapTime) {
            this.isLeapRun = false;
            return;
        }

        const rayDist = 10;
        const rayEnd: [number, number] = [
            this.body.position[0] + Math.cos(this.body.angle) * rayDist,
            this.body.position[1] + Math.sin(this.body.angle) * rayDist
        ]

        vec2.copy(this.ray.from, this.body.position);
        vec2.copy(this.ray.to, rayEnd);
        this.ray.update();
        this.raycastResult.reset();
        this.body.world.raycast(this.raycastResult, this.ray);

        if (this.raycastResult.hasHit()) {
            this.isLeapRun = false;
            return;
        }

        super.move(this.leapDir, this.leapRunSpeed);
    }

    update(_dt: number): void {
        this.leapUpdate();
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (!this.sprite) return;

        const [x, y] = this.body.position;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.body.angle);
        ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);

        if (this.hornsSprite) {
            ctx.save();
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(this.hornsSprite, -this.hornsSprite.width / 2, -this.hornsSprite.height / 2);
            ctx.restore();
        }
        ctx.restore();
    }
}