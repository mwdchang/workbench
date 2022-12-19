export class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, fn ) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(fn);
  }

  once(eventName, fn) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const onceWrapper = (eventName, ...args) => {
      fn(eventName, ...args);
      this.off(eventName, onceWrapper);
    };
    this.listeners.get(eventName).add(onceWrapper);
  }

  off(eventName, fn) {
    const set = this.listeners.get(eventName);
    if (set) {
      set.delete(fn);
    }
  }

  emit(eventName, ...args) {
    const fns = this.listeners.get(eventName);
    if (!fns) return false;

    fns.forEach((f) => {
      f(eventName, ...args);
    });
    return true;
  }
}
