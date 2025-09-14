import Core from "../core";
import type Player from "../players/player";
import Runner from "../players/runner";
import type { InventoryItem } from "../types/InventoryItem";

export default function Inventory() {
	const inventoryContainerEl = document.querySelector(".inventory") as HTMLElement;
	let prevItems = new Set<InventoryItem>;

	function renderContainer(items: Set<InventoryItem>) {
		// видаляємо ті, яких більше немає
		prevItems.forEach(item => {
			if (!items.has(item)) {
				const el = inventoryContainerEl.querySelector(`[data-item="${item}"]`);
				if (el) el.remove();
			}
		});

		// додаємо нові
		items.forEach(item => {
			if (!prevItems.has(item)) {
				const img = document.createElement("img");
				img.dataset.item = item;
				img.src = `/inventory_items/${item}.png`;
				inventoryContainerEl.appendChild(img);
			}
		});

		// зберігаємо стан
		prevItems = new Set(items);
	}

	Core.emitter.on("inventory-get-item", (player: Runner) => {
		if (Core.game.currentPlayer !== player) return;
		inventoryContainerEl.style.display = player.inventory.size > 0 ? 'block' : 'none';
		renderContainer(player.inventory);
	});
	Core.emitter.on("inventory-remove-item", (player: Runner) => {
		if (Core.game.currentPlayer !== player) return;
		inventoryContainerEl.style.display = player.inventory.size > 0 ? 'block' : 'none';
		renderContainer(player.inventory);
	});

	Core.emitter.on('change-current-player', (player: Player) => {
		if (player instanceof Runner) {
			renderContainer(player.inventory);
			inventoryContainerEl.style.display = player.inventory.size > 0 ? 'block' : 'none';
		}
		else inventoryContainerEl.style.display = 'none';
	})

	const p = Core.game.currentPlayer;
	if (p instanceof Runner) {
		renderContainer(p.inventory);
		inventoryContainerEl.style.display = p.inventory.size > 0 ? 'block' : 'none';
	}
}
