import { Window } from 'happy-dom';
const window = new Window({ url: 'http://localhost:3000' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLDialogElement', 'Node', 'MutationObserver', 'Event', 'MouseEvent'] as const) {
  Object.defineProperty(globalThis, key, { value: key === 'window' ? window : window[key], configurable: true, writable: true });
}
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
