import { Body, Box } from "p2";
import Core from "../core";
import Vec from "../vector";
import { ITEM_GROUP, ITEM_INDEX, ITEM_MASK } from "../constants";
import Sprite from "../renderable/sprite";
import type { InventoryItem } from "../types/InventoryItem";

export default class Item {
    item: InventoryItem;
    sprite: Sprite;
    body: Body;
    mazePosition: Vec;
    worldPosition: Vec;

    constructor(mazePosition: Vec, item: InventoryItem) {
        this.item = item;
        this.mazePosition = mazePosition;
        this.worldPosition = Core.game.maze.mazeToWorld(mazePosition);

        this.body = new Body({
            position: this.worldPosition.toArray(),
            mass: 0
        });

        this.body.addShape(new Box({
            width: Core.game.maze.mazeScale,
            height: Core.game.maze.mazeScale,
            sensor: true,
            collisionGroup: ITEM_GROUP,
            collisionMask: ITEM_MASK
        }));

        Core.game.world.addBody(this.body);
        (this.body as any).classData = this;

        this.sprite = Sprite.createByUrl(
            `/inventory_items/${item}.png`,
            {
                width: 10,
                height: 10,
                x: this.worldPosition.x,
                y: this.worldPosition.y,
                zIndex: ITEM_INDEX
            }
        )
    }

    destroy() {
        this.sprite.destroy();
        this.body.world.removeBody(this.body);
    }
}