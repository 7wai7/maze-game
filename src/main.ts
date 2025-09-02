import Renderer from "./renderer";
import Game from "./game";
import InputManager from "./inputManager";

async function bootstrap() {
	const inputManager = new InputManager();
	const game = new Game(inputManager);
	const render = new Renderer(game, inputManager);
	await render.init(); // load render sprites / vision layer
	render.start();
}

bootstrap().catch(console.error);