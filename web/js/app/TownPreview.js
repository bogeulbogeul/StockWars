// A reversible art-review state: no new game, registration, or save reset.
export function startTownPreview(app) {
    if (!document.body.classList.contains('ui-paused')) return;
    app.titleScreen.hide();
    app.officeStage.hide();
    app.townStage.show({ name: '그래픽 확인', ping: null });
    document.body.classList.add('town-mode-active');
    document.activeElement?.blur();

    // Hidden UI must not receive focus or open an invisible modal via shortcuts.
    const allowed = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', 'shift']);
    window.addEventListener('keydown', event => {
        if (!document.body.classList.contains('ui-paused')) return;
        if (allowed.has(event.key.toLowerCase()) || event.key === 'F5' || event.ctrlKey || event.metaKey || event.altKey) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);
    app.townStage.viewportEl.addEventListener('click', event => {
        if (!document.body.classList.contains('ui-paused')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);
}
