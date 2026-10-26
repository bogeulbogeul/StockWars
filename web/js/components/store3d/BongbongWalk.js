// The retained authoring clip has a large torso translation. Use the adopted
// in-game walk on this same body/rig, without changing Bongbong's mesh or scale.
export function bongbongWalkAction(root, player) {
    const source = player.variants.get('walk').action.getClip();
    if (root.userData.walkSource === source.uuid) return root.userData.walkAction;
    const mixer = root.userData.greetingMixer, previous = root.userData.walkAction;
    if (previous) { previous.stop(); mixer.uncacheClip(previous.getClip()); }
    const clip = source.clone(); clip.name = 'Bongbong_Game_Walk';
    root.userData.walkAction = mixer.clipAction(clip);
    root.userData.walkSource = source.uuid;
    return root.userData.walkAction;
}
