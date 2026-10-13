import { characterFrame, characterSpriteSVG, updateCharacterSprite, paintCharacterSprite, resolveCharacterStyle } from './CharacterSprite.js';

// Compatibility entry points share the current dog renderer and atlas.
export const DOG_SCALE = resolveCharacterStyle('dog').scale;
export const dogFrame = (options = {}) => characterFrame({ ...options, styleId: 'dog' });
export const dogSpriteSVG = (options = {}, world = false) => characterSpriteSVG({ ...options, styleId: 'dog' }, world);
export const updateDogSprite = (host, options = {}, world = false) => updateCharacterSprite(host, { ...options, styleId: 'dog' }, world);
export const paintDogSprite = (ctx, x, y, options = {}) => paintCharacterSprite(ctx, x, y, { ...options, styleId: 'dog' });
