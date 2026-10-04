// Initial room-shell preview. Movement and facility interactions are added separately.
import { cipherAlignedFloor } from './CipherAlignedFloor.js';
export class CipherLobby {
    constructor(container) {
        this.isOpen = false;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'cipher-lobby';
        this.dialog.setAttribute('aria-label', '사이퍼 증권 로비');
        this.dialog.innerHTML = `
            <div class="cipher-lobby-header"><span>사이퍼 증권 · 1층 로비</span>
                <button type="button" class="cipher-grid-toggle" aria-pressed="false">그리드 확인</button>
                <button type="button" class="cipher-lobby-exit">마을로 나가기 · Esc</button></div>
            <svg class="cipher-lobby-shell" viewBox="0 0 1554 1012" role="img" aria-label="사이퍼 증권 로비">
                <image href="./assets/interiors/cipher/cipher-lobby-shell-v8-wall-reference.png" width="1554" height="1012"/>
                ${cipherAlignedFloor()}
                <g transform="scale(0.9879211697 1.012)">
                <g class="cipher-check-grid" style="display:none" fill="none" stroke="#ff4488" stroke-width="1.5">
                    ${Array.from({length:17},(_,i)=> {
                        const x=783+i*44, y=284+i*22;
                        const a=783-i*44;
                        return `<path d="M${x} ${y} l-704 352 M${a} ${y} l704 352"/>`;
                    }).join('')}
                </g>
                </g>
            </svg>
            <p class="cipher-lobby-error" hidden>룸 이미지를 불러오지 못했습니다. 마을로 나가 다시 입장해 주세요.</p>`;
        container.appendChild(this.dialog);
        this.dialog.querySelector('.cipher-lobby-exit').addEventListener('click', () => this.close());
        this.dialog.querySelector('.cipher-grid-toggle').addEventListener('click', event => {
            const enabled = event.currentTarget.getAttribute('aria-pressed') !== 'true';
            event.currentTarget.setAttribute('aria-pressed', String(enabled));
            this.dialog.querySelector('.cipher-check-grid').style.display = enabled ? '' : 'none';
        });
        this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
        this.dialog.addEventListener('close', () => { this.isOpen = false; });
        const assetCheck = new Image();
        assetCheck.addEventListener('error', () => {
            this.dialog.querySelector('.cipher-lobby-error').hidden = false;
        });
        assetCheck.src = './assets/interiors/cipher/cipher-lobby-shell-v8-wall-reference.png';
        if (new URLSearchParams(location.search).get('cipherGrid') === '1') {
            requestAnimationFrame(() => {
                this.open();
                this.dialog.querySelector('.cipher-grid-toggle').click();
            });
        }
    }

    open() {
        if (this.isOpen) return;
        this.dialog.showModal();
        this.isOpen = true;
    }

    close() {
        this.dialog.close();
        this.isOpen = false;
    }
}
