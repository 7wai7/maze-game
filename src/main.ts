import Camera from "./camera";
import CollisionSystem from "./collisionSystem";
import Maze from "./maze";
import Player from "./player";
import Vec from "./vector";

const canvas = document.createElement('canvas');
document.getElementById('app')?.appendChild(canvas);
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let w = canvas.width;
let h = canvas.height;
const pressedKeys = new Set();
const clickedKeys = new Set();

// const renderCallBacks: { cb: (ctx: CanvasRenderingContext2D) => void, zIndex: number }[] = [];
// renderCallBacks.push({
// 	cb: (ctx) => {
// 		if (result.normal) {
// 			ctx.beginPath();
// 			ctx.moveTo(obj1.position.x, obj1.position.y);
// 			ctx.lineTo(obj1.position.x + result.normal.x * 20, obj1.position.y + result.normal.y * 20);
// 			ctx.strokeStyle = "yellow";
// 			ctx.lineWidth = 2;
// 			ctx.stroke();
// 		}
// 	},
// 	zIndex: 0
// })



const collisionSystem = new CollisionSystem();
const maze = new Maze(35, 35);
maze.generate();
maze.generateColliders(collisionSystem);
console.log("colliders", collisionSystem.colliders.length);

const camera = new Camera();
const players: Player[] = [];
let isRenderColliders = true;

createPlayer();
createPlayer();

let index = 0;
let currentPlayer = players[index];

function createPlayer() {
	const player = new Player();
	player.position.setVec(randomMazePosition());
	players.push(player);
	collisionSystem.colliders.push(player.collider);
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

function render() {
	if (!ctx) return;
	ctx.clearRect(0, 0, w, h);

	camera.apply(ctx);
	if (maze.img) ctx.drawImage(maze.img, 0, 0);

	for (const p of players) {
		p.render(ctx);
	}

	if (isRenderColliders)
		for (const collider of collisionSystem.colliders) {
			collider.render(ctx);
		}


	// renderCallBacks.sort((a, b) => a.zIndex - b.zIndex);
	// renderCallBacks.forEach(({cb}) => cb(ctx));
	// renderCallBacks.length = 0;

	camera.reset(ctx);
}

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	w = canvas.width;
	h = canvas.height;
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
