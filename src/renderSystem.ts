export default class RenderSystem {
    callBacks: { cb: (ctx: CanvasRenderingContext2D) => void, zIndex: number, isOnce: boolean }[] = [];
    isModified: boolean = false;

    add(cb: (ctx: CanvasRenderingContext2D) => void, zIndex: number, isOnce = false) {
        this.callBacks.push({ cb, zIndex, isOnce });
        this.isModified = true;
    }

    remove(cb: (ctx: CanvasRenderingContext2D) => void) {
        const before = this.callBacks.length;
        this.callBacks = this.callBacks.filter(item => item.cb !== cb);
        if (this.callBacks.length !== before) this.isModified = true;
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.isModified) {
            this.callBacks.sort((a, b) => b.zIndex - a.zIndex);
            this.isModified = false;
        }

        for (let i = this.callBacks.length - 1; i >= 0; i--) {
            const item = this.callBacks[i];
            item.cb(ctx);
            if (item.isOnce) {
                this.callBacks.splice(i, 1);
            }
        }
    }
}