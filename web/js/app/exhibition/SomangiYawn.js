import { animate, arms, reach } from './HandoffMotion.js';

export async function playSomangiYawn(scenes, signal) {
    const player = scenes.townModelScene.player;
    await player.ready; player.setState('idle');
    await player.setExpression('sleepy');
    const bones = arms(player.variants.get('walk').model);
    const right = bones.filter(b => /R/.test(b.bone.name));
    try { await animate(1.8, t => reach(right, .8 * Math.sin(Math.PI * t)), signal); }
    finally { reach(bones, 0); }
}
