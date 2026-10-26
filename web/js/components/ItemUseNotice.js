import { toastManager } from './ToastManager.js';

// The old dark modal is retired; retain feedback without reopening its screen.
export function showItemUseNotice(id, result, engine) {
    toastManager.show(result.message, result.success);
}
