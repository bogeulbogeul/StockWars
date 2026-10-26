import { animationDialogue } from './AnimationDialogue.js';
import { Vector3 } from '../../../vendor/three/three.module.js';
import { GLTFLoader } from '../../../vendor/three/GLTFLoader.js';
import { shopItemModelUrl } from '../../data/shopItemModels.js';
import { animate, arms, reach } from './HandoffMotion.js';
import { createMoaMovementGuide } from '../../components/town3d/MoaMovementGuide.js';
import { singleHoneyCookie } from '../../components/town3d/SomangiFoodAssets.js';
export { singleHoneyCookie } from '../../components/town3d/SomangiFoodAssets.js';

export async function receiveHoneyCookie(app) {
    const town = app.scenes.townModelScene, moa = town.sleepingAnna, player = town.player;
    const { scene: source } = await new GLTFLoader().loadAsync(shopItemModelUrl('item_honey_cookie'));
    const cookie = singleHoneyCookie(source); town.scene.add(cookie);
    town.scene.updateMatrixWorld(true);
    const giver = arms(moa.root), receiver = arms(player.variants.get('walk').model);
    const start = moa.root.localToWorld(new Vector3(18, 60, 26));
    const held = player.root.localToWorld(new Vector3(0, 62, 28));
    const offered = start.clone().lerp(held, .55); offered.y = Math.max(start.y, held.y) + 5;
    const guide = createMoaMovementGuide(app.view.root, { receive: 'cookie' });
    let ready = false, accept;
    const received = new Promise(resolve => { accept = resolve; });
    const key = event => {
        if (event.ctrlKey || event.metaKey || event.altKey || !['KeyF', 'Escape'].includes(event.code)) return;
        event.preventDefault(); event.stopImmediatePropagation();
        if (ready && event.code === 'KeyF' && !event.repeat) { ready = false; guide.update({ visible: false }); advance.next(); }
    };
    app.scenes.receivingItem = true; window.addEventListener('keydown', key, true);
    const advance = animationDialogue(app, { speaker: '소망이', text: '꿀 쿠키…… 달콤하다. 잠깐 쉬어 가도 좋겠어.' });
    advance.onAdvance(accept);
    try {
        await animate(.9, t => {
            cookie.position.lerpVectors(start, offered, t); cookie.position.y += Math.sin(t * Math.PI) * 8;
            reach(giver, .65 * t);
        }, advance.signal);
        ready = true; guide.update({ visible: true }); await received;
        await animate(.65, t => {
            cookie.position.lerpVectors(offered, held, t); reach(giver, .65 * (1 - t)); reach(receiver, .75 * t);
        }, advance.signal);
        reach(receiver,0); await player.setExpression('smile'); player.setState('idle');
        if (!player.play('eat',{scripted:true,foodId:'item_honey_cookie',foodObject:cookie})) throw new Error('쿠키 먹기 모션을 재생하지 못했어요.');
        await player.food.ready;
        const eating=player.variants.get('eat');
        await animate(eating.action.getClip().duration+.1,()=>{}, advance.signal);
        player.setState('idle'); await player.setExpression('smile');
        await advance.wait();
    } finally {
        advance.dispose();
        guide.dispose(); reach(giver, 0); reach(receiver, 0); cookie.removeFromParent();
        source.traverse(mesh => { mesh.geometry?.dispose(); for (const material of [mesh.material].flat()) material?.dispose(); });
        window.removeEventListener('keydown', key, true); app.scenes.receivingItem = false;
    }
}
