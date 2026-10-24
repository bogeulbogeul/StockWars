import { GROUND_PROJECTION } from '../../data/townModelBuildings.js';

// Clear floor beside the counters keeps the actor visible above the dialogue panel.
const dialoguePositions = { home: [0, -115], store: [-165, -95], information: [210, -80], bank: [245, -90], stock: [240, -110] };
export function placeSomangi(scenes, scene) {
    const position = dialoguePositions[scenes.place];
    if (!position || !scene.controller) return;
    const [x, z] = position;
    Object.assign(scene.controller, { charPosX: x, charPosY: z * GROUND_PROJECTION });
    scene.player?.update(0);
}

// Story moods reuse the approved face atlas; character geometry stays shared.
export function expressionForBeat(beat) {
    if (beat.kind === 'action') return ({ nickname: 'shy', phone: 'curious', loan: 'worried', packing: 'determined', wage: 'happy', certificate: 'happy', rumor: 'curious', sunset: 'relieved', cookie: 'delicious', diary: 'touched', planted: 'determined' })[beat.id] || 'smile';
    if (!beat.speaker?.includes('소망')) return 'smile';
    const text = beat.text || '';
    for (const [pattern, mood] of [[/고마워/, 'touched'], [/맛있/, 'delicious'], [/힘들|졸려/, 'sleepy'], [/걱정|괜찮을|빨리해야/, 'worried'], [/해볼게|심어볼까|해보고 싶/, 'determined'], [/엄청|정말|나\?/, 'surprised'], [/뭐|누가|궁금|뭔데|\?/, 'curious'], [/좋아|내일 봐|내가 번/, 'happy'], [/다행/, 'relieved']]) if (pattern.test(text)) return mood;
    return 'smile';
}
export async function presentSomangi(scenes, beat) {
    const scene = scenes.rooms.get(scenes.place) || scenes.townModelScene;
    const moa = scene?.room?.userData.moa || (scenes.place === 'arrival' ? scenes.townModelScene.sleepingAnna : null);
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
    player.faceCamera(scene.camera);
}
