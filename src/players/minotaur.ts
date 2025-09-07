import { AABB, Box, Ray, RaycastResult, vec2, World } from "p2";
import Vec from "../vector";
import Player from "./player";
import hornsImgUrl from "/horns.png";
import Runner from "./runner";
import { loadImage } from "../utils";
import Timer from "../timer";
import Core from "../core";

export default class Minotaur extends Player {
    damage = 10;
    dashDamage = 30;
    dashDist = 16;
    isDashRun = false;

    private dashDir = new Vec();
    private dashRunSpeed: number;

    private attachCooldownTimer = new Timer(500);
    private dashCooldownTimer = new Timer(2000);
    private dashTimer = new Timer(0);

    private attackShape: Box;
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
        this.dashRunSpeed = this.speed * 2.5;
        this.bodyColor = 'rgba(143, 50, 0, 1)';
        this.bodyBorderColor = '#642300ff';
        
        this.attackShape = new Box({
            width: this.radius / 2,
            height: this.radius * 2
        });

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
        if (!this.isDashRun) return;
        if (!runner.canGetDamage()) return;
        runner.getDamage(this.dashDamage);

        // якщо майже не рухається → урону нема
        // if (this.moveDir.length() < 0.1) return;

        // // відносна швидкість зіткнення
        // const relVel = Vec.fromArray(runner.body.velocity)
        //     .sub(Vec.fromArray(this.body.velocity));
        // const impactSpeed = relVel.length();
        // if (impactSpeed < 2) return;

        // // урон масштабований від швидкості
        // const finalDamage = Math.floor(this.dashDamage * (impactSpeed / this.dashRunSpeed));
        // runner.getDamage(finalDamage);
    }


    attack() {
        if(!this.attachCooldownTimer.isElapsed()) return;
        this.attachCooldownTimer.reset();
        
        const offset = new Vec(this.radius * 2, 0);
        offset.setAngle(this.body.angle);
        const p: [number, number] = [this.body.position[0] + offset.x, this.body.position[1] + offset.y];
        const angle = this.body.angle;

        const attackAABB = new AABB();
        this.attackShape.computeAABB(attackAABB, p, angle);

        for (const player of Core.game.players) {
            if (!(player instanceof Runner) || player.isDead) continue;

            for (const shape of player.body.shapes) {
                const playerAABB = new AABB();
                shape.computeAABB(playerAABB, player.body.position, player.body.angle);
                if (attackAABB.overlaps(playerAABB)) {
                    player.getDamage(this.damage);
                    return;
                }
            }
        }
    }

    dash() {
        if (this.isDashRun) return;
        if (!this.dashCooldownTimer.isElapsed()) return;

        this.isDashRun = true;
        this.dashTimer.duration = (this.dashDist / this.dashRunSpeed) * 1000;
        this.dashTimer.reset();

        this.dashDir.setXY(
            Math.cos(this.body.angle),
            Math.sin(this.body.angle)
        )
    }

    move(dir: Vec) {
        if (!this.isDashRun) super.move(dir);
    }

    update(dt: number): void {
        super.update(dt);
        this.dashUpdate();
    }

    private dashUpdate() {
        if (!this.isDashRun) return;
        if (this.dashTimer.isElapsed()) {
            this.isDashRun = false;
            this.dashCooldownTimer.reset();
            return;
        }

        const rayDist = this.radius * 1.5;
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
            this.isDashRun = false;
            this.dashCooldownTimer.reset();
            return;
        }

        super.move(this.dashDir, this.dashRunSpeed);
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