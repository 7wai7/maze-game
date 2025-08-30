export default class RenderSystem {
    callBacks: { cb: (ctx: CanvasRenderingContext2D) => void, zIndex: number, isOnce?: boolean }[] = [];
    isModified: boolean = false;

    add(cb: (ctx: CanvasRenderingContext2D) => void, zIndex: number, isOnce = false) {
        this.callBacks.push({ cb, zIndex, isOnce });
        this.isModified = true;
    }

    remove(cb: (ctx: CanvasRenderingContext2D) => void) {
        this.callBacks = this.callBacks.filter(item => item.cb !== cb);
    }

    render(ctx: CanvasRenderingContext2D) {
        if (this.isModified) {
            this.callBacks.sort((a, b) => a.zIndex - b.zIndex);
            this.isModified = false;
        }
        
        this.callBacks.forEach((item) => {
            item.cb(ctx);
            if (item.isOnce) this.isModified = true;
        });

        if (this.isModified) {
            this.callBacks = this.callBacks.filter(({ isOnce }) => !isOnce);
            this.isModified = false;
        }
    }
}