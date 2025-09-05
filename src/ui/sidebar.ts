import Core from "../core";
import { findAndUpdateNested, prettifyVariableName } from "../utils";

function renderDebugTools(objectValues: Record<string, any>): string {
    const elements = Object.entries(objectValues).map(([key, value]) => {
        if (typeof value === 'boolean') {
            return `
                <label>
					<input type="checkbox" name="${key}" ${value ? 'checked' : ''}>
					<span class="checkbox-title">${prettifyVariableName(key)}</span>
				</label>
            `
        } else if (typeof value === 'number') {
            return `
                <label>
                    <span class="number-input-title">${prettifyVariableName(key)}</span>
                    <input type="number" name="${key}" value="${value}" step="1">
                </label>
            `
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            return `
                <h3>${prettifyVariableName(key)}</h3>
                <div class="debugs-container">
                    ${renderDebugTools(value)}
                </div>
            `
        }
    })

    return elements.join('');
}

export default function DebugTools() {
    const sidebar = document.querySelector('.debug-tools-sidebar') as HTMLDivElement;
    sidebar.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement;
        if (!target.name) return;

        if (target.type === 'checkbox') {
            findAndUpdateNested(Core.debugTools, target.name, (value) => {
                target.checked = !value;
                return !value;
            });
        } else if (target.type === 'number') {
            findAndUpdateNested(Core.debugTools, target.name, () => target.value);
        }

        Core.emitter.emit(`debug-${target.name}`);
    });

    const rendered = renderDebugTools(Core.debugTools);
    sidebar.innerHTML = rendered;
}