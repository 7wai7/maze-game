import Renderer from "./renderer";
import Game from "./game";
import InputManager from "./inputManager";
import Core from "./core";
import initUI from "./ui/ui";

async function bootstrap() {
	Core.game = new Game();
	Core.renderer = new Renderer();
	Core.inputManager = new InputManager();
	Core.game.init();
	await Core.renderer.init(); // load render sprites / vision layer
	initUI();
	Core.renderer.start();
}

bootstrap().catch(console.error);