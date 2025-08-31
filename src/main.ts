import { Ray, RaycastResult, vec2, World } from "p2";
import Camera from "./camera";
import Maze from "./maze";
import Player from "./player";
import RenderSystem from "./renderSystem";
import Vec from "./vector";

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const renderTimeEl = document.getElementById('render-time');
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let w = canvas.width;
let h = canvas.height;
const pressedKeys = new Set();
const clickedKeys = new Set();


const drawCanvas = document.createElement('canvas');
drawCanvas.width = w;
drawCanvas.height = h;
const drawCtx = drawCanvas.getContext("2d") as CanvasRenderingContext2D;



const world = new World({
	gravity: [0, 0]
});



const renderSystem = new RenderSystem();
let isRenderFOV = false;
const maze = new Maze(35, 35);
maze.generate();
maze.generateColliders(world);
const camera = new Camera();
const players: Player[] = [];


createPlayer();
createPlayer();
createPlayer();
createPlayer();
createPlayer();
createPlayer();
createPlayer();

let index = 0;
let currentPlayer = players[index];


const raysCount = 180;
const fowDist = 500;
const raycastResult = new RaycastResult();
const ray = new Ray({
	from: [0, 0],
	to: [0, 0],
	mode: Ray.CLOSEST,
	collisionGroup: 0x0008
});
const hitPoint = vec2.create();
const fieldOfView: Vec[] = Array.from({ length: raysCount }, () => new Vec());



renderSystem.add(
	(ctx) => {
		if (maze.img) ctx.drawImage(maze.img, 0, 0);
	},
	0
);

renderSystem.add(
	(ctx) => {
		for (const p of players) {
			p.render(ctx);
		}
	},
	1
);

renderSystem.add(
	() => {
		if (isRenderFOV) {
			updateFOV(fieldOfView);

			drawCtx.globalCompositeOperation = 'destination-out';
			drawCtx.filter = `blur(${15 * camera.scale}px)`;
			drawCtx.fillStyle = 'rgba(0, 0, 0, 1)';

			drawCtx.beginPath();
			const { x: x0, y: y0 } = fieldOfView[0];
			drawCtx.moveTo(x0, y0);
			for (let i = 1; i < fieldOfView.length; i++) {
				const { x, y } = fieldOfView[i];
				drawCtx.lineTo(x, y);
			}
			drawCtx.closePath();
			drawCtx.fill();
		}
	},
	5
);


function createPlayer() {
	const player = new Player();
	player.body.position = randomMazePosition().toArray();
	world.addBody(player.body);
	players.push(player);
	return player;
}

function randomMazePosition() {
	const randomPosition = maze.openedPlates[Math.floor(Math.random() * maze.openedPlates.length)];
	return maze.positionToWorld(randomPosition);
}

function updateFOV(fieldOfView: Vec[]) {
	const angleStep = Math.PI * 2 / fieldOfView.length;
	const rayStart = Vec.fromArray(currentPlayer.body.position);

	for (let i = 0; i < fieldOfView.length; i++) {
		const angle = angleStep * i;
		const dir = new Vec(
			Math.cos(angle),
			Math.sin(angle)
		);

		const rayEnd = rayStart.copy().addLocal(dir.scale(fowDist));

		vec2.copy(ray.from, rayStart.toArray());
		vec2.copy(ray.to, rayEnd.toArray());
		ray.update();
		raycastResult.reset();
		world.raycast(raycastResult, ray);

		if (raycastResult.hasHit()) {
			raycastResult.getHitPoint(hitPoint, ray);
			fieldOfView[i].setVec(Vec.fromArray(hitPoint));
		}
		else {
			fieldOfView[i].setVec(rayEnd);
		}

		// renderSystem.add(
		// 	(ctx) => {
		// 		ctx.beginPath();
		// 		ctx.moveTo(rayStart.x, rayStart.y);
		// 		ctx.lineTo(fieldOfView[i].x, fieldOfView[i].y);
		// 		ctx.strokeStyle = 'green';
		// 		ctx.stroke();
		// 	},
		// 	6,
		// 	true
		// );
	}
}

function update(_dt: number) {
	if (clickedKeys.has('r')) isRenderFOV = !isRenderFOV;

	if (clickedKeys.has('q')) {
		index = Math.abs((index - 1) % players.length);
		currentPlayer = players[index];
	}
	if (clickedKeys.has('e')) {
		index = (index + 1) % players.length;
		currentPlayer = players[index];
	}

	const dirMove = new Vec(
		pressedKeys.has('a') ? -1 : pressedKeys.has('d') ? 1 : 0,
		pressedKeys.has('w') ? -1 : pressedKeys.has('s') ? 1 : 0
	).normalizeLocal();

	currentPlayer.isRun = pressedKeys.has('shift');
	currentPlayer.move(dirMove);
}

function postUpdate(dt: number) {
	camera.follow(Vec.fromArray(currentPlayer.body.position), dt);
	clickedKeys.clear();
}



const averageRenderTime: number[] = Array.from({ length: 100 });
let lastRenderIndex = 0;
function render() {
	if (!ctx) return;
	ctx.imageSmoothingEnabled = false;
	const start = performance.now();
	ctx.clearRect(0, 0, w, h);
	drawCtx.clearRect(0, 0, w, h);

	if (isRenderFOV) {
		drawCtx.fillStyle = 'rgba(0, 0, 0, 1)';
		drawCtx.fillRect(0, 0, w, h);
	}

	camera.apply(ctx);
	if (isRenderFOV) camera.apply(drawCtx);

	renderSystem.render(ctx);

	if (isRenderFOV) camera.reset(drawCtx);
	camera.reset(ctx);
	ctx.drawImage(drawCanvas, 0, 0);

	const end = performance.now();
	const time = end - start;
	averageRenderTime[lastRenderIndex] = time;
	lastRenderIndex++;
	if (renderTimeEl && lastRenderIndex >= averageRenderTime.length) {
		lastRenderIndex = 0;
		let value = 0;
		averageRenderTime.forEach(t => value += t);
		value /= averageRenderTime.length;
		renderTimeEl.innerText = `${value.toFixed(2)}ms`;
	}
}

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	w = canvas.width;
	h = canvas.height;
	drawCanvas.width = w;
	drawCanvas.height = h;
	render();
});

window.addEventListener('wheel', (e) => {
	camera.zoom(e.deltaY > 0 ? -1 : 1);
});

window.addEventListener('keydown', (e) => {
	pressedKeys.add(e.key.toLowerCase());
	clickedKeys.add(e.key.toLowerCase());
});

window.addEventListener('keyup', (e) => {
	pressedKeys.delete(e.key.toLowerCase());
});



let lastUpdate = Date.now();
const fixedTimeStep = 1 / 60; // 60 FPS
const maxSubSteps = 10;

function animation() {
	const now = Date.now();
	const dt = (now - lastUpdate);
	lastUpdate = now;

	world.step(fixedTimeStep, dt, maxSubSteps);

	update(dt / 1000);
	postUpdate(dt / 1000);
	render();

	requestAnimationFrame(animation);
}
requestAnimationFrame(animation);

