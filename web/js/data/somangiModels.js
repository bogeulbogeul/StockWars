export const SOMANGI_HEIGHT = 100;
export const SOMANGI_VIEW_HEIGHT = 700;
export const SOMANGI_MODELS = {
    walk: { file: 'walk.glb', clip: 'Walk_InPlace' },
    wave: { file: 'wave.glb', clip: 'Wave_Happy' },
    eat: { file: 'eat.glb', clip: 'Eat' },
    jump: { file: 'jump.glb', clip: 'Jump' }
};

export function somangiAssetUrl(file) {
    return new URL(`../../assets/characters/3d/somangi/${file}`, import.meta.url).href;
}
