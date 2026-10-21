// Retire the old 2D world presentation, rather than hiding the app with CSS.
// References retained by legacy simulation code are detached from the live DOM.
export function retireLegacyWorldViews(app) {
    app.officeStage?.hide();
    app.officeStage?.stageContainer?.remove();
    const town = app.townStage;
    for (const child of [...town.containerEl.children]) {
        if (child !== town.viewportEl) child.remove();
    }
    for (const child of [...town.viewportEl.children]) child.remove();
}
