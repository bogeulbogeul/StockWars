export function parseChapters(text) {
    const chapters = new Map(); let current;
    for (const raw of text.split(/\r?\n/)) {
        const heading = raw.match(/^## (\d+) (.+)/);
        if (heading) { current = { title: heading[2], lines: [] }; chapters.set(Number(heading[1]), current); }
        else if (current) current.lines.push(raw.trim());
    }
    return chapters;
}
export async function loadScript() {
    const files = ['opening', 'activities-and-ending'];
    const texts = await Promise.all(files.map(async file => {
        const response = await fetch(new URL(`../../../assets/exhibition/${file}.txt`, import.meta.url));
        if (!response.ok) throw new Error('대본을 불러오지 못했어요.');
        return response.text();
    }));
    return parseChapters(texts.join('\n'));
}
export function segment(lines, from, to) {
    const start = from ? lines.findIndex(line => line.startsWith(from)) + 1 : 0;
    const end = to ? lines.findIndex((line, index) => index >= start && line.startsWith(to)) : lines.length;
    if (start < 0 || end < 0) throw new Error('대본 구간이 올바르지 않아요.');
    return lines.slice(start, end);
}
export function dialogue(lines, context) {
    return lines.flatMap(line => {
        const match = line.match(/^([^:[\]]+): “(.*)”$/);
        return match && !match[2].includes('＿＿') ? [{ kind: 'line', speaker: match[1], text: match[2], ...context }] : [];
    });
}
