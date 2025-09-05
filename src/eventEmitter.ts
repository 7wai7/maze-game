export default class EventEmitter {
	private events: { [key: string]: Array<(...args: any[]) => void> }= {};

	on(event: string, cb: (...args: any[]) => any) {
		// console.log("on event", event);
		this.events[event] ??= [];
		this.events[event].push(cb);
	}

	emit(event: string, ...args: any[]) {
		// console.log("emit event", event);
		this.events[event]?.forEach(cb => cb(...args));
	}

	off(event: string, cb: (...args: any[]) => any) {
		// console.log("off event", event);
		if (this.events[event]) this.events[event] = this.events[event].filter(cb_ => cb_ !== cb);
	}
}