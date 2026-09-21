/**
 * Bone Class
 * Represents a single joint/bone in a 2D hierarchical skeletal rig.
 * Computes local and world transformation matrices (position, rotation, scale, pivot).
 */
export class Bone {
    constructor(name, parent = null, config = {}) {
        this.name = name;
        this.parent = parent;
        this.children = [];

        // Local Transform relative to parent
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.rotation = config.rotation || 0; // in radians
        this.scaleX = config.scaleX !== undefined ? config.scaleX : 1;
        this.scaleY = config.scaleY !== undefined ? config.scaleY : 1;

        // Base/Rest pose default offsets
        this.restX = this.x;
        this.restY = this.y;
        this.restRotation = this.rotation;
        this.restScaleX = this.scaleX;
        this.restScaleY = this.scaleY;

        // Pivot / Joint anchor point in local sprite coordinates (0.0 to 1.0)
        this.pivotX = config.pivotX !== undefined ? config.pivotX : 0.5;
        this.pivotY = config.pivotY !== undefined ? config.pivotY : 0.5;

        // World (Global) Transform Matrix components
        this.worldX = 0;
        this.worldY = 0;
        this.worldRotation = 0;
        this.worldScaleX = 1;
        this.worldScaleY = 1;

        // Length of bone for debugging visualizer
        this.length = config.length || 20;

        if (this.parent) {
            this.parent.children.push(this);
        }
    }

    resetToRestPose() {
        this.x = this.restX;
        this.y = this.restY;
        this.rotation = this.restRotation;
        this.scaleX = this.restScaleX;
        this.scaleY = this.restScaleY;
    }

    /**
     * Compute world transform recursively from parent down to leaves
     */
    updateWorldTransform() {
        if (!this.parent) {
            this.worldX = this.x;
            this.worldY = this.y;
            this.worldRotation = this.rotation;
            this.worldScaleX = this.scaleX;
            this.worldScaleY = this.scaleY;
        } else {
            const parentRot = this.parent.worldRotation;
            const parentScaleX = this.parent.worldScaleX;
            const parentScaleY = this.parent.worldScaleY;

            // Rotate local offset by parent rotation
            const cos = Math.cos(parentRot);
            const sin = Math.sin(parentRot);
            const rotatedX = (this.x * cos - this.y * sin) * parentScaleX;
            const rotatedY = (this.x * sin + this.y * cos) * parentScaleY;

            this.worldX = this.parent.worldX + rotatedX;
            this.worldY = this.parent.worldY + rotatedY;
            this.worldRotation = parentRot + this.rotation;
            this.worldScaleX = parentScaleX * this.scaleX;
            this.worldScaleY = parentScaleY * this.scaleY;
        }

        for (let i = 0; i < this.children.length; i++) {
            this.children[i].updateWorldTransform();
        }
    }
}
