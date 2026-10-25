import { Vector3, Quaternion } from '../../../vendor/three/three.module.js';

export function safeLessonPoint(root, arm, rest, target) {
    arm.quaternion.copy(rest); root.updateMatrixWorld(true);
    const direction = target.clone().sub(arm.getWorldPosition(new Vector3())).normalize();
    const forward = new Vector3(0,0,1).transformDirection(root.matrixWorld);
    if (forward.dot(direction) < -.15) return;
    const parent = arm.parent.getWorldQuaternion(new Quaternion());
    direction.applyQuaternion(parent.invert());
    const down = new Vector3(0,-1,0).applyQuaternion(rest);
    const turn = new Quaternion().setFromUnitVectors(down, direction);
    const angle = new Quaternion().angleTo(turn), limit = Math.PI / 4;
    arm.quaternion.copy(rest).premultiply(new Quaternion().slerp(turn, Math.min(1, limit / Math.max(angle,.001))));
}

export function prepareLessonBoard(scene) {
    const board = scene.room.userData.marketBoard;
    board.lesson = true;
    drawLessonText(board.display, '토리에게 다가가 말을 걸면 큰 화면으로 주식의 기초를 함께 배울 수 있어요.');
    scene.room.userData.cameraRig = { setBase() {}, update(camera) {
        camera.fov = 36;
        const distance = Math.max(900, 850 / (2 * Math.tan(Math.PI / 10) * camera.aspect));
        camera.position.set(30, 140 + distance * .45, -90 + distance);
        camera.lookAt(0, 130, -90); camera.updateProjectionMatrix();
    } };
}

export function presentLessonBoard(scenes, beat) {
    const lesson = scenes.stockLesson;
    if (!lesson || scenes.rooms.get('stock') !== lesson.training) return;
    const root = lesson.teacher, arm = root.getObjectByName('Arm.R') || root.getObjectByName('ArmR');
    if (arm) {
        lesson.armRest ||= arm.quaternion.clone();
        arm.quaternion.copy(lesson.armRest);
        if (beat.speaker?.includes('토리')) {
            safeLessonPoint(root, arm, lesson.armRest, new Vector3(0,210,-280));
        }
    }
    if (!beat.text || !beat.speaker?.includes('토리')) return;
    drawLessonText(lesson.training.room.userData.marketBoard.display, beat.text);
}

export function drawLessonText(display, message) {
    const { ctx, canvas } = display;
    ctx.fillStyle = '#fff6df'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#395344'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '500 64px sans-serif'; ctx.fillText('토리의 주식 교실', 65, 40);
    ctx.font = '500 44px sans-serif';
    const chars = [...message], lines = []; let line = '';
    for (const char of chars) {
        if (ctx.measureText(line + char).width > 1590) { lines.push(line); line = ''; }
        line += char;
    }
    if (line) lines.push(line);
    lines.slice(0, 6).forEach((text, i) => ctx.fillText(text, 65, 150 + i * 61));
    ctx.fillStyle = '#79846a'; ctx.font = '500 30px sans-serif';
    ctx.fillText('주식 기초 · 화면의 내용과 토리의 설명을 함께 살펴보세요', 65, 580);
    display.texture.needsUpdate = true;
}
