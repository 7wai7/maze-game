
export function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(value, max));
}


export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}