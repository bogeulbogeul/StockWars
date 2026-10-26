export const SOMANGI_HEIGHT = 100;
export const SOMANGI_VIEW_HEIGHT = 700;
export const SOMANGI_REFERENCE_HEIGHT = 1.9000606;
export const SOMANGI_FOOT_Y = -.95064157;
export const SOMANGI_MODELS = Object.freeze({ walk: { file: 'walk.glb', clip: 'Walk_InPlace' }, eat: { file: 'eat.glb', clip: 'Eat' }, sideways: { file: 'sideways.glb', clip: 'Sideways' } });
export const SOMANGI_EXPRESSIONS = Object.freeze('smile happy neutral curious surprised worried teary pout determined shy relieved touched sleepy delicious'.split(' '));
export const somangiAssetUrl = file => new URL(`../../assets/characters/3d/somangi/${file}`, import.meta.url).href;
