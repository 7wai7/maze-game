import HPBars from "./hpBars";
import HurtOverlay from "./hurtOverlay";
import Inventory from "./inventory";
import DebugTools from "./sidebar";

function resizeMiniMap() {
    const miniMap = document.querySelector('.mini-map') as HTMLCanvasElement;
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.3;
    miniMap.width = size;
    miniMap.height = size;
}

export default function initUI() {
    DebugTools();

    new HPBars();
    new HurtOverlay();
    Inventory();
    resizeMiniMap();
    window.addEventListener('resize', resizeMiniMap);
}