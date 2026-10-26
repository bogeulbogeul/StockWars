import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';

export function showFirstPhonePrompt(app) {
    app.cancelPhonePrompt?.();
    const view = app.view, phone = view.phoneHome;
    const guide = createMoaMovementGuide(view.root, { smartphone: true });
    const previousOpen = phone.onOpen;
    view.panel.hidden = true; view.phonePromptAllowed = true;
    guide.update({ visible: true }); view.syncPhoneAvailability();
    let opened = false;
    const clear = () => {
        guide.dispose(); phone.onOpen = previousOpen;
        phone.dialog.removeEventListener('close', closed);
        view.phonePromptAllowed = false; app.cancelPhonePrompt = null;
    };
    const closed = () => {
        if (!opened || phone.dialog.open) return;
        clear();
        if (app.plan[app.state.cursor]?.id === 'openPhone') app.next('openPhone');
    };
    phone.onOpen = () => { opened = true; guide.update({ visible: false }); previousOpen?.(); };
    phone.dialog.addEventListener('close', closed);
    app.cancelPhonePrompt = clear;
}
