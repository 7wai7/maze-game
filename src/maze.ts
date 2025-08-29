import type CollisionSystem from "./collisionSystem";
import RectangleCollider from "./rectangleCollider";
import Vec from "./vector";

export default class Maze {
    rows: number;
    cols: number;
    opened: number;
    wall: number;
    maze: number[][];
    openedPlates: { x: number, y: number }[];
    wallPlates: { x: number, y: number }[];
    mazeScale: number;
    img: HTMLImageElement | undefined;

    constructor(rows: number, cols: number) {
        this.rows = rows;
        this.cols = cols;

        this.opened = 0;
        this.wall = 1;
        this.maze = Array.from({ length: this.rows }, () =>
            Array.from({ length: this.cols }, () => this.wall)
        );
        this.openedPlates = [];
        this.wallPlates = [];
        this.mazeScale = 100;
    }

    generate() {
        this.generateMaze();
        this.deleteDeadEnds();
        this.findOpenedAndWallPlates();
        this.saveRenderImage();
    }



    generateMaze() {
        const visited = [];
        const stack: { x: number, y: number }[] = [];

        let x = Math.floor(this.cols / 2);
        let y = Math.floor(this.rows / 2);

        visited.push({ x, y });
        stack.push({ x, y });

        // пробиваємо стартову клітинку
        this.maze[y][x] = this.opened;

        while (stack.length > 0) {
            let current = stack[stack.length - 1];
            let { x, y } = current;

            const possibleDirs = [];
            if (this.canMoveTo(x, y - 2)) possibleDirs.push({ x, y: y - 2 });
            if (this.canMoveTo(x + 2, y)) possibleDirs.push({ x: x + 2, y });
            if (this.canMoveTo(x, y + 2)) possibleDirs.push({ x, y: y + 2 });
            if (this.canMoveTo(x - 2, y)) possibleDirs.push({ x: x - 2, y });

            if (possibleDirs.length > 0) {
                const next = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];

                visited.push(next);
                stack.push(next);

                // координати у великому масиві
                const cx = x;
                const cy = y;
                const nx = next.x;
                const ny = next.y;

                // пробиваємо стіну між клітинками
                this.maze[cy][cx] = this.opened;
                this.maze[ny][nx] = this.opened;
                this.maze[(cy + ny) / 2][(cx + nx) / 2] = this.opened;
            } else {
                stack.pop();
            }
        }
    }

    canMoveTo(x: number, y: number) {
        return (
            x > 0 &&
            x < this.cols - 1 &&
            y > 0 &&
            y < this.rows - 1 &&
            this.maze[y][x] === this.wall
        );
    }

    deleteDeadEnds(percentage = .5) {
        const deadEnds = [];

        const rows = this.maze.length;
        const cols = this.maze[0].length;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (this.isDeadEnd(x, y)) deadEnds.push({ x, y })
            }
        }

        for (let i = 0; i < deadEnds.length; i++) {
            if (Math.random() > percentage) continue;

            const { x, y } = deadEnds[i];

            const possibleDirs = [];
            if (this.maze[y - 1]?.[x] === this.wall && this.maze[y - 2]?.[x] === this.opened) possibleDirs.push({ x, y: y - 1 });
            if (this.maze[y]?.[x + 1] === this.wall && this.maze[y]?.[x + 2] === this.opened) possibleDirs.push({ x: x + 1, y });
            if (this.maze[y + 1]?.[x] === this.wall && this.maze[y + 2]?.[x] === this.opened) possibleDirs.push({ x, y: y + 1 });
            if (this.maze[y]?.[x - 1] === this.wall && this.maze[y]?.[x - 2] === this.opened) possibleDirs.push({ x: x - 1, y });

            if (possibleDirs.length > 0) {
                const randomDir = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                this.maze[randomDir.y][randomDir.x] = this.opened;
            }
        }
    }

    isDeadEnd(x: number, y: number) {
        if (this.maze[y][x] === this.wall) return false;

        let openNeighbours = 0;
        if (this.maze[y - 1]?.[x] === this.opened) openNeighbours++;
        if (this.maze[y]?.[x + 1] === this.opened) openNeighbours++;
        if (this.maze[y + 1]?.[x] === this.opened) openNeighbours++;
        if (this.maze[y]?.[x - 1] === this.opened) openNeighbours++;

        return openNeighbours <= 1;
    }

    findOpenedAndWallPlates() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === this.opened) {
                    this.openedPlates.push({ x, y });
                } else if (this.maze[y][x] === this.wall) {
                    this.wallPlates.push({ x, y });
                }
            }
        }
    }

    positionToWorld(p: Vec | { x: number, y: number }) {
        return {
            x: p.x * this.mazeScale + this.mazeScale / 2,
            y: p.y * this.mazeScale + this.mazeScale / 2
        }
    }



    generateColliders(collisionSystem: CollisionSystem) {
        const walls = this.findLongWalls();
        for (const wall of walls) {
            let center = new Vec();
            let w = this.mazeScale, h = this.mazeScale;

            if (wall.length > 1) {
                const p0 = wall[0];
                const p1 = wall[1];
                const isHorisontal = p0.x === p1.x;

                w = !isHorisontal ? wall.length * this.mazeScale : this.mazeScale;
                h = isHorisontal ? wall.length * this.mazeScale : this.mazeScale;

                wall.forEach(p => {
                    center.x += p.x;
                    center.y += p.y;
                })
                center.x /= wall.length;
                center.y /= wall.length;
            } else {
                const p0 = wall[0];
                center.x = p0.x;
                center.y = p0.y;
            }


            const position = this.positionToWorld(center);
            const collider = new RectangleCollider(new Vec(position.x, position.y), w, h);
            collisionSystem.colliders.push(collider);
        }
    }

    findLongWalls(): { x: number, y: number }[][] {
        const walls: { x: number, y: number }[][] = [];

        for (const wallPlate of this.wallPlates) {
            const { x, y } = wallPlate;
            const isUsed = walls.some(wall =>
                wall.some(plate =>
                    plate.x === x && plate.y === y
                )
            )
            if (isUsed) continue;


            const wall: { x: number, y: number }[] = [];

            const possibleDirs = [];
            if (this.maze[y - 1]?.[x] === this.wall) possibleDirs.push({ x, y: y - 1 });
            if (this.maze[y]?.[x + 1] === this.wall) possibleDirs.push({ x: x + 1, y });
            if (this.maze[y + 1]?.[x] === this.wall) possibleDirs.push({ x, y: y + 1 });
            if (this.maze[y]?.[x - 1] === this.wall) possibleDirs.push({ x: x - 1, y });

            if (possibleDirs.length > 0) {
                const next = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
                const dir = { x: next.x - x, y: next.y - y };

                // dir не додаємо, потрібно врахувати першу плитку
                const nextPlate = { ...wallPlate };
                while (this.maze[nextPlate.y]?.[nextPlate.x] === this.wall) {
                    wall.push({ ...nextPlate });
                    nextPlate.x += dir.x;
                    nextPlate.y += dir.y;
                }

                nextPlate.x = wallPlate.x - dir.x;
                nextPlate.y = wallPlate.y - dir.y;
                while (this.maze[nextPlate.y]?.[nextPlate.x] === this.wall) {
                    wall.push({ ...nextPlate });
                    nextPlate.x -= dir.x;
                    nextPlate.y -= dir.y;
                }
            } else {
                wall.push({ x: x, y: y });
            }
            walls.push(wall);
        }

        return walls;
    }


    saveRenderImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = this.cols * this.mazeScale;
        canvas.height = this.rows * this.mazeScale;

        const cellSize = this.mazeScale;

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const element = this.maze[y][x];
                const px = cellSize * x;
                const py = cellSize * y;

                ctx.fillStyle = element === this.wall ? 'gray' : 'white';
                ctx.fillRect(px, py, cellSize, cellSize);

                // ctx.font = "10px Arial";
                // ctx.fillStyle = "black";
                // ctx.textAlign = "center";
                // ctx.textBaseline = "middle";
                // ctx.fillText(`(${x}, ${y}) ${element}`, px + cellSize / 2, py + cellSize / 2);
            }
        }

        this.img = new Image();
        this.img.src = canvas.toDataURL("image/png");
        canvas.remove();
    }
}