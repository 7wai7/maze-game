import Behaviour from "../baseBehaviour";
import Core from "../core";
import Vec from "../vector";
import type Player from "./player";

export default class MiniMap extends Behaviour {
    player: Player;

    mazePosition = new Vec();
    lastMazePosition = new Vec();
    path = new Set<number>(); // key = x << 16 | y
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(player: Player) {
        super();
        this.player = player;
        this.canvas = document.querySelector('.mini-map') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    }

    update(_dt: number): void {
        this.mazePosition = Core.game.maze.worldToMaze(Vec.fromArray(this.player.body.position));

        if (!this.mazePosition.verify(this.lastMazePosition)) {
            this.lastMazePosition.setVec(this.mazePosition);
            // Упакувати координати у одне число
            const key = (this.mazePosition.x << 16) | (this.mazePosition.y & 0xffff);
            this.path.add(key);
            this.render();
        }
    }

    render(): void {
        if (Core.game.currentPlayer !== this.player) return;

        const maze = Core.game.maze;
        const cellW = this.canvas.width / maze.cols;
        const cellH = this.canvas.height / maze.rows;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (const key of this.path) {
            const x = key >> 16;
            const y = key & 0xffff;
            this.ctx.fillStyle = (x === this.mazePosition.x && y === this.mazePosition.y) ? 'white' : 'rgba(200, 170, 0, 1)';
            this.ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
        }
    }

}