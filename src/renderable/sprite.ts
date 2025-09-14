import Core from "../core";
import type Renderable from "./renderable";
import { loadImage } from "../utils";

export default class Sprite implements Renderable {
    img?: HTMLImageElement;
    width = 0;
    height = 0;
    x = 0;
    y = 0;
    angle = 0;
    alpha = 1;
    filter = "none";
    anchorX = 0.5;
    anchorY = 0.5;
    scaleX = 1;
    scaleY = 1;

    worldX = 0;
    worldY = 0;
    worldAngle = 0;
    worldScaleX = 1;
    worldScaleY = 1;

    flipAngle = false;
    visible = true;
    zIndex = 0;
    isDestroyed = false;

    private isLoaded = false;
    private parent?: Sprite;
    private children: Sprite[] = [];

    constructor(isRoot = false) {
        if (isRoot) return;
        Core.renderer.rootSprite.addChild(this);
        Core.renderer.addRenderable(this);
    }

    static createByUrl(
        url: string,
        options: Partial<Sprite> = {}
    ) {
        const sprite = new Sprite();
        sprite.setOptions(options);
        loadImage(url)
            .then(img => {
                sprite.img = img;
                sprite.width = options.width ?? img.width;
                sprite.height = options.height ?? img.height;
                sprite.isLoaded = true;
            });
        return sprite;
    }

    static createByContext(
        cb: (ctx: CanvasRenderingContext2D) => void,
        options: { width: number; height: number } & Partial<Sprite>
    ) {
        const { width, height } = options;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        cb(ctx);

        try {
            const sprite = new Sprite();
            sprite.setOptions(options);
            loadImage(canvas.toDataURL("image/png"))
                .then(img => {
                    sprite.img = img;
                    sprite.width = options.width ?? img.width;
                    sprite.height = options.height ?? img.height;
                    sprite.isLoaded = true;
                })
            return sprite;
        } finally {
            canvas.remove();
        }
    }

    destroy(): void {
        this.isDestroyed = true;
    }

    prePender() {}

    render(ctx: CanvasRenderingContext2D) {
        this.prePender();
        if (!this.img || !this.isLoaded || !this.visible) return;

        ctx.save();
        ctx.translate(this.worldX, this.worldY);
        ctx.rotate(this.worldAngle);
        ctx.scale(this.worldScaleX, this.worldScaleY);

        ctx.globalAlpha = this.alpha;
        ctx.filter = this.filter;

        ctx.drawImage(
            this.img,
            -this.width * this.anchorX,
            -this.height * this.anchorY,
            this.width,
            this.height
        );

        ctx.restore();
    }

    setParent(parent: Sprite) {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.parent = parent;
        parent.children.push(this);
    }

    addChild(child: Sprite) {
        if (child.parent) {
            child.parent.removeChild(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    removeChild(child: Sprite) {
        this.children = this.children.filter((f) => f !== child);
        if (child.parent === this) {
            child.parent = undefined;
        }
    }

    updateWorldTransform() {
        if (this.parent) {
            // беремо трансформацію батька
            const cos = Math.cos(this.parent.worldAngle);
            const sin = Math.sin(this.parent.worldAngle);

            // застосовуємо обертання + масштаб батька
            const localX = this.x * this.parent.worldScaleX;
            const localY = this.y * this.parent.worldScaleY;

            this.worldX = this.parent.worldX + cos * localX - sin * localY;
            this.worldY = this.parent.worldY + sin * localX + cos * localY;

            // кут та масштаб наслідуються
            this.worldAngle = this.parent.worldAngle + (this.flipAngle ? Math.PI - this.angle : this.angle);
            this.worldScaleX = this.parent.worldScaleX * this.scaleX;
            this.worldScaleY = this.parent.worldScaleY * this.scaleY;
        } else {
            // якщо батька нема → світові = локальні
            this.worldX = this.x;
            this.worldY = this.y;
            this.worldAngle = this.flipAngle ? Math.PI - this.angle : this.angle;
            this.worldScaleX = this.scaleX;
            this.worldScaleY = this.scaleY;
        }

        for (const child of this.children) {
            child.updateWorldTransform();
        }
    }

    setOptions(options: Partial<Sprite> = {}) {
        this.x = options.x ?? this.x;
        this.y = options.y ?? this.y;
        this.width = options.width ?? this.width;
        this.height = options.height ?? this.height;
        this.angle = options.angle ?? this.angle;
        this.anchorX = options.anchorX ?? this.anchorX;
        this.anchorY = options.anchorY ?? this.anchorY;
        this.alpha = options.alpha ?? this.alpha;
        this.filter = options.filter ?? this.filter;
        this.flipAngle = options.flipAngle ?? this.flipAngle;
        this.visible = options.visible ?? this.visible;
        this.zIndex = options.zIndex ?? this.zIndex;
    }
}
