import { World } from "p2";
import Maze from "./maze";
import Player from "./player";
import Vec from "./vector";
import type InputManager from "./inputManager";

export default class Game {
    input: InputManager;
    world: World;
    maze: Maze;
    players: Player[] = [];
    index: number;
    currentPlayer: Player;

    constructor(input: InputManager) {
        this.input = input;
        this.world = new World({
            gravity: [0, 0]
        });

        this.maze = new Maze(35, 35);
        this.maze.generate();
        this.maze.generateColliders(this.world);

        for (let i = 0; i < 7; i++) {
            this.createPlayer();
        }


        this.index = 0;
        this.currentPlayer = this.players[this.index];
    }

    createPlayer() {
        const player = new Player();
        player.body.position = this.randomMazePosition().toArray();
        this.world.addBody(player.body);
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
            this.index = Math.abs((this.index - 1) % this.players.length);
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

        for (const p of this.players) p.update(dt);
        this.world.step(this.fixedTimeStep, dt * 1000, this.maxSubSteps);
    }
}