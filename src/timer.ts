import { clamp01 } from "./utils";

export default class Timer {
    duration: number;
    private lastUpdatedTime = 0;
    
    constructor(duration: number) {
        this.duration = duration;
    }

    isElapsed() {
        return this.elapsed() > this.duration;
    }

    elapsed() {
        return performance.now() - this.lastUpdatedTime;
    }

    elapsed01() {
        return clamp01(this.elapsed() / this.duration);
    }

    reset() {
        this.lastUpdatedTime = performance.now();
    }
}