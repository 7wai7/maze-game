import { Body, Circle, World } from "p2";
import Vec from "../vector";
import { clamp, loadImage } from "../utils";
import Behaviour from "../baseBehaviour";
import Core from "../core";
import MiniMap from "./miniMap";

export default abstract class Player extends Behaviour {
    body!: Body;
    speed = 4;
    isRun = false;
    radius = 5;
    mass = 1;
    miniMap = new MiniMap(this);

    maxEndurance = 100;
    endurance = this.maxEndurance;
    enduranceReductionSpeed = 40;
    enduranceRecoverySpeed = 20;

    protected bodyColor = '#ffe5aeff';
    protected bodyBorderColor = '#92815bff';
    protected sprite?: HTMLImageElement;
    protected collisionGroup = 0x0002;
    protected collisionMask = 0x0002 | 0x0004;

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
        (this.body as any).userData = this;

        Core.emitter.on('debug-collisions', () => {
            this.toggleCollisions();
        })
        Core.emitter.on('debug-useTools', () => {
            this.toggleCollisions();
        })

        this.getRenderSprite()
            .then(s => this.sprite = s);
    }

    move(dir: Vec, speed?: number) {
        this.moveDir = dir;
        if (dir.x === 0 && dir.y === 0) return;

        const useTools = Core.debugTools.useTools && Core.debugTools.game.fastSpeed;
        const moveSpeed = speed ?? (this.isRun && this.endurance !== 0 ? (useTools ? this.speed * 5 : this.runSpeed) : this.speed);
        this.body.velocity = dir.scale(moveSpeed).toArray();
        this.body.angle = Math.atan2(dir.y, dir.x);
    }

    update(dt: number): void {
        this.updateEndurance(dt);
    }

    protected updateEndurance(dt: number) {
        const useTools = Core.debugTools.useTools && Core.debugTools.game.fastSpeed;
        if (this.isRun && !useTools && (this.moveDir.x !== 0 || this.moveDir.y !== 0)) this.endurance -= dt * this.enduranceReductionSpeed;
        else this.endurance += dt * this.enduranceRecoverySpeed;
        this.endurance = clamp(this.endurance, 0, this.maxEndurance);
    }


    toggleCollisions() {
        const value = !Core.debugTools.useTools || Core.debugTools.game.collisions;
        for (const shape of this.body.shapes) {
            if (value) {
                shape.collisionGroup = this.collisionGroup;
                shape.collisionMask = this.collisionMask;
            } else {
                shape.collisionGroup = 0;
                shape.collisionMask = 0;
            }
        }
    }

    async getRenderSprite() {
        if (this.sprite) return this.sprite;

        const canvas = document.createElement('canvas');
        canvas.width = 30;
        canvas.height = 30;
        const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
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

        this.sprite = await loadImage(canvas.toDataURL("image/png"));
        return this.sprite;
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