import { Ray, RaycastResult, vec2 } from "p2";
import Behaviour from "../baseBehaviour";
import Core from "../core";
import Vec from "../vector";
import Runner from "./runner";
import type Minotaur from "./minotaur";
import Timer from "../timer";
import RenderCallback from "../renderable/renderCallback";

export default class AI extends Behaviour {
    minotaur: Minotaur;

    private lastMazePosition = new Vec();
    private mazeMovingDir = new Vec();
    private mazePath?: { x: number; y: number; }[] | null;

    private closestRunner?: Runner;
    private lostRunner?: Runner;
    private findClosestPlayerTimer = new Timer(500);

    private maxRayDist = 500;
    private raycastResult = new RaycastResult();
    private ray = new Ray({
        from: [0, 0],
        to: [0, 0],
        mode: Ray.CLOSEST,
        collisionGroup: 0x0008
    });

    constructor(minotaur: Minotaur) {
        super();
        this.minotaur = minotaur;
        Core.emitter.on('player-was-killed', () => {
            this.createMazePath();
        })

        new RenderCallback(
            (ctx) => {
                if (!Core.debugTools.useTools || !Core.debugTools.render.aiWay) return;
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

    createMazePath(target?: Vec | null) {
        const start = Core.game.maze.worldToMaze(this.minotaur.body.position);
        const newTarget = target ? target : Vec.fromObj(this.game.maze.openedPlates[Math.floor(Math.random() * this.game.maze.openedPlates.length)]);
        this.mazePath = Core.game.maze.solveMazeBFS(start, newTarget)?.reverse();
    }

    createMazePathToNextWaypoint() {
        const mazePosition = Core.game.maze.worldToMaze(this.minotaur.body.position);
        const newTarget = Core.game.maze.findNextWaypoint(mazePosition, this.mazeMovingDir);
        this.createMazePath(newTarget);
    }


    update() {
        if (this.findClosestPlayerTimer.isElapsed()) {
            this.findClosestPlayerTimer.reset();
            this.findRunner();
        }

        this.walkAlongMazePath();
        this.attackRunner();

        const mazePosition = Core.game.maze.worldToMaze(this.minotaur.body.position);
        if (!mazePosition.verify(this.lastMazePosition)) {
            this.mazeMovingDir = mazePosition.sub(this.lastMazePosition);
            this.lastMazePosition.setVec(mazePosition);
        }
    }

    private walkAlongMazePath() {
        if (this.closestRunner && !this.closestRunner.isDead) return;

        if (this.mazePath && this.mazePath.length > 0) {
            const currentMazePos = Core.game.maze.worldToMaze(this.minotaur.body.position);
            const firstPos = this.mazePath.at(-1);
            if (firstPos && firstPos.x === currentMazePos.x && firstPos.y === currentMazePos.y) {
                if (this.mazePath.length === 1 && this.lostRunner && !this.lostRunner.isDead) { // якщо дойшов до цілі
                    this.createMazePathToNextWaypoint();
                } else
                    this.mazePath.pop();
            }
        } else this.createMazePath();

        if (this.mazePath) {
            const firstPos = this.mazePath.at(-1);
            if (firstPos) {
                const toWorld = Core.game.maze.mazeToWorld(firstPos);
                const dir = toWorld.sub(Vec.fromArray(this.minotaur.body.position)).normalizeLocal();
                this.minotaur.move(dir);
            }
        }
    }

    private attackRunner() {
        if (!this.closestRunner || this.closestRunner.isDead) return;

        const dir = Vec.fromArray(this.closestRunner.body.position).sub(Vec.fromArray(this.minotaur.body.position)).normalizeLocal();
        this.minotaur.move(dir);
        this.minotaur.attack();
        this.minotaur.dash();
    }

    private findRunner() {
        let closestDistSquared = this.maxRayDist * this.maxRayDist;
        let runner: Runner | undefined;

        for (const p of Core.game.players) {
            if (p === this.minotaur || !(p instanceof Runner) || (p instanceof Runner && p.isDead)) continue;

            const distSquare = Vec.distanceSquared(Vec.fromArray(p.body.position), Vec.fromArray(this.minotaur.body.position))
            if (distSquare > closestDistSquared) continue;

            vec2.copy(this.ray.from, this.minotaur.body.position);
            vec2.copy(this.ray.to, p.body.position);
            this.ray.update();
            this.raycastResult.reset();
            Core.game.world.raycast(this.raycastResult, this.ray);

            // якщо зіткнення нема, значить промінь дойшов до ігрока
            // промінь може зіткнутись лише із стінами
            if (!this.raycastResult.hasHit()) {
                closestDistSquared = distSquare;
                runner = p as Runner;
            }
        }

        if (this.closestRunner && !this.closestRunner.isDead && !runner) { // загубили ігрока
            this.createMazePathToNextWaypoint();

            this.lostRunner = this.closestRunner;
            setTimeout(() => {
                if (!this.lostRunner || this.lostRunner.isDead) return;

                const newTarget = Core.game.maze.worldToMaze(this.lostRunner.body.position);
                this.createMazePath(newTarget);
            }, 2000);
        }

        this.closestRunner = runner;
    }
}