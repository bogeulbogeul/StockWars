import { DOG_FRAMES } from './DogSpriteData.js';
import { CHARACTER_HEIGHT } from '../data/characterScale.js';
import { CAT_FRAMES } from './CatSpriteData.js';
import { FOREST_CHARACTER_STYLES } from './ForestCharacterStyles.js';

export const BASE_CHARACTER_STYLES = Object.freeze([
    { id: 'dog', label: '강아지', preview: new URL('../../assets/characters/dog-baseline-v9/atlas.png', import.meta.url).href, frames: DOG_FRAMES, scale: CHARACTER_HEIGHT / 340, portrait: true, portraitCrop: [8, 78, 304, 244] },
    { id: 'black-cat', label: '검은 고양이', preview: new URL('../../assets/characters/black-cat-baseline-v3/atlas.png', import.meta.url).href, frames: CAT_FRAMES, scale: CHARACTER_HEIGHT / 340, portrait: true, portraitCrop: [8, 72, 304, 268] }
]);
export const CHARACTER_STYLES = Object.freeze([...BASE_CHARACTER_STYLES, ...FOREST_CHARACTER_STYLES]);
let selectedStyle = 'dog';
const canvasAtlases = new Map();
export function resolveCharacterStyle(styleId) {
    return CHARACTER_STYLES.find(style => style.id === styleId) || CHARACTER_STYLES[0];
}
export function setPlayerCharacterStyle(styleId) { selectedStyle = resolveCharacterStyle(styleId).id; }
export function characterFaceSVG(styleId, { shoulders = false } = {}) {
    const style = resolveCharacterStyle(styleId);
    const f = style.portrait ? style.frames.rows.face_portrait[0] : style.frames.rows.down_idle[0];
    const crop = style.portrait ? style.portraitCrop || [0, 0, 320, 400] : style.id === 'black-cat'
        ? [96, 16, 174, shoulders ? 207 : 156]
        : [69, 16, 195, shoulders ? 205 : 151];
    const [, , w, h] = crop;
    return `<svg class="character-face-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><svg width="${w}" height="${h}" viewBox="${crop.join(' ')}" overflow="hidden"><svg width="320" height="400" viewBox="${f.x} ${f.y} ${f.w} ${f.h}" overflow="hidden"><image href="${style.preview}" width="${style.frames.sheetWidth}" height="${style.frames.sheetHeight}"/></svg></svg></svg>`;
}
export function characterFrame({ styleId = selectedStyle, direction = 'down', moving = false, seated = false, carrying = false, time = performance.now() } = {}) {
    const style = resolveCharacterStyle(styleId);
    const facing = direction === 'front' ? 'down' : direction === 'back' ? 'up' : direction;
    const flip = facing === 'left';
    const basis = carrying && !seated ? 'right' : flip ? 'right' : seated && facing === 'up' ? 'down' : facing;
    const mode = seated ? 'sit' : carrying ? 'carry' : moving ? 'walk' : 'idle';
    const state = `${basis}_${mode}`;
    // Stopping holds the walk's neutral artwork, avoiding a separately drawn idle.
    const neutral = mode === 'idle' && style.frames.rows[`${basis}_walk`]?.[1];
    const frames = neutral ? [neutral] : style.frames.rows[state] || style.frames.rows.down_idle;
    const wag = style.id === 'dog' && (!moving || seated) && style.frames.rows[`${state}_wag`];
    if (wag) {
        const index = [1, 2, 1, 0][Math.floor(time / 160) % 4];
        // The held middle pose shares the original approved artwork exactly.
        return { style, state, index, flip, rect: index === 1 ? frames[0] : wag[index] };
    }
    const order = frames.length === 3 ? [0, 1, 2, 1] : frames.map((_, i) => i);
    const index = moving && !seated ? order[Math.floor(time / 160) % order.length] : carrying && !seated && frames.length === 3 ? 1 : 0;
    return { style, state, index, flip, rect: frames[index] };
}
export function characterSpriteSVG(options = {}, world = false) {
    const { rect: f, flip, style } = characterFrame(options);
    const w = 320 * style.scale, h = 372 * style.scale;
    const body = `<svg width="320" height="400" viewBox="${f.x} ${f.y} ${f.w} ${f.h}" overflow="hidden"><image href="${style.preview}" width="${style.frames.sheetWidth}" height="${style.frames.sheetHeight}"/></svg>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" ${world ? `x="${-w / 2}" y="${-h}"` : ''} width="${w}" height="${h}" viewBox="0 0 320 372" overflow="visible" aria-label="${style.label} 캐릭터"><g ${flip ? 'transform="translate(320 0) scale(-1 1)"' : ''}>${body}</g></svg>`;
}
export function updateCharacterSprite(host, options = {}, world = false) {
    if (!host) return;
    const f = characterFrame(options), key = `${f.style.id}:${f.state}:${f.index}:${f.flip}:${world}`;
    if (host.dataset.characterFrame === key) return;
    host.dataset.characterFrame = key;
    if (!world) Object.assign(host.style, { width: `${320 * f.style.scale}px`, height: `${372 * f.style.scale}px`, background: 'none', border: 'none', borderRadius: '0', boxShadow: 'none', transform: 'none', transition: 'none', flexShrink: '0' });
    host.innerHTML = characterSpriteSVG(options, world);
}
export function paintCharacterSprite(ctx, x, y, options = {}) {
    const { rect: f, flip, style } = characterFrame(options);
    if (!canvasAtlases.has(style.id)) { const img = new Image(); img.src = style.preview; canvasAtlases.set(style.id, img); }
    const image = canvasAtlases.get(style.id);
    if (!image.naturalWidth) return;
    ctx.save(); ctx.translate(x, y);
    ctx.scale(flip ? -style.scale : style.scale, style.scale);
    ctx.translate(-160, -372);
    ctx.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, 320, 400);
    ctx.restore();
}
