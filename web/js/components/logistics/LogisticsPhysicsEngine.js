/**
 * LogisticsPhysicsEngine Module
 * Handles player movement physics, box carry weight penalty, balance wobble, and damage gauge.
 */

export class LogisticsPhysicsEngine {
    constructor(options = {}) {
        this.baseSpeed = 270;
        this.dashMultiplier = 1.75;
        this.minX = 180;
        this.maxX = 860;
        this.onCrash = options.onCrash || (() => {});
        this.onTurnShock = options.onTurnShock || (() => {});
    }

    updateMovement(state, dt) {
        if (state.stackCooldown > 0) {
            state.stackCooldown -= dt;
        }

        let moveDir = 0;
        if (state.keysHeld.has('left')) moveDir -= 1;
        if (state.keysHeld.has('right')) moveDir += 1;

        const isDashing = state.keysHeld.has('shift');
        let speed = this.baseSpeed * (isDashing ? this.dashMultiplier : 1.0) * (state.abilityBonuses?.speed || 1);

        if (state.hasBox && state.carriedCount > 0) {
            speed *= Math.max(0.60, 1.0 - (state.carriedCount * 0.09));
        } else {
            speed *= 1.15;
        }

        if (moveDir !== 0) {
            const oldFacing = state.charFacing;
            state.charFacing = moveDir;
            if (state.hasBox && oldFacing !== moveDir && Math.abs(state.velocityX) > 80) {
                const turnShock = 9.5 * state.carriedCount / (state.abilityBonuses?.control || 1);
                state.damageGauge = Math.min(100, state.damageGauge + turnShock);
                this.onTurnShock();
            }
        }

        const targetVel = moveDir * speed;
        state.velocityX += (targetVel - state.velocityX) * Math.min(1, dt * 12 * (state.abilityBonuses?.control || 1));
        state.charX += state.velocityX * dt;

        if (state.charX < this.minX) {
            state.charX = this.minX;
            state.velocityX = 0;
        }
        if (state.charX > this.maxX) {
            state.charX = this.maxX;
            state.velocityX = 0;
        }
    }

    updateSensitivity(state, dt) {
        if (!state.hasBox || state.carriedCount === 0) {
            state.damageGauge = Math.max(0, state.damageGauge - dt * 100);
            state.wobbleAngle = 0;
        } else {
            // Each extra box adds the same risk; preserve the four-box difficulty.
            const dashRisk = 42.5 * state.carriedCount * (state.abilityBonuses?.damage || 1);
            const walkRisk = 17.5 * state.carriedCount * (state.abilityBonuses?.damage || 1);
            const isMoving = Math.abs(state.velocityX) > 20;
            const isDashing = state.keysHeld.has('shift');

            if (isDashing && isMoving) {
                // Higher stacks tolerate less sustained sprinting.
                state.damageGauge += dt * dashRisk;
                state.wobbleAngle = Math.sin(performance.now() * 0.025) * (12 + state.carriedCount * 8);
            } else if (isMoving) {
                // Four boxes require stabilization even on the shortest pickup route.
                state.damageGauge += dt * walkRisk;
                state.wobbleAngle = Math.sin(performance.now() * 0.015) * (5 + state.carriedCount * 5);
            } else {
                // Standing still cooldown to stabilize
                const coolRate = 48 / Math.sqrt(state.carriedCount);
                state.damageGauge = Math.max(0, state.damageGauge - dt * coolRate);
                state.wobbleAngle = Math.sin(performance.now() * 0.008) * (2 + state.carriedCount * 1.5);
            }

            if (state.damageGauge >= 100) {
                state.damageGauge = 100;
                this.onCrash();
            }
        }
    }
}
