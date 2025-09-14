import Core from "../core";

export default interface Renderable {
    isDestroyed?: boolean;
    zIndex: number;
    render(ctx: CanvasRenderingContext2D): void;
    destroy?(): void;
}

export function registerRenderable(obj: Renderable) {
    Core.renderer.addRenderable(obj);
}