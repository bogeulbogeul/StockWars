export function beginLogisticsSession(game) {
        game.isRunning = true;
        game.jobStartedAt = game.callbacks.getTime?.() ?? Date.now();
        game.lastTimestamp = performance.now();

        // 60-Second Countdown Timer
        if (game.timerInterval) clearInterval(game.timerInterval);
        game.timerInterval = setInterval(() => {
            if (!game.isRunning || game.isGameOver) return;
            game.timeLeft--;
            game.updateHUD();

            if (game.timeLeft <= 0) {
                game.timeLeft = 0;
                game.endSession();
            }
        }, 1000);

        if (game.animFrameId) cancelAnimationFrame(game.animFrameId);
        // Game Loop Animation Frame
        game.animFrameId = requestAnimationFrame(game.gameLoop.bind(game));
    }


export function cancelReadyCountdown(game) {
    clearTimeout(game.readyCountdownTimer);
    game.readyCountdownTimer = null;
    game.readyCountdownOverlay?.remove();
    game.readyCountdownOverlay = null;
}

export function startReadyCountdown(game) {
    cancelReadyCountdown(game);
    if (!game.isOpen || game.isGameOver) return;
    game.isRunning = false;
    clearInterval(game.timerInterval);
    game.keysHeld.clear();
    game.velocityX = 0;
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.style.cssText = 'position:absolute;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(5,15,28,.55);backdrop-filter:blur(3px);pointer-events:auto;color:#ffbe32;text-shadow:0 4px 30px rgba(255,174,0,.55);';
    const label = document.createElement('div');
    label.textContent = '준비하세요!';
    label.style.cssText = 'font-size:22px;font-weight:800;color:#fff;';
    const number = document.createElement('div');
    number.style.cssText = 'font-size:clamp(96px,15vw,160px);font-weight:900;line-height:1;';
    overlay.append(label, number);
    game.canvasArea.appendChild(overlay);
    game.readyCountdownOverlay = overlay;
    let remaining = 3;
    const tick = () => {
        if (!game.isOpen || game.isGameOver || game.parkTutorial?.isActive) {
            cancelReadyCountdown(game);
            return;
        }
        if (remaining === 0) {
            cancelReadyCountdown(game);
            game.keysHeld.clear();
            beginLogisticsSession(game);
            return;
        }
        number.textContent = String(remaining--);
        game.playTone(520, 0.1, 'triangle', 0.2);
        game.readyCountdownTimer = setTimeout(tick, 1000);
    };
    tick();
}
