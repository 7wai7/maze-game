export default interface Renderable {
    zIndex: number;
    render(ctx: CanvasRenderingContext2D): void;
}