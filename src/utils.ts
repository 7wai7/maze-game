
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

export function prettifyVariableName(name: string) {
    const result = name.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

export function findAndUpdateNested(obj: Record<string, any>, findKey: string, cb?: (value: any) => any): any | undefined {
    for (const [key, value] of Object.entries(obj)) {
        if (key === findKey) {
            if (cb) {
                obj[key] = cb(value);
                return obj[key];
            }
            else return value;
        } else if (typeof value === 'object' && value !== null) {
            const result = findAndUpdateNested(value, findKey, cb);
            if (result !== undefined) return result; // <- важливо пробросити результат нагору
        }
    }
    return undefined;
}