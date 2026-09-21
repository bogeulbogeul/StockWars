import { Bone } from './Bone.js';

/**
 * SkeletonRig Class
 * Manages the hierarchical 2D chibi humanoid bone skeleton.
 * Configured for 240x340 canvas coordinates with 4-direction turnaround setups.
 */
export class SkeletonRig {
    constructor() {
        this.bones = new Map();
        this.direction = 'front'; // 'front' | 'left' | 'back' | 'right'

        this.buildRig();
    }

    buildRig() {
        this.bones.clear();

        // 1. Root (Center of mass / Pelvis origin)
        const root = new Bone('root', null, { x: 120, y: 205, length: 15 });
        this.bones.set('root', root);

        // 2. Pelvis
        const pelvis = new Bone('pelvis', root, { x: 0, y: 0, length: 12 });
        this.bones.set('pelvis', pelvis);

        // 3. Torso (Spine / Upper Body / Breath anchor: World Y = 175)
        const torso = new Bone('torso', root, { x: 0, y: -30, length: 28 });
        this.bones.set('torso', torso);

        // 4. Head & Neck (Pivot at neck base: World Y = 154)
        const head = new Bone('head', torso, { x: 0, y: -21, pivotX: 0.5, pivotY: 0.99, length: 48 });
        this.bones.set('head', head);

        // 5. Left Arm (Shoulder -> UpperArm -> LowerArm -> Hand)
        const leftShoulder = new Bone('shoulder_L', torso, { x: -24, y: -14, length: 10 });
        const leftUpperArm = new Bone('upper_arm_L', leftShoulder, { x: 0, y: 0, pivotX: 0.9, pivotY: 0.15, length: 28 });
        const leftLowerArm = new Bone('lower_arm_L', leftUpperArm, { x: -4, y: 28, pivotX: 0.9, pivotY: 0.15, length: 26 });
        const leftHand = new Bone('hand_L', leftLowerArm, { x: -4, y: 26, pivotX: 0.9, pivotY: 0.2, length: 14 });
        this.bones.set('shoulder_L', leftShoulder);
        this.bones.set('upper_arm_L', leftUpperArm);
        this.bones.set('lower_arm_L', leftLowerArm);
        this.bones.set('hand_L', leftHand);

        // 6. Right Arm (Shoulder -> UpperArm -> LowerArm -> Hand)
        const rightShoulder = new Bone('shoulder_R', torso, { x: 24, y: -14, length: 10 });
        const rightUpperArm = new Bone('upper_arm_R', rightShoulder, { x: 0, y: 0, pivotX: 0.1, pivotY: 0.15, length: 28 });
        const rightLowerArm = new Bone('lower_arm_R', rightUpperArm, { x: 4, y: 28, pivotX: 0.1, pivotY: 0.15, length: 26 });
        const rightHand = new Bone('hand_R', rightLowerArm, { x: 4, y: 26, pivotX: 0.1, pivotY: 0.2, length: 14 });
        this.bones.set('shoulder_R', rightShoulder);
        this.bones.set('upper_arm_R', rightUpperArm);
        this.bones.set('lower_arm_R', rightLowerArm);
        this.bones.set('hand_R', rightHand);

        // 7. Left Leg (Hip -> Thigh -> Calf -> Foot)
        const leftHip = new Bone('hip_L', pelvis, { x: -14, y: 25, length: 8 });
        const leftThigh = new Bone('thigh_L', leftHip, { x: 0, y: 0, pivotX: 0.5, pivotY: 0.1, length: 40 });
        const leftCalf = new Bone('calf_L', leftThigh, { x: -2, y: 40, pivotX: 0.5, pivotY: 0.1, length: 40 });
        const leftFoot = new Bone('foot_L', leftCalf, { x: -1, y: 40, pivotX: 0.5, pivotY: 0.15, length: 16 });
        this.bones.set('hip_L', leftHip);
        this.bones.set('thigh_L', leftThigh);
        this.bones.set('calf_L', leftCalf);
        this.bones.set('foot_L', leftFoot);

        // 8. Right Leg (Hip -> Thigh -> Calf -> Foot)
        const rightHip = new Bone('hip_R', pelvis, { x: 14, y: 25, length: 8 });
        const rightThigh = new Bone('thigh_R', rightHip, { x: 0, y: 0, pivotX: 0.5, pivotY: 0.1, length: 40 });
        const rightCalf = new Bone('calf_R', rightThigh, { x: 2, y: 40, pivotX: 0.5, pivotY: 0.1, length: 40 });
        const rightFoot = new Bone('foot_R', rightCalf, { x: 1, y: 40, pivotX: 0.5, pivotY: 0.15, length: 16 });
        this.bones.set('hip_R', rightHip);
        this.bones.set('thigh_R', rightThigh);
        this.bones.set('calf_R', rightCalf);
        this.bones.set('foot_R', rightFoot);

        this.rootBone = root;
        this.updateTransforms();
    }

    getBone(name) {
        return this.bones.get(name);
    }

    setDirection(dir) {
        this.direction = dir;
        this.applyDirectionalOffsets(dir);
        this.updateTransforms();
    }

    applyDirectionalOffsets(dir) {
        // Reset bones to base rest pose first
        for (const bone of this.bones.values()) {
            bone.resetToRestPose();
        }

        const head = this.bones.get('head');
        const shoulderL = this.bones.get('shoulder_L');
        const shoulderR = this.bones.get('shoulder_R');
        const hipL = this.bones.get('hip_L');
        const hipR = this.bones.get('hip_R');

        if (dir === 'left') {
            // Profile view facing left
            head.x = 2;
            shoulderL.x = -6; // Left shoulder closer in foreground
            shoulderR.x = 10; // Right shoulder behind body
            hipL.x = -4;
            hipR.x = 6;
        } else if (dir === 'right') {
            // Profile view facing right
            head.x = -2;
            shoulderL.x = -10; // Left shoulder behind body
            shoulderR.x = 6;  // Right shoulder in foreground
            hipL.x = -6;
            hipR.x = 4;
        } else if (dir === 'back') {
            // Symmetrical back view
            shoulderL.x = -22;
            shoulderR.x = 22;
            hipL.x = -12;
            hipR.x = 12;
        } else {
            // Front view
            shoulderL.x = -22;
            shoulderR.x = 22;
            hipL.x = -12;
            hipR.x = 12;
        }
    }

    updateTransforms() {
        if (this.rootBone) {
            this.rootBone.updateWorldTransform();
        }
    }
}
