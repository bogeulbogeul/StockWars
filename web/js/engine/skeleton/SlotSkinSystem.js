/**
 * SlotSkinSystem Class
 * Implements the Line Play & MapleStory style modular Slot-Attachment skin binding system.
 * Handles dynamic texture assignment (skin tone, hair style, clothing, face, accessories)
 * and direction-aware depth sorting (Z-ordering).
 */
export class SlotSkinSystem {
    constructor(rig) {
        this.rig = rig;
        this.slots = new Map();
        this.imageCache = new Map();

        // Customization State
        this.skinTone = 'fair'; // 'pale' | 'fair' | 'natural' | 'tan' | 'deep'
        this.hairStyle = 'short'; // 'short' | 'bob' | 'long' | 'ponytail' | 'none'
        this.topStyle = 'none'; // 'none' | 'white_shirt_short' | 'white_shirt_long'
        this.bottomStyle = 'none'; // 'none' | 'black_shorts' | 'black_slacks'
        this.faceStyle = 'default'; // 'default' | 'happy' | 'panic'
        this.accessory = 'none';

        this.initSlots();
    }

    initSlots() {
        this.slots.clear();

        // Register default slots mapped to specific bones
        this.registerSlot('hair_back', 'head', 1);
        this.registerSlot('arm_R_upper', 'upper_arm_R', 2);
        this.registerSlot('arm_R_lower', 'lower_arm_R', 3);
        this.registerSlot('hand_R', 'hand_R', 4);
        this.registerSlot('sleeve_R', 'upper_arm_R', 5);

        this.registerSlot('leg_R_thigh', 'thigh_R', 6);
        this.registerSlot('leg_R_calf', 'calf_R', 7);
        this.registerSlot('foot_R', 'foot_R', 8);
        this.registerSlot('pants_R', 'thigh_R', 9);

        this.registerSlot('leg_L_thigh', 'thigh_L', 10);
        this.registerSlot('leg_L_calf', 'calf_L', 11);
        this.registerSlot('foot_L', 'foot_L', 12);
        this.registerSlot('pants_L', 'thigh_L', 13);

        this.registerSlot('pelvis', 'pelvis', 14);
        this.registerSlot('pants_waist', 'pelvis', 15);

        this.registerSlot('torso', 'torso', 16);
        this.registerSlot('top_body', 'torso', 17);

        this.registerSlot('head_base', 'head', 18);
        this.registerSlot('face_decal', 'head', 19);
        this.registerSlot('hair_front', 'head', 20);

        this.registerSlot('arm_L_upper', 'upper_arm_L', 21);
        this.registerSlot('sleeve_L', 'upper_arm_L', 22);
        this.registerSlot('arm_L_lower', 'lower_arm_L', 23);
        this.registerSlot('hand_L', 'hand_L', 24);
        this.registerSlot('held_item_L', 'hand_L', 25);
    }

    registerSlot(name, boneName, defaultZIndex = 0) {
        this.slots.set(name, {
            name,
            boneName,
            zIndex: defaultZIndex,
            texture: null,
            textureUrl: null,
            visible: true,
            offsetX: 0,
            offsetY: 0,
            width: 0,
            height: 0,
            pivotX: 0.5,
            pivotY: 0.5
        });
    }

    setCustomization(config = {}) {
        if (config.skinTone !== undefined) this.skinTone = config.skinTone;
        if (config.hairStyle !== undefined) this.hairStyle = config.hairStyle;
        if (config.topStyle !== undefined) this.topStyle = config.topStyle;
        if (config.bottomStyle !== undefined) this.bottomStyle = config.bottomStyle;
        if (config.faceStyle !== undefined) this.faceStyle = config.faceStyle;

        this.updateSkinTextures();
    }

    /**
     * Resolves texture paths and updates all slot attachments
     */
    updateSkinTextures() {
        const dir = this.rig.direction;
        const v = '20260916_rig_v3';

        // 1. Head Base (120x105 exact crop, neck pivot at bottom center)
        this.setSlotTexture('head_base', `assets/character/rig/head_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.99,
            width: 120,
            height: 105
        });

        // 2. Face Decal (240x340 full overlay centered at neck pivot 120, 154)
        if (dir === 'back') {
            this.setSlotVisibility('face_decal', false);
        } else {
            this.setSlotVisibility('face_decal', true);
            this.setSlotTexture('face_decal', `assets/character/face_${this.faceStyle}_${dir}.png?v=${v}`, {
                pivotX: 0.50,
                pivotY: 0.4529,
                width: 240,
                height: 340
            });
        }

        // 3. Hair (240x340 full overlay attached to head bone pivot)
        if (this.hairStyle === 'none') {
            this.setSlotVisibility('hair_front', false);
            this.setSlotVisibility('hair_back', false);
        } else {
            this.setSlotVisibility('hair_front', true);
            this.setSlotVisibility('hair_back', true);
            this.setSlotTexture('hair_front', `assets/character/hair_${this.hairStyle}_${dir}.png?v=${v}`, {
                pivotX: 0.50,
                pivotY: 0.4529,
                width: 240,
                height: 340
            });
            this.setSlotTexture('hair_back', `assets/character/rig/hair_back_${this.hairStyle}_${dir}.png?v=${v}`, {
                pivotX: 0.50,
                pivotY: 0.4529,
                width: 240,
                height: 340
            });
        }

        // 4. Torso Body (70x51 exact crop, centered at torso pivot)
        this.setSlotTexture('torso', `assets/character/rig/torso_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.41,
            width: 70,
            height: 51
        });

        // 5. Pelvis Body (60x32 exact crop, hip origin)
        this.setSlotTexture('pelvis', `assets/character/rig/pelvis_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.30,
            width: 60,
            height: 32
        });

        // 6. Arms & Hands
        const isProfile = (dir === 'left' || dir === 'right');
        const upperW = isProfile ? 28 : 26;
        const lowerW = isProfile ? 26 : 24;
        const handW  = isProfile ? 24 : 22;

        // Left Arm (Viewer's Left)
        this.setSlotTexture('arm_L_upper', `assets/character/rig/arm_upper_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: isProfile ? 0.50 : 0.90,
            pivotY: 0.15,
            width: upperW,
            height: 34
        });
        this.setSlotTexture('arm_L_lower', `assets/character/rig/arm_lower_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: isProfile ? 0.50 : 0.90,
            pivotY: 0.15,
            width: lowerW,
            height: 30
        });
        this.setSlotTexture('hand_L', `assets/character/rig/hand_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: isProfile ? 0.50 : 0.90,
            pivotY: 0.20,
            width: handW,
            height: 22
        });

        // Right Arm (Viewer's Right)
        this.setSlotTexture('arm_R_upper', `assets/character/rig/arm_upper_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: isProfile ? 0.50 : 0.10,
            pivotY: 0.15,
            width: upperW,
            height: 34
        });
        this.setSlotTexture('arm_R_lower', `assets/character/rig/arm_lower_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: isProfile ? 0.50 : 0.10,
            pivotY: 0.15,
            width: lowerW,
            height: 30
        });
        this.setSlotTexture('hand_R', `assets/character/rig/hand_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: isProfile ? 0.50 : 0.10,
            pivotY: 0.20,
            width: handW,
            height: 22
        });

        // 7. Legs & Feet
        const thighW = isProfile ? 28 : 26;
        const calfW  = isProfile ? 26 : 24;
        const footW  = isProfile ? 30 : 28;

        this.setSlotTexture('leg_L_thigh', `assets/character/rig/leg_thigh_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.10,
            width: thighW,
            height: 46
        });
        this.setSlotTexture('leg_L_calf', `assets/character/rig/leg_calf_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.10,
            width: calfW,
            height: 46
        });
        this.setSlotTexture('foot_L', `assets/character/rig/foot_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.15,
            width: footW,
            height: 18
        });

        this.setSlotTexture('leg_R_thigh', `assets/character/rig/leg_thigh_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.10,
            width: thighW,
            height: 46
        });
        this.setSlotTexture('leg_R_calf', `assets/character/rig/leg_calf_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.10,
            width: calfW,
            height: 46
        });
        this.setSlotTexture('foot_R', `assets/character/rig/foot_${this.skinTone}_${dir}.png?v=${v}`, {
            pivotX: 0.50,
            pivotY: 0.15,
            width: footW,
            height: 18
        });

        this.updateDirectionZOrder(dir);
    }

    updateDirectionZOrder(dir) {
        if (dir === 'back') {
            // In back view: face decal hidden, back hair behind body, hands behind
            this.setSlotZ('hair_back', 25);
            this.setSlotZ('hair_front', 1);
            this.setSlotZ('head_base', 10);
            this.setSlotZ('torso', 15);
            this.setSlotZ('pelvis', 14);
        } else if (dir === 'left') {
            // Facing left: Left arm & leg in foreground, Right arm & leg in background
            this.setSlotZ('arm_R_upper', 1);
            this.setSlotZ('arm_R_lower', 2);
            this.setSlotZ('hand_R', 3);
            this.setSlotZ('leg_R_thigh', 4);
            this.setSlotZ('leg_R_calf', 5);
            this.setSlotZ('foot_R', 6);
            this.setSlotZ('pelvis', 10);
            this.setSlotZ('torso', 12);
            this.setSlotZ('leg_L_thigh', 14);
            this.setSlotZ('leg_L_calf', 15);
            this.setSlotZ('foot_L', 16);
            this.setSlotZ('head_base', 18);
            this.setSlotZ('face_decal', 19);
            this.setSlotZ('hair_front', 20);
            this.setSlotZ('arm_L_upper', 21);
            this.setSlotZ('arm_L_lower', 22);
            this.setSlotZ('hand_L', 23);
        } else if (dir === 'right') {
            // Facing right: Right arm & leg in foreground, Left arm & leg in background
            this.setSlotZ('arm_L_upper', 1);
            this.setSlotZ('arm_L_lower', 2);
            this.setSlotZ('hand_L', 3);
            this.setSlotZ('leg_L_thigh', 4);
            this.setSlotZ('leg_L_calf', 5);
            this.setSlotZ('foot_L', 6);
            this.setSlotZ('pelvis', 10);
            this.setSlotZ('torso', 12);
            this.setSlotZ('leg_R_thigh', 14);
            this.setSlotZ('leg_R_calf', 15);
            this.setSlotZ('foot_R', 16);
            this.setSlotZ('head_base', 18);
            this.setSlotZ('face_decal', 19);
            this.setSlotZ('hair_front', 20);
            this.setSlotZ('arm_R_upper', 21);
            this.setSlotZ('arm_R_lower', 22);
            this.setSlotZ('hand_R', 23);
        } else {
            // Front view (standard symmetrical layering)
            this.setSlotZ('hair_back', 1);
            this.setSlotZ('leg_L_thigh', 5);
            this.setSlotZ('leg_R_thigh', 5);
            this.setSlotZ('pelvis', 10);
            this.setSlotZ('torso', 12);
            this.setSlotZ('head_base', 18);
            this.setSlotZ('face_decal', 19);
            this.setSlotZ('hair_front', 20);
            this.setSlotZ('arm_L_upper', 21);
            this.setSlotZ('arm_R_upper', 21);
        }
    }

    setSlotZ(slotName, zIndex) {
        const slot = this.slots.get(slotName);
        if (slot) slot.zIndex = zIndex;
    }

    setSlotVisibility(slotName, visible) {
        const slot = this.slots.get(slotName);
        if (slot) slot.visible = visible;
    }

    setSlotTexture(slotName, url, transform = {}) {
        const slot = this.slots.get(slotName);
        if (!slot) return;

        slot.textureUrl = url;
        if (transform.pivotX !== undefined) slot.pivotX = transform.pivotX;
        if (transform.pivotY !== undefined) slot.pivotY = transform.pivotY;
        if (transform.width !== undefined) slot.width = transform.width;
        if (transform.height !== undefined) slot.height = transform.height;

        if (this.imageCache.has(url)) {
            slot.texture = this.imageCache.get(url);
        } else {
            const img = new Image();
            img.src = url;
            img.onload = () => {
                this.imageCache.set(url, img);
                if (slot.textureUrl === url) {
                    slot.texture = img;
                    if (!slot.width) slot.width = img.width;
                    if (!slot.height) slot.height = img.height;
                }
            };
        }
    }

    getSortedSlots() {
        return Array.from(this.slots.values()).sort((a, b) => a.zIndex - b.zIndex);
    }
}
