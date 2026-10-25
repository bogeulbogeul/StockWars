import { Box3, Sphere, Vector3 } from '../../../vendor/three/three.module.js';
import { loadEatingFood } from './SomangiFoodAssets.js';

export function hideEmbeddedBread(model) {
    const bread = model.getObjectByName('bread_Prop');
    if (bread) bread.visible = false;
}
// Derive a conservative head envelope from the actual head-weighted vertices.
export function createEatingHeadGuard(model) {
    const head = model.getObjectByName('Head');
    if (!head) throw new Error('먹기 모델의 머리 본을 찾지 못했어요.');
    model.updateMatrixWorld(true);
    const points = [], bounds = new Box3(), point = new Vector3();
    model.traverse(mesh => {
        if (!mesh.isSkinnedMesh) return;
        const index = mesh.skeleton.bones.indexOf(head);
        const ids = mesh.geometry.attributes.skinIndex, weights = mesh.geometry.attributes.skinWeight;
        if (index < 0 || !ids || !weights) return;
        for (let i = 0; i < ids.count; i++) {
            let weight = 0;
            for (let j = 0; j < 4; j++) if (ids.getComponent(i, j) === index) weight += weights.getComponent(i, j);
            if (weight < .95) continue;
            mesh.getVertexPosition(i, point); mesh.localToWorld(point); head.worldToLocal(point);
            points.push(point.clone()); bounds.expandByPoint(point);
        }
    });
    if (!points.length) throw new Error('먹기 모델의 머리 영역을 측정하지 못했어요.');
    const center = bounds.getCenter(new Vector3());
    const radius = Math.max(...points.map(p => p.distanceTo(center)));
    return () => new Sphere(center.clone(), radius).applyMatrix4(head.matrixWorld);
}
export function keepFoodOutsideHead(position, head, foodRadius, forward) {
    // Keep it in front of the face as well as outside its surface.
    const delta = position.clone().sub(head.center);
    const ahead = delta.dot(forward);
    if (ahead < 0) position.addScaledVector(forward, -ahead);
    delta.subVectors(position, head.center);
    const clearance = head.radius + foodRadius + 1.2;
    if (delta.length() < clearance) {
        const up = delta.clone().addScaledVector(forward, -delta.dot(forward));
        const front = Math.sqrt(Math.max(0, clearance * clearance - up.lengthSq()));
        position.copy(head.center).add(up).addScaledVector(forward, front);
    }
    return position;
}
export class SomangiEatingFood {
    constructor(player) { this.player = player; }
    start(id, provided) {
        this.clear(); const token = {}; this.token = token;
        this.ready = (async () => {
            const item = provided || await loadEatingFood(id);
            if (this.token !== token || this.player.state !== 'eat') return;
            const variant = this.player.variants.get('eat');
            hideEmbeddedBread(variant.model);
            this.guard ||= createEatingHeadGuard(variant.model);
            this.item = item; this.initial = item.parent ? item.position.clone() : null;
            this.scale = item.scale.clone(); this.radius = new Box3().setFromObject(item).getBoundingSphere(new Sphere()).radius;
            this.player.root.parent.add(item); item.userData.foodId = id;
            this.update();
        })().catch(error => { console.error('Eating food:', error); this.player.setState('idle'); });
    }
    update() {
        if (!this.item) return;
        const player = this.player, variant = player.variants.get('eat');
        if (player.state !== 'eat') { this.clear(); return; }
        player.root.updateMatrixWorld(true);
        const t = variant.action.time / variant.action.getClip().duration;
        const amount = t < .6 ? 1 : Math.max(0, 1 - (t - .6) / .25);
        this.item.scale.copy(this.scale).multiplyScalar(amount);
        const anchor = variant.model.getObjectByName('bread_Prop');
        const target = anchor.getWorldPosition(new Vector3());
        const forward = new Vector3(0, 0, 1).transformDirection(player.root.matrixWorld);
        keepFoodOutsideHead(target, this.guard(), this.radius * amount, forward);
        // Approach from the receiving hand without crossing the head.
        if (this.initial && t < .16) target.lerpVectors(this.initial, target, Math.min(1, t / .16));
        keepFoodOutsideHead(target, this.guard(), this.radius * amount, forward);
        this.item.position.copy(target);
        this.item.quaternion.copy(player.root.quaternion);
    }
    clear() { this.token = null; this.item?.removeFromParent(); this.item = null; }
}
