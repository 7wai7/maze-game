import { Body, Circle, World } from "p2";
import Vec from "../vector";
import { clamp } from "../utils";
import Behaviour from "../baseBehaviour";
import Core from "../core";
import MiniMap from "./miniMap";
import Timer from "../timer";
import Sprite from "../renderable/sprite";
import { PLAYER_GROUP, PLAYER_INDEX, PLAYER_MASK, WALL_GROUP } from "../constants";

export default abstract class Player extends Behaviour {
    body!: Body;
    speed = 4;
    isRun = false;
    radius = 5;
    mass = 1;
    miniMap = new MiniMap(this);

    maxHp = 100;
    hp = this.maxHp;
    isDead = false;
    damageTimer = new Timer(1000);
    invulnerabilityTimer = new Timer(1000);
    damageReductionSpeed = 15;
    damageReductionCurrentValue = this.maxHp;

    maxEndurance = 100;
    endurance = this.maxEndurance;
    enduranceReductionSpeed = 40;
    enduranceRecoverySpeed = 20;

    protected bodyColor = '#ffe5aeff';
    protected bodyBorderColor = '#92815bff';
    protected sprite!: Sprite;
    protected collisionGroup = PLAYER_GROUP
    protected collisionMask = PLAYER_MASK

    protected moveDir = new Vec();
    protected runSpeed: number;

    constructor() {
        super();
        this.runSpeed = this.speed * 2;
    }

    init(world: World) {
        this.body = new Body({
            mass: this.mass,
            damping: .99,
            angularDamping: .3
        });

        this.body.addShape(new Circle({
            radius: this.radius,
            collisionGroup: this.collisionGroup,
            collisionMask: this.collisionMask
        }));

        world.addBody(this.body);
        (this.body as any).classData = this;

        Core.emitter.on('debug-collisions', () => {
            this.toggleCollisions();
        })
        Core.emitter.on('debug-useTools', () => {
            this.toggleCollisions();
        })
        this.toggleCollisions();

        this.sprite = Sprite.createByContext(this.renderSprite.bind(this), { width: 30, height: 30, zIndex: PLAYER_INDEX })
    }

    canGetDamage() {
        return !this.isDead && this.invulnerabilityTimer.isElapsed();
    }

    getDamage(damage: number) {
        if (!this.canGetDamage() || damage <= 0) return;

        this.invulnerabilityTimer.reset();
        this.damageTimer.reset();
        const incurredDamage = Math.min(damage, this.hp);
        this.hp -= incurredDamage;
        Core.emitter.emit('player-damaged', this, incurredDamage);

        if (this.hp <= 0) {
            this.isDead = true;
            Core.emitter.emit('player-was-killed', this);
        }
    }

    move(dir: Vec, speed?: number) {
        if (this.isDead) return;
        this.moveDir.setVec(dir);
        if (dir.x === 0 && dir.y === 0) return;

        const useTools = Core.debugTools.useTools && Core.debugTools.game.fastSpeed;
        const moveSpeed = speed ?? (this.isRun && this.endurance !== 0 ? (useTools ? this.speed * 5 : this.runSpeed) : this.speed);
        this.body.velocity = dir.scale(moveSpeed).toArray();
        this.body.angle = Math.atan2(dir.y, dir.x);
    }

    update(dt: number): void {
        this.updateEndurance(dt);
        this.damageReductionCurrentValue = Math.max(this.damageReductionCurrentValue - dt * this.damageReductionSpeed, this.hp);
    }

    protected updateEndurance(dt: number) {
        const useTools = Core.debugTools.useTools && Core.debugTools.game.fastSpeed;
        if (this.isDead || this.isRun && !useTools && (this.moveDir.x !== 0 || this.moveDir.y !== 0)) this.endurance -= dt * this.enduranceReductionSpeed;
        else this.endurance += dt * this.enduranceRecoverySpeed;
        this.endurance = clamp(this.endurance, 0, this.maxEndurance);
    }


    toggleCollisions() {
        const value = !Core.debugTools.useTools || Core.debugTools.game.collisions;
        for (const shape of this.body.shapes) {
            if (value) {
                shape.collisionMask = this.collisionMask;
            } else {
                shape.collisionMask = this.collisionMask & ~WALL_GROUP;
            }
        }
    }




    private renderSprite(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.rotate(this.body.angle + Math.PI / 2);

        // Малювання лівої руки
        this.renderHand(ctx, true);

        // Малювання правої руки
        this.renderHand(ctx);

        // Малювання персонажа
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2); // Основне коло (тіло)
        ctx.fillStyle = this.bodyColor; // Колір тіла
        ctx.fill();
        ctx.strokeStyle = this.bodyBorderColor; // Темніший край
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }

    private renderHand(ctx: CanvasRenderingContext2D, isLeft = false) {
        const offset = this.radius;

        ctx.beginPath();
        ctx.arc(isLeft ? -offset : offset, -this.radius / 3, this.radius / 2, 0, Math.PI * 2); // Основне коло 
        ctx.fillStyle = this.bodyColor; // Колір тіла
        ctx.fill();
        ctx.strokeStyle = this.bodyBorderColor; // Темніший край
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    }
}