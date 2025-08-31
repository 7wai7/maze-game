export default class Vec {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static fromObj(obj: { x: number, y: number }) {
        return new Vec(obj.x, obj.y);
    }

    static fromArray(a: [number, number]): Vec {
        return new Vec(a[0], a[1]);
    }

    toArray(): [number, number] {
        return [this.x, this.y];
    }

    setXY(x: number, y: number) {
        this.x = x;
        this.y = y;
        return this;
    }

    setVec(v: Vec) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }


    addLocal(v: Vec) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }


    subLocal(v: Vec) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mulLocal(v: Vec) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }

    divLocal(v: Vec) {
        this.x = v.x !== 0 ? this.x / v.x : 0;
        this.y = v.y !== 0 ? this.y / v.y : 0;
        return this;
    }

    scaleLocal(value: number) {
        this.x *= value;
        this.y *= value;
        return this;
    }

    normalizeLocal() {
        const l = this.length();
        if (l === 0) return this;

        this.x /= l;
        this.y /= l;
        return this;
    }



    add(v: Vec) {
        return new Vec(
            this.x + v.x,
            this.y + v.y
        );
    }

    sub(v: Vec) {
        return new Vec(
            this.x - v.x,
            this.y - v.y
        );
    }

    mul(v: Vec) {
        return new Vec(
            this.x * v.x,
            this.y * v.y
        );
    }

    div(v: Vec) {
        return new Vec(
            v.x !== 0 ? this.x / v.x : 0,
            v.y !== 0 ? this.y / v.y : 0
        );
    }

    scale(value: number) {
        return new Vec(
            this.x * value,
            this.y * value
        );
    }

    normalize() {
        const l = this.length();
        if (l === 0) return this;

        return new Vec(
            this.x / l,
            this.y / l
        );
    }



    length() {
        return Math.sqrt(this.lengthSquared());
    }

    lengthSquared() {
        return this.x * this.x + this.y * this.y;
    }
    
    dot(v: Vec) {
        return this.x * v.x + this.y * v.y;
    }

    copy() {
        return new Vec(this.x, this.y);
    }


    static cross(v: Vec, w: Vec) {
        return v.x * w.y - v.y * w.x;
    }

    static intersect(p1: Vec, p2: Vec, p3: Vec, p4: Vec) {
        const d1 = new Vec(p2.x - p1.x, p2.y - p1.y);
        const d2 = new Vec(p4.x - p3.x, p4.y - p3.y);
        const d3 = new Vec(p3.x - p1.x, p3.y - p1.y);

        const denom = this.cross(d1, d2);
        if (denom === 0) return false; // паралельні

        const t = this.cross(d3, d2) / denom;
        const u = this.cross(d3, d1) / denom;

        return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
    }

    static distance(v1: Vec, v2: Vec): number {
        return Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);
    }
}