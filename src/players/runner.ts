import type { World } from "p2";
import ParticleSystem from "../particleSystem";
import Sprite from "../sprite";
import type { InventoryItem } from "../types/InventoryItem";
import { clamp } from "../utils";
import Vec from "../vector";
import Player from "./player";
import swordUrl from "/inventory_items/Sword.png";
import Core from "../core";
import Item from "../items/item";

export default class Runner extends Player {
    inventory = new Set<InventoryItem>;
    torchAttenuation = 0;
    torchAttenuationFactor = 0;

    private torchAttenuationSpeed = 5;
    private torch = new ParticleSystem({ zIndex: 30 });
    private torchOffset = new Vec(9, 5);
    private torchSprite!: Sprite;
    private swordSprite!: Sprite;

    init(world: World): void {
        super.init(world);

        this.torchSprite = Sprite.createByContext(
            this.renderTorch.bind(this),
            {
                x: this.torchOffset.x,
                y: this.torchOffset.y,
                width: 2,
                height: 9,
                angle: -100 * Vec.DEGTORAD,
                anchorY: 1,
                zIndex: 9
            }
        );
        this.sprite.addChild(this.torchSprite);

        this.swordSprite = Sprite.createByUrl(swordUrl,
            {
                x: 2,
                y: 5,
                angle: 10 * Vec.DEGTORAD,
                anchorX: .12,
                anchorY: .81,
                visible: false,
                zIndex: 9
            }
        )
        this.sprite.addChild(this.swordSprite);

        this.getItem("Sword");
        this.initCollisions();
        this.sprite.prePender = this.preRenderSprite.bind(this);
    }

    getItem(item: InventoryItem) {
        if(this.inventory.has(item)) return;

        this.inventory.add(item);
        this.swordSprite.visible = this.inventory.has("Sword");
        Core.emitter.emit('inventory-get-item', this);
    }

    removeItem(item: InventoryItem) {
        if(!this.inventory.has(item)) return;
        
        this.inventory.delete(item);
        this.swordSprite.visible = this.inventory.has("Sword");
        Core.emitter.emit('inventory-remove-item', this);
    }

    update(dt: number) {
        super.update(dt);
        this.updateTorch(dt);
    }

    private updateTorch(dt: number) {
        if (this.isDead && this.torchAttenuationFactor < 1) {
            this.torchAttenuation = clamp(this.torchAttenuation + dt, 0, this.torchAttenuationSpeed);
            this.torchAttenuationFactor = this.torchAttenuation / this.torchAttenuationSpeed;
            this.torch.frequency = Math.max(this.torch.frequency - dt * 10, 0);
        }

        const offset = this.torchOffset.copy();
        if (this.inventory.has("Sword")) offset.y *= -1;
        const p = offset.setAngle(offset.getAngle() + this.body.angle);
        this.torch.origin.setArray(this.body.position).addLocal(p);
    }

    private collisionWithItem(item: Item) {
        Core.emitter.emit('start-trigger-item', item, this);
    }

    private endCollisionWithItem(item: Item) {
        Core.emitter.emit('end-trigger-item', item, this);
    }

    private initCollisions() {
        Core.game.world.on("beginContact", (evt: any) => {
            const { bodyA, bodyB } = evt;

            if (bodyA.classData instanceof Runner && bodyB.classData instanceof Item)
                this.collisionWithItem(bodyB.classData as Item);
            if (bodyB.classData instanceof Runner && bodyA.classData instanceof Item)
                this.collisionWithItem(bodyA.classData as Item);
        });

        Core.game.world.on("endContact", (evt: any) => {
            const { bodyA, bodyB } = evt;

            if (bodyA.classData instanceof Runner && bodyB.classData instanceof Item)
                this.endCollisionWithItem(bodyB.classData as Item);
            if (bodyB.classData instanceof Runner && bodyA.classData instanceof Item)
                this.endCollisionWithItem(bodyA.classData as Item);
        });
    }

    preRenderSprite() {
        if (!this.sprite) return;

        const [x, y] = this.body.position;
        this.sprite.x = x;
        this.sprite.y = y;
        this.sprite.angle = this.body.angle;
        if (this.isDead) this.sprite.filter = "grayscale(100%)"; // робить зображення сірим

        if (this.inventory.has("Sword")) {
            this.torchSprite.y = -this.torchOffset.y;
            this.torchSprite.flipAngle = true;
        }
    }

    private renderTorch(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'rgba(57, 33, 0, 1)'
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}