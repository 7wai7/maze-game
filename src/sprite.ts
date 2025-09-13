import { loadImage } from "./utils";

export default class Sprite {
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
    flipX = false;
    flipY = false;
    flipAngle = false;
    visible = true;

    private isLoaded = false;
    private childrenBehind: Sprite[] = [];
    private childrenFront: Sprite[] = [];

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

    render(ctx: CanvasRenderingContext2D) {
        if (!this.img || !this.isLoaded || !this.visible) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.flipAngle ? Math.PI - this.angle : this.angle);

        if (this.flipX || this.flipY) {
            ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
        }

        ctx.globalAlpha = this.alpha;
        ctx.filter = this.filter;

        for (const s of this.childrenBehind) {
            s.render(ctx);
        }

        ctx.drawImage(
            this.img,
            -this.width * this.anchorX,
            -this.height * this.anchorY,
            this.width,
            this.height
        );

        for (const s of this.childrenFront) {
            s.render(ctx);
        }

        ctx.restore();
    }

    addChild(child: Sprite, isFront = true) {
        isFront ? this.childrenFront.push(child) : this.childrenBehind.push(child);
    }

    removeChild(child: Sprite) {
        this.childrenBehind = this.childrenBehind.filter((f) => f === child);
        this.childrenFront = this.childrenFront.filter((f) => f === child);
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
        this.flipX = options.flipX ?? this.flipX;
        this.flipY = options.flipY ?? this.flipY;
        this.flipAngle = options.flipAngle ?? this.flipAngle;
        this.visible = options.visible ?? this.visible;
    }
}
