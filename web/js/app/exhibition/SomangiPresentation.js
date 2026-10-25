import { faceConversation, clearConversationFacing } from '../../components/town3d/ConversationFacing.js';

// Story moods reuse the approved face atlas; character geometry stays shared.
export function expressionForBeat(beat) {
    if (beat.yawn) return 'sleepy';
    if (beat.kind === 'action') return ({ nickname: 'shy', phone: 'curious', loan: 'worried', packing: 'determined', wage: 'happy', certificate: 'happy', rumor: 'curious', sunset: 'relieved', cookie: 'delicious', diary: 'touched', planted: 'determined' })[beat.id] || 'smile';
    if (!beat.speaker?.includes('소망')) return 'smile';
    const text = beat.text || '';
    for (const [pattern, mood] of [[/고마워/, 'touched'], [/맛있/, 'delicious'], [/힘들|졸려/, 'sleepy'], [/걱정|괜찮을|빨리해야/, 'worried'], [/해볼게|심어볼까|해보고 싶/, 'determined'], [/엄청|정말|나\?/, 'surprised'], [/뭐|누가|궁금|뭔데|\?/, 'curious'], [/좋아|내일 봐|내가 번/, 'happy'], [/다행/, 'relieved']]) if (pattern.test(text)) return mood;
    return 'smile';
}
export async function presentSomangi(scenes, beat) {
    const scene = scenes.rooms.get(scenes.place) || scenes.townModelScene;
    const moa = scene?.room?.userData.moa || (['arrival', 'bankOutside', 'bench'].includes(scenes.place) || beat.chapter === 3 || beat.id === 'walk'
        ? scenes.townModelScene.sleepingAnna : null);
    if (moa) {
        await moa.ready;
        const text = beat.speaker?.includes('모아') ? beat.text || '' : '';
        const mood = /놀|뭐\?|정말\?/.test(text) ? 'surprised' : /궁금|\?/.test(text) ? 'curious'
            : /걱정|미안|슬프/.test(text) ? 'sad' : /고마|좋아|반가|축하|환영/.test(text) ? 'happy' : 'calm';
        await moa.setMood(mood, /졸|잠|꿈/.test(text) ? 'sleepy' : undefined);
    }
    const player = scene?.player;
    if (!player) return;
    await player.ready;
    await player.setExpression(expressionForBeat(beat));
    if (scenes.place === 'bank' && scene.room?.userData.chagok) {
        player.faceTarget(scene.room.userData.chagok);
        moa?.faceTarget(player.root);
    }
    else if (moa) faceConversation(player, moa);
    else if (scenes.place === 'store' && scene.shopkeeper) faceConversation(player, scene.shopkeeper);
    else if (scenes.place === 'stock' && scene.room?.getObjectByName('tori-character'))
        faceConversation(player, scene.room.getObjectByName('tori-character'));
    else {
        clearConversationFacing(scenes.townModelScene.player, scenes.townModelScene.sleepingAnna);
        player.faceCamera(scene.camera);
    }
}


