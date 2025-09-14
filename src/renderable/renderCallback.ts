import Core from "../core";
import type Renderable from "./renderable";


export default class RenderCallback implements Renderable {
    cb: (ctx: CanvasRenderingContext2D) => void;
    zIndex: number;

    constructor(cb: (ctx: CanvasRenderingContext2D) => void, zIndex: number) {
        this.cb = cb;
        this.zIndex = zIndex;
        Core.renderer.addRenderable(this);
    }

    render(ctx: CanvasRenderingContext2D): void {
        this.cb(ctx);
    }

}