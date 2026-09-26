/**
 * LogisticsRenderer Module
 * Handles DOM character visual state, stacked boxes tower, and SVG truck cargo box rendering.
 */

export class LogisticsRenderer {
    static updateTruckBoxesGraphic(containerGroup, loadedCount) {
        let boxesSvg = '';
        const count = Math.min(loadedCount, 12);
        for (let i = 0; i < count; i++) {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const bx = 90 + col * 28;
            const by = 175 - row * 26;
            boxesSvg += `
                <g transform="translate(${bx}, ${by})">
                    <rect width="25" height="23" rx="2" fill="#d97706" stroke="#78350f" stroke-width="1.5" />
                    <line x1="0" y1="8" x2="25" y2="8" stroke="#b45309" stroke-width="1" />
                </g>
            `;
        }
        containerGroup.innerHTML = boxesSvg;
    }

    static updateCharacterVisual(game) {
        const { characterEl, charBoxTower, charStateBadge, truckTargetIndicator, boxesTargetIndicator, btnBottomStackMore } = game;
        if (!characterEl) return;
        characterEl.style.left = `${game.charX}px`;

        const scaleX = game.charFacing === 1 ? -1 : 1;
        characterEl.style.transform = `scaleX(${scaleX})`;

        const isNearPallet = game.charX >= game.boxesZoneX - 100;

        if (game.hasBox && game.carriedCount > 0) {
            characterEl.classList.add('carrying');

            if (game.lastRenderedStack !== game.carriedCount) {
                game.lastRenderedStack = game.carriedCount;
                let towerHtml = '';
                for (let i = 1; i <= game.carriedCount; i++) {
                    towerHtml += `
                        <div class="char-box-item level-${i}" id="charBoxLevel_${i}">
                            📦
                        </div>
                    `;
                }
                towerHtml += `
                    <div class="char-stack-badge stack-${game.carriedCount}">
                        ${game.carriedCount === game.maxStack ? '🔥 MAX STACK' : `x${game.carriedCount} STACK`}
                    </div>
                `;
                charBoxTower.innerHTML = towerHtml;
            }

            for (let i = 1; i <= game.carriedCount; i++) {
                const boxItem = document.getElementById(`charBoxLevel_${i}`);
                if (boxItem) {
                    const tilt = game.wobbleAngle * (0.8 + (i - 1) * 0.45);
                    boxItem.style.transform = `rotate(${tilt}deg)`;
                }
            }

            if (truckTargetIndicator) truckTargetIndicator.style.opacity = '1';

            if (game.carriedCount < game.maxStack) {
                if (isNearPallet) {
                    if (charStateBadge) {
                        charStateBadge.className = 'logistics-current-state-badge carrying';
                        charStateBadge.innerHTML = `<span>📦 ${game.carriedCount}단 운반 중 ➔ [W/버튼] 더 쌓기 or [A] 트럭 이동</span>`;
                    }
                    if (boxesTargetIndicator) {
                        boxesTargetIndicator.style.opacity = '1';
                        boxesTargetIndicator.innerHTML = `<span>📦 [W • Space] 상자 더 쌓기 (${game.carriedCount}/${game.maxStack}단)</span>`;
                    }
                } else {
                    if (charStateBadge) {
                        charStateBadge.className = 'logistics-current-state-badge carrying';
                        charStateBadge.innerHTML = `<span>📦 ${game.carriedCount}단 상자 운반 중 ➔ [A] 트럭으로 이동하세요!</span>`;
                    }
                    if (boxesTargetIndicator) {
                        boxesTargetIndicator.style.opacity = '0.6';
                        boxesTargetIndicator.innerHTML = `<span>📦 상자 파렛트 (${game.carriedCount}/${game.maxStack}단)</span>`;
                    }
                }
                if (btnBottomStackMore) {
                    btnBottomStackMore.disabled = false;
                    btnBottomStackMore.innerHTML = `<span>📦 상자 +1단 쌓기 [W / Space] (${game.carriedCount}/${game.maxStack})</span>`;
                }
            } else {
                if (charStateBadge) {
                    charStateBadge.className = 'logistics-current-state-badge carrying';
                    charStateBadge.innerHTML = `<span>🔥 ${game.maxStack}단 풀스택 운반 중! ➔ [A] 트럭으로 이동하세요!</span>`;
                }
                if (boxesTargetIndicator) {
                    boxesTargetIndicator.style.opacity = '0.4';
                    boxesTargetIndicator.innerHTML = `<span>🔥 ${game.maxStack}단 풀스택 완료! ➔ [A] 트럭 하차</span>`;
                }
                if (btnBottomStackMore) {
                    btnBottomStackMore.disabled = true;
                    btnBottomStackMore.innerHTML = `<span>🔥 최대 적재 완료 (4/4단)</span>`;
                }
            }
        } else {
            characterEl.classList.remove('carrying');
            if (game.lastRenderedStack !== 0) {
                game.lastRenderedStack = 0;
                charBoxTower.innerHTML = '';
            }
            if (truckTargetIndicator) truckTargetIndicator.style.opacity = '0.3';

            if (isNearPallet) {
                if (charStateBadge) {
                    charStateBadge.className = 'logistics-current-state-badge empty';
                    charStateBadge.innerHTML = '<span>📦 파렛트 도착! ➔ [W / Space] 키로 상자를 집으세요!</span>';
                }
                if (boxesTargetIndicator) {
                    boxesTargetIndicator.style.opacity = '1';
                    boxesTargetIndicator.innerHTML = '<span>📦 [W • Space] 상자 집기!</span>';
                }
            } else {
                if (charStateBadge) {
                    charStateBadge.className = 'logistics-current-state-badge empty';
                    charStateBadge.innerHTML = '<span>🖐️ 빈손 귀환 중 ➔ [D] 우측 파렛트로 이동!</span>';
                }
                if (boxesTargetIndicator) {
                    boxesTargetIndicator.style.opacity = '0.8';
                    boxesTargetIndicator.innerHTML = '<span>📦 상자 파렛트 [D로 이동]</span>';
                }
            }
            if (btnBottomStackMore) {
                btnBottomStackMore.disabled = false;
                btnBottomStackMore.innerHTML = `<span>📦 상자 집기 [W / Space]</span>`;
            }
        }
    }
}
