// Shared layout for tutorial instructions and nearby interaction prompts.
export function setGuidanceContent(element, { title, rows = [] }) {
    const signature = JSON.stringify({ title, rows });
    if (element.dataset.guidanceContent === signature) return;
    element.dataset.guidanceContent = signature;
    element.classList.add('game-guidance');
    const heading = document.createElement('strong'); heading.textContent = title;
    const lines = rows.map(({ keys = [], text }) => {
        const row = document.createElement('p');
        for (const key of keys) {
            const badge = document.createElement('kbd'); badge.textContent = key;
            row.append(badge, document.createTextNode(' '));
        }
        row.append(document.createTextNode(text)); return row;
    });
    element.replaceChildren(heading, ...lines);
}
export function setInteractionGuidance(button, key, title) {
    button.setAttribute('aria-label', `${key} · ${title}`);
    setGuidanceContent(button, { title, rows: [{ keys: [key], text: '누르기 · 클릭으로도 할 수 있어요.' }] });
}
