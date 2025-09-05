import Behaviour from "../baseBehaviour";
import Core from "../core";
import Vec from "../vector";
import type Player from "./player";

export default class AI extends Behaviour {
    player: Player;

    private target = new Vec();
    private mazePath?: { x: number; y: number; }[] | null;

    constructor(player: Player) {
        super();
        this.player = player;

        Core.renderer.renderSystem.add(
            (ctx) => {
                if(!Core.debugTools.useTools || !Core.debugTools.render.aiWay) return;
                if (!this.mazePath || this.mazePath.length === 0) return;

                const scale = Core.game.maze.mazeScale;
                ctx.save();
                ctx.translate(scale / 2, scale / 2);
                ctx.scale(scale, scale);

                ctx.strokeStyle = "green";
                ctx.lineWidth = .2;
                ctx.beginPath();
                const { x: x0, y: y0 } = this.mazePath[0];
                ctx.moveTo(x0, y0);
                for (let i = 1; i < this.mazePath.length; i++) {
                    const { x, y } = this.mazePath[i];
                    ctx.lineTo(x, y);
                }
                ctx.stroke();

                ctx.beginPath();
                ctx.fillStyle = "red";
                ctx.ellipse(x0, y0, .1, .1, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();

                ctx.restore();
            },
            3
        )
    }

    setTarget(target: Vec) {
        this.target.setVec(target);
    }

    createMazePath() {
        const start = Core.game.maze.worldToMaze(this.player.body.position);
        this.target = Vec.fromObj(this.game.maze.openedPlates[Math.floor(Math.random() * this.game.maze.openedPlates.length)]);
        this.mazePath = Core.game.maze.solveMazeBFS(start, this.target)?.reverse(); // 
    }


    update() {
        if (this.mazePath && this.mazePath.length > 0) {
            const currentMazePos = Core.game.maze.worldToMaze(this.player.body.position);
            const firstPos = this.mazePath.at(-1);
            if (firstPos && firstPos.x === currentMazePos.x && firstPos.y === currentMazePos.y) this.mazePath.pop();
        } else this.createMazePath();


        if(this.mazePath) {
            const firstPos = this.mazePath.at(-1);
            if(firstPos) {
                const toWorld = Core.game.maze.mazeToWorld(firstPos);
                const dir = toWorld.sub(Vec.fromArray(this.player.body.position)).normalizeLocal();
                this.player.move(dir);
            }
        }
    }
}