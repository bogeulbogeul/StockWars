import { setUprightFacing } from './SomangiFacing.js';
import { conversationYaw } from './ConversationFacing.js';
import * as THREE from '../../../vendor/three/three.module.js';
import { loadCharacterAsset } from './SomangiAssets.js';
import { SomangiExpressions } from './SomangiExpressions.js';
import { moaAssetUrl, MOA_LEAF_MOODS } from '../../data/moaModels.js';
import { SOMANGI_HEIGHT, SOMANGI_REFERENCE_HEIGHT, SOMANGI_FOOT_Y } from '../../data/somangiModels.js';

const faceMoods = { happy: 'happy', sad: 'worried', curious: 'curious', surprised: 'surprised', calm: 'smile' };
export class MoaCharacter {
    constructor(scene, { x = 0, z = 0, rotation = 0, mood = 'calm' } = {}) {
        this.root = new THREE.Group(); this.root.name = 'moa-character';
        this.root.position.set(x, 0, z); setUprightFacing(this.root, rotation); scene.add(this.root);
        this.model = this.root; this.mood = mood;
        this.expressions = new SomangiExpressions(moaAssetUrl);
        this.ready = this.load();
    }
    async load() {
        const { model, animations } = await loadCharacterAsset(moaAssetUrl('moa.glb'));
        const scale = SOMANGI_HEIGHT / SOMANGI_REFERENCE_HEIGHT;
        model.scale.setScalar(scale); model.position.y = -SOMANGI_FOOT_Y * scale;
        model.traverse(ob => { if (ob.isMesh) ob.castShadow = ob.receiveShadow = true; });
        this.root.add(model); this.expressions.register(model);
        this.mixer = new THREE.AnimationMixer(model); this.actions = new Map();
        for (const mood of MOA_LEAF_MOODS) {
            const name = `Moa_Leaf_${mood[0].toUpperCase()}${mood.slice(1)}`;
            const clip = animations.find(item => item.name === name);
            if (!clip) throw new Error(`Missing Moa leaf clip: ${name}`);
            this.actions.set(mood, this.mixer.clipAction(clip));
        }
        this.animations = animations; await this.setMood(this.mood);
        return this;
    }
    async setMood(mood, expression = faceMoods[mood] || 'smile') {
        if (!MOA_LEAF_MOODS.includes(mood)) return false;
        this.mood = mood; this.root.userData.mood = mood;
        const next = this.actions?.get(mood);
        if (next && this.action !== next) {
            next.reset().setEffectiveWeight(1).fadeIn(.2).play();
            this.action?.fadeOut(.2); this.action = next;
        }
        return this.expressions.set(expression);
    }
    faceTarget(target) {
        this.conversationTarget = target;
        if (this.root.userData.seated) return;
        const yaw = conversationYaw(this.root, target);
        if (yaw !== null) setUprightFacing(this.root, yaw);
    }
    update(dt) {
        this.mixer?.update(Math.min(Math.max(dt || 0, 0), .1));
        if (this.conversationTarget && !this.root.userData.seated) this.faceTarget(this.conversationTarget);
    }
}
