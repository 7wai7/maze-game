import { World } from "p2";
import Maze from "./maze";
import Player from "./players/player";
import Vec from "./vector";
import Minotaur from "./players/minotaur";
import Runner from "./players/runner";
import Core from "./core";
import AI from "./players/ai";

export default class Game {
    world: World;
    maze: Maze;
    players: Player[] = [];
    minotaurAI?: AI;
    index!: number;
    currentPlayer!: Player;
    worldWidth: number;
    worldHeight: number;

    constructor() {
        this.world = new World({
            gravity: [0, 0]
        });

        this.maze = new Maze(35, 35);
        this.maze.generate();
        this.maze.generateColliders(this.world);
        this.worldWidth = this.maze.cols * this.maze.mazeScale;
        this.worldHeight = this.maze.rows * this.maze.mazeScale;
    }

    init() {

        for (let i = 0; i < 7; i++) {
            this.createPlayer();
        }
        this.createPlayer(true);


        this.index = 0;
        this.currentPlayer = this.players[this.index];
    }

    createPlayer(isMinotaur = false) {
        const player = isMinotaur ? new Minotaur() : new Runner();
        player.init(this.world);
        player.body.position = this.randomMazePosition().toArray();

        if (isMinotaur) this.minotaurAI = new AI(player);
        this.players.push(player);
        return player;
    }

    randomMazePosition() {
        const randomPosition = this.maze.openedPlates[Math.floor(Math.random() * this.maze.openedPlates.length)];
        return this.maze.mazeToWorld(randomPosition);
    }

    controlCurrentPlayer() {
        const dirMove = new Vec(
            Core.inputManager.pressed.has('a') ? -1 : Core.inputManager.pressed.has('d') ? 1 : 0,
            Core.inputManager.pressed.has('w') ? -1 : Core.inputManager.pressed.has('s') ? 1 : 0
        ).normalizeLocal();

        this.currentPlayer.isRun = Core.inputManager.pressed.has('shift');
        this.currentPlayer.move(dirMove);

        if (this.currentPlayer instanceof Minotaur) {
            if (Core.inputManager.clicked.has(' ')) {
                this.currentPlayer.leapForward();
            }
        }
    }

    private fixedTimeStep = 1 / 60; // 60 FPS
    private maxSubSteps = 10;
    update(dt: number) {
        if (Core.inputManager.clicked.has('q')) {
            this.index = (this.index - 1 + this.players.length) % this.players.length;
            this.currentPlayer = this.players[this.index];
        }
        if (Core.inputManager.clicked.has('e')) {
            this.index = (this.index + 1) % this.players.length;
            this.currentPlayer = this.players[this.index];
        }

        if (this.currentPlayer != this.minotaurAI?.player) this.controlCurrentPlayer();

        for (const obj of Core.gameObjects) obj.update?.(dt);
        this.world.step(this.fixedTimeStep, dt * 1000, this.maxSubSteps);
    }

    postUpdate(dt: number) {
        for (const obj of Core.gameObjects) obj.postUpdate?.(dt);
    }
}