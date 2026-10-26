export function isExhibitionMode(search = location.search) {
    const query = new URLSearchParams(search);
    return !query.has('scene') && query.get('demo') !== 'standard';
}
