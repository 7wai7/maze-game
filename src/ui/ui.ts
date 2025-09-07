import HPBars from "./hpBars";
import HurtOverlay from "./hurtOverlay";
import DebugTools from "./sidebar";

DebugTools();

function resizeMiniMap() {
  const miniMap = document.querySelector('.mini-map') as HTMLCanvasElement;
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.3;
  miniMap.width = size;
  miniMap.height = size;
}

new HPBars();
new HurtOverlay();
resizeMiniMap();
window.addEventListener('resize', resizeMiniMap);
