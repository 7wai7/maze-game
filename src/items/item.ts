import { Body, Box } from "p2";
import Core from "../core";
import Vec from "../vector";
import { ITEM_GROUP, ITEM_MASK } from "../constants";
import Sprite from "../sprite";

export default class Item {
    sprite: Sprite;
    body: Body;
    mazePosition: Vec;
    worldPosition: Vec;

    constructor(mazePosition: Vec) {
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

        this.sprite = Sprite.createByContext(
            (ctx) => {
                ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2); // Основне коло (тіло)
                ctx.fillStyle = "red"; // Колір тіла
                ctx.fill();
                ctx.closePath();
            },
            {
                width: 20,
                height: 20,
                x: this.worldPosition.x,
                y: this.worldPosition.y,
                zIndex: 30
            }
        )
    }
}