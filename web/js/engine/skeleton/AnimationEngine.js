/**
 * AnimationEngine Class
 * Keyframe Timeline & Skeletal Motion Player.
 * Evaluates procedural math and keyframe interpolation curves to animate bones in real time.
 */
export class AnimationEngine {
    constructor(rig) {
        this.rig = rig;
        this.currentClip = 'idle'; // 'idle' | 'walk' | 'trade_win' | 'trade_loss' | 'typing'
        this.currentTime = 0;
        this.playbackSpeed = 1.0;
        this.isPlaying = true;

        // Transition blending
        this.blendFactor = 1.0;
        this.previousClip = null;
    }

    play(clipName, speed = 1.0) {
        if (this.currentClip !== clipName) {
            this.previousClip = this.currentClip;
            this.currentClip = clipName;
            this.currentTime = 0;
            this.blendFactor = 0.0;
        }
        this.playbackSpeed = speed;
        this.isPlaying = true;
    }

    update(deltaTimeSeconds) {
        if (!this.isPlaying) return;

        this.currentTime += deltaTimeSeconds * this.playbackSpeed;

        // Update transition blend
        if (this.blendFactor < 1.0) {
            this.blendFactor = Math.min(1.0, this.blendFactor + deltaTimeSeconds * 4.0);
        }

        this.evaluateClip(this.currentClip, this.currentTime);
        this.rig.updateTransforms();
    }

    evaluateClip(clipName, time) {
        switch (clipName) {
            case 'walk':
                this.evaluateWalk(time);
                break;
            case 'trade_win':
                this.evaluateTradeWin(time);
                break;
            case 'trade_loss':
                this.evaluateTradeLoss(time);
                break;
            case 'typing':
                this.evaluateTyping(time);
                break;
            case 'idle':
            default:
                this.evaluateIdle(time);
                break;
        }
    }

    /**
     * 1. IDLE CLIP (Natural Breathing, Head Tilt, Arm Sway)
     * Period: 2.4s loop
     */
    evaluateIdle(t) {
        const cycle = (t % 2.4) / 2.4;
        const phase = cycle * Math.PI * 2;

        const torso = this.rig.getBone('torso');
        const head = this.rig.getBone('head');
        const upperArmL = this.rig.getBone('upper_arm_L');
        const upperArmR = this.rig.getBone('upper_arm_R');
        const lowerArmL = this.rig.getBone('lower_arm_L');
        const lowerArmR = this.rig.getBone('lower_arm_R');
        const pelvis = this.rig.getBone('pelvis');

        // Reset
        this.rig.applyDirectionalOffsets(this.rig.direction);

        // Breathing on Torso & Pelvis
        if (torso) {
            torso.y += Math.sin(phase) * 1.8;
            torso.rotation = Math.sin(phase * 0.5) * 0.015;
        }
        if (pelvis) {
            pelvis.y += Math.sin(phase) * 0.5;
        }

        // Head secondary motion (slight delayed tilt)
        if (head) {
            head.y += Math.sin(phase) * 0.8;
            head.rotation = Math.cos(phase * 0.5) * 0.025;
        }

        // Arm subtle sway
        if (upperArmL) {
            upperArmL.rotation = 0.06 + Math.sin(phase - 0.5) * 0.04;
        }
        if (upperArmR) {
            upperArmR.rotation = -0.06 - Math.sin(phase - 0.5) * 0.04;
        }
        if (lowerArmL) {
            lowerArmL.rotation = 0.04 + Math.sin(phase) * 0.02;
        }
        if (lowerArmR) {
            lowerArmR.rotation = -0.04 - Math.sin(phase) * 0.02;
        }
    }

    /**
     * 2. WALK CLIP (4-beat rhythmic walk cycle)
     * Period: 0.8s loop
     */
    evaluateWalk(t) {
        const cycle = (t % 0.8) / 0.8;
        const phase = cycle * Math.PI * 2;

        this.rig.applyDirectionalOffsets(this.rig.direction);

        const root = this.rig.getBone('root');
        const torso = this.rig.getBone('torso');
        const head = this.rig.getBone('head');
        const pelvis = this.rig.getBone('pelvis');

        const thighL = this.rig.getBone('thigh_L');
        const calfL = this.rig.getBone('calf_L');
        const footL = this.rig.getBone('foot_L');

        const thighR = this.rig.getBone('thigh_R');
        const calfR = this.rig.getBone('calf_R');
        const footR = this.rig.getBone('foot_R');

        const upperArmL = this.rig.getBone('upper_arm_L');
        const lowerArmL = this.rig.getBone('lower_arm_L');
        const upperArmR = this.rig.getBone('upper_arm_R');
        const lowerArmR = this.rig.getBone('lower_arm_R');

        // Body bob up/down with each step (2 steps per cycle)
        if (root) {
            root.y = 205 + Math.abs(Math.sin(phase)) * 3.5 - 2;
        }
        if (torso) {
            torso.rotation = Math.sin(phase) * 0.04;
        }
        if (head) {
            head.rotation = -Math.sin(phase) * 0.03;
        }

        // Leg Alternating Swing
        const legSwing = Math.sin(phase) * 0.45;

        // Left Leg
        if (thighL) {
            thighL.rotation = legSwing;
        }
        if (calfL) {
            // Knee bends during backwards/recovery swing
            calfL.rotation = legSwing > 0 ? 0.05 : Math.abs(legSwing) * 0.9;
        }
        if (footL) {
            footL.rotation = -legSwing * 0.3;
        }

        // Right Leg (Opposite phase)
        if (thighR) {
            thighR.rotation = -legSwing;
        }
        if (calfR) {
            calfR.rotation = legSwing < 0 ? 0.05 : Math.abs(legSwing) * 0.9;
        }
        if (footR) {
            footR.rotation = legSwing * 0.3;
        }

        // Arm Counter-Swing
        if (upperArmL) {
            upperArmL.rotation = -legSwing * 0.8;
        }
        if (lowerArmL) {
            lowerArmL.rotation = 0.2 + Math.abs(legSwing) * 0.3;
        }

        if (upperArmR) {
            upperArmR.rotation = legSwing * 0.8;
        }
        if (lowerArmR) {
            lowerArmR.rotation = 0.2 + Math.abs(legSwing) * 0.3;
        }
    }

    /**
     * 3. TRADE WIN CLIP (Celebration / Profit Joy)
     * Period: 1.2s loop
     */
    evaluateTradeWin(t) {
        const cycle = (t % 1.2) / 1.2;
        const phase = cycle * Math.PI * 2;

        this.rig.applyDirectionalOffsets(this.rig.direction);

        const root = this.rig.getBone('root');
        const torso = this.rig.getBone('torso');
        const head = this.rig.getBone('head');
        const upperArmL = this.rig.getBone('upper_arm_L');
        const lowerArmL = this.rig.getBone('lower_arm_L');
        const upperArmR = this.rig.getBone('upper_arm_R');
        const lowerArmR = this.rig.getBone('lower_arm_R');

        // Joyful jump
        if (root) {
            const jumpHeight = Math.max(0, Math.sin(phase)) * 14;
            root.y = 205 - jumpHeight;
        }

        if (head) {
            head.rotation = Math.sin(phase * 2) * 0.08;
        }

        // Arms raised in victory (V sign / Hurray)
        if (upperArmL) {
            upperArmL.rotation = -2.2 + Math.sin(phase * 2) * 0.15;
        }
        if (lowerArmL) {
            lowerArmL.rotation = -0.5;
        }

        if (upperArmR) {
            upperArmR.rotation = 2.2 - Math.sin(phase * 2) * 0.15;
        }
        if (lowerArmR) {
            lowerArmR.rotation = 0.5;
        }
    }

    /**
     * 4. TRADE LOSS CLIP (Shock / Panic / Slump)
     * Period: 1.6s loop
     */
    evaluateTradeLoss(t) {
        const cycle = (t % 1.6) / 1.6;
        const phase = cycle * Math.PI * 2;

        this.rig.applyDirectionalOffsets(this.rig.direction);

        const root = this.rig.getBone('root');
        const torso = this.rig.getBone('torso');
        const head = this.rig.getBone('head');
        const upperArmL = this.rig.getBone('upper_arm_L');
        const lowerArmL = this.rig.getBone('lower_arm_L');
        const upperArmR = this.rig.getBone('upper_arm_R');
        const lowerArmR = this.rig.getBone('lower_arm_R');

        // Slumped down
        if (root) {
            root.y = 205 + 4;
        }
        if (torso) {
            torso.rotation = 0.05;
        }
        if (head) {
            // Head hanging down and shivering
            head.rotation = 0.25 + Math.sin(phase * 8) * 0.02;
            head.y += 4;
        }

        // Arms drooping down
        if (upperArmL) {
            upperArmL.rotation = 0.1 + Math.sin(phase * 6) * 0.02;
        }
        if (lowerArmL) {
            lowerArmL.rotation = 0.15;
        }

        if (upperArmR) {
            upperArmR.rotation = -0.1 - Math.sin(phase * 6) * 0.02;
        }
        if (lowerArmR) {
            lowerArmR.rotation = -0.15;
        }
    }

    /**
     * 5. TYPING CLIP (HTS Fast Trading)
     * Period: 0.5s loop
     */
    evaluateTyping(t) {
        const cycle = (t % 0.5) / 0.5;
        const phase = cycle * Math.PI * 2;

        this.rig.applyDirectionalOffsets(this.rig.direction);

        const torso = this.rig.getBone('torso');
        const head = this.rig.getBone('head');
        const upperArmL = this.rig.getBone('upper_arm_L');
        const lowerArmL = this.rig.getBone('lower_arm_L');
        const handL = this.rig.getBone('hand_L');

        const upperArmR = this.rig.getBone('upper_arm_R');
        const lowerArmR = this.rig.getBone('lower_arm_R');
        const handR = this.rig.getBone('hand_R');

        if (torso) {
            torso.rotation = 0.04;
        }
        if (head) {
            head.rotation = 0.1;
        }

        // Arms forward typing
        if (upperArmL) upperArmL.rotation = -0.7;
        if (lowerArmL) lowerArmL.rotation = 1.3 + Math.sin(phase) * 0.1;
        if (handL) handL.rotation = Math.cos(phase * 2) * 0.2;

        if (upperArmR) upperArmR.rotation = 0.7;
        if (lowerArmR) lowerArmR.rotation = -1.3 - Math.cos(phase) * 0.1;
        if (handR) handR.rotation = Math.sin(phase * 2) * 0.2;
    }
}
