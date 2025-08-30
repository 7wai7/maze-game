import Camera from "./camera";
import CollisionSystem from "./collisionSystem";
import Maze from "./maze";
import Player from "./player";
import Ray from "./ray";
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

const renderSystem = new RenderSystem();
const collisionSystem = new CollisionSystem();
let isRenderColliders = false;
const maze = new Maze(35, 35);
maze.generate();
maze.generateColliders(collisionSystem);
console.log("colliders", collisionSystem.colliders.length);

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


const raysCount = 1;
const angleStep = Math.PI * 2 / raysCount;
const fieldOfViewRays: Ray[] = Array.from({ length: raysCount }, (_, k) => {
	const angle = angleStep * k;
	const dir = new Vec(
		Math.cos(angle),
		Math.sin(angle)
	);

	const ray = new Ray(currentPlayer.position, dir, 100);
	collisionSystem.colliders.push(ray);
	return ray;
});

console.log(fieldOfViewRays);


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
	0
);

renderSystem.add(
	(ctx) => {
		if (isRenderColliders)
			for (const collider of collisionSystem.colliders) {
				collider.render(ctx);
			}
	},
	0
);


function createPlayer() {
	const player = new Player();
	player.position.setVec(randomMazePosition());
	players.push(player);
	// collisionSystem.colliders.push(player.collider);
	return player;
}

function randomMazePosition() {
	const randomPosition = maze.openedPlates[Math.floor(Math.random() * maze.openedPlates.length)];
	const toWorld = maze.positionToWorld(randomPosition);
	return Vec.VecFromObj(toWorld);
}

function update(dt: number) {
	if (clickedKeys.has('r')) isRenderColliders = !isRenderColliders;

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
	)
	dirMove.normalizeLocal();

	currentPlayer.isRun = pressedKeys.has('shift');
	currentPlayer.move(dirMove);

	for (const p of players) {
		p.update(dt);
	}

	// Перевіряємо колізії
	collisionSystem.calculateCollisions();
}

function postUpdate(_dt: number) {
	camera.follow(currentPlayer.position);
	clickedKeys.clear();
}

const averageRenderTime: number[] = Array.from({ length: 50 });
let lastRenderIndex = 0;
function render() {
	if (!ctx) return;
	const start = performance.now();
	ctx.clearRect(0, 0, w, h);
	drawCtx.clearRect(0, 0, w, h);
	camera.apply(ctx);
	camera.apply(drawCtx);
	renderSystem.render(ctx);


	const centerX = currentPlayer.position.x;
	const centerY = currentPlayer.position.y;
	// drawCtx.fillStyle = 'rgba(255, 0, 0, 1)';
	// drawCtx.fillRect(centerX - 200, centerY - 200, 500, 500);

	drawCtx.globalCompositeOperation = 'destination-out';
	drawCtx.filter = 'blur(50px)';
	drawCtx.fillStyle = 'rgba(0, 0, 0, 1)';

	drawCtx.beginPath();
	const { x: x0, y: y0 } = fieldOfViewRays[0].point;
	drawCtx.moveTo(centerX + x0, centerY + y0);
	for (let i = 1; i < fieldOfViewRays.length; i++) {
		const { x, y } = fieldOfViewRays[i].point;
		drawCtx.lineTo(centerX + x, centerY + y);
	}
	drawCtx.closePath();
	drawCtx.fill();

	
        // console.log(x, y);


	camera.reset(drawCtx);
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

render();

let lastUpdate = Date.now();
function animation() {
	const dt = Date.now() - lastUpdate;
	if (dt > 16) {
		lastUpdate = Date.now();
		update(dt);
		postUpdate(dt);
		render();
	}
	requestAnimationFrame(animation);
}
requestAnimationFrame(animation);
