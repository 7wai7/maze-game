import { World } from "p2";
import Maze from "./maze";
import Player from "./players/player";
import Vec from "./vector";
import type InputManager from "./inputManager";
import Minotaur from "./players/minotaur";
import Runner from "./players/runner";

export default class Game {
    input: InputManager;
    world: World;
    maze: Maze;
    players: Player[] = [];
    index: number;
    currentPlayer: Player;
    worldWidth: number;
    worldHeight: number;

    constructor(input: InputManager) {
        this.input = input;
        this.world = new World({
            gravity: [0, 0]
        });

        this.maze = new Maze(35, 35);
        this.maze.generate();
        this.maze.generateColliders(this.world);
        this.worldWidth = this.maze.cols * this.maze.mazeScale;
        this.worldHeight = this.maze.rows * this.maze.mazeScale;

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
        this.players.push(player);
        return player;
    }

    randomMazePosition() {
        const randomPosition = this.maze.openedPlates[Math.floor(Math.random() * this.maze.openedPlates.length)];
        return this.maze.positionToWorld(randomPosition);
    }

    fixedTimeStep = 1 / 60; // 60 FPS
    maxSubSteps = 10;
    update(dt: number) {
        if (this.input.clicked.has('q')) {
            this.index = (this.index - 1 + this.players.length) % this.players.length;
            this.currentPlayer = this.players[this.index];
        }
        if (this.input.clicked.has('e')) {
            this.index = (this.index + 1) % this.players.length;
            this.currentPlayer = this.players[this.index];
        }


        const dirMove = new Vec(
            this.input.pressed.has('a') ? -1 : this.input.pressed.has('d') ? 1 : 0,
            this.input.pressed.has('w') ? -1 : this.input.pressed.has('s') ? 1 : 0
        ).normalizeLocal();

        this.currentPlayer.isRun = this.input.pressed.has('shift');
        this.currentPlayer.move(dirMove);

        if (this.currentPlayer instanceof Minotaur) {
            if (this.input.clicked.has(' ')) {
                this.currentPlayer.leapForward();
            }
        }

        for (const p of this.players) p.update(dt);
        this.world.step(this.fixedTimeStep, dt * 1000, this.maxSubSteps);
    }
}