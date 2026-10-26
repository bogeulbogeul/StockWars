import * as THREE from '../../../vendor/three/three.module.js';
import { GROUND_PROJECTION as P } from '../../data/townModelBuildings.js';
import { setInteractionGuidance } from '../town3d/GuidanceCard.js';

const books = new Set();
const chapters = [
    ['첫걸음', '포포리 생활 가이드', ['지도 옆에서 잠시 쉬며 마을 생활을 살펴보세요. 가이드북은 이곳에서 언제든 다시 읽을 수 있어요.', 'WASD로 걷고 Shift로 달려요. Space로 짧게 점프할 수 있어요. 건물은 문 앞까지 걸어가 드나들어요.', '가까운 곳에 표시되는 키 안내나 화면 버튼을 누르면 이야기를 하거나 물건을 살펴볼 수 있어요.']],
    ['마을 시설', '어디로 가볼까요?', ['모아 안내소에서는 마을 생활을 안내받아요. 지도와 가이드북도 이곳에 있어요.', '차곡 은행에서는 계좌를 개설하고, 토리 증권사에서는 투자 자격시험과 투자 안내를 받아요.', '봉봉 잡화점에서는 물건을 구입하고 포장 일을 할 수 있어요. 마을 게시판에서는 공고를 읽을 수 있어요.', '아직 실내가 마련되지 않은 건물도 있어요. 실제 화면에 표시되는 이용 안내를 따라주세요.']],
    ['주식', '천천히 시작하는 투자', ['투자 자격증을 받은 뒤 스마트폰의 주식 앱을 이용해요. 시험은 3문항이며, 모두 맞히면 분석력 2, 그 외에는 분석력 1로 시작해요. 자격증은 정답 수와 관계없이 받아요.', '주식 앱의 홈·주식 거래·내 계좌·거래 내역에서 시장과 보유 내역을 살펴보세요. 주문 전에는 가격과 수량, 사용할 현금을 확인해요.', '리프 종합지수와 새싹 성장지수는 서로 다른 구성의 가격 흐름을 보여줘요. 지수 상승이 모든 종목의 상승을 뜻하지는 않아요.']],
    ['소식과 분석', '소식을 읽고 해석해요', ['스마트폰 소식 앱에서 기사를 읽고 관련 종목을 살펴볼 수 있어요.', '보유한 소식 봉투의 해석 확인 퀴즈를 맞히면 분석력 숙련도가 쌓여요. 같은 사건의 보상은 한 번만 받아요. 틀려도 다시 도전할 수 있어요.', '소식의 내용과 가격 흐름을 함께 살펴보세요. 읽었다는 이유만으로 보상이 지급되거나 주가가 확정되는 것은 아니에요.']],
    ['생활과 조작', '쉬어가도 괜찮아요', ['빈 벤치와 이용 가능한 실내 의자 가까이에서 E키 또는 앉기 버튼을 눌러 쉬어요. E키나 이동키로 다시 일어날 수 있어요.', '스마트폰을 받은 뒤 P키로 열 수 있어요. 설정 앱에서는 음악 켜기·끄기와 음량을 조절해요.', '가이드북은 Esc나 닫기 버튼으로 덮어요. 읽기 전 서 있던 자리에서 그대로 이어갈 수 있어요.']]
];

export function routeInformationGuideKey(event) {
    for (const book of books) if (book.handleKeyDown(event)) return true;
    return false;
}

export class InformationGuidebook {
    constructor(owner) {
        this.owner = owner;
        const map = owner.room.getObjectByName('Popori_Colored_Pencil_Map_No_Text');
        map.traverse(object => { for (const material of [object.material].flat()) if (material?.map) this.mapTexture = material.map; });
        this.bounds = new THREE.Box3().setFromObject(map);
        if (!document.querySelector('link[data-information-guide]')) {
            const link = document.createElement('link'); link.rel = 'stylesheet';
            link.href = new URL('../../../css/information-guidebook.css?v=map-choice-v3', import.meta.url).href;
            link.dataset.informationGuide = ''; document.head.append(link);
        }
        this.button = document.createElement('button');
        this.button.className = 'information-guide-action'; this.button.hidden = true;
        this.button.type = 'button'; this.button.setAttribute('aria-keyshortcuts', 'F');
        setInteractionGuidance(this.button, 'F', '지도·가이드북 살펴보기');
        (window.stockWarsExhibition?.view?.root || owner.layer).append(this.button);
        this.button.onclick = () => this.open();
        this.dialog = document.createElement('dialog'); this.dialog.className = 'information-guidebook';
        this.dialog.setAttribute('aria-label', '포포리 생활 가이드북');
        this.dialog.innerHTML = `<header><div class="guide-brand"><span class="guide-emblem" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M24 37V23"/><path d="M24 25C11 26 9 15 11 11c10-1 16 6 13 14ZM24 23C23 12 31 7 38 9c2 9-4 16-14 14Z"/></svg></span><div><small>모아 안내소 · POPO RI</small><h1>포포리 생활 가이드북</h1></div></div><button type="button" aria-label="가이드북 닫기">×</button></header><div class="guide-spread"><aside><div class="guide-index-title"><small>CONTENTS</small><h2>어떤 이야기가 궁금한가요?</h2></div><nav aria-label="가이드북 목차"></nav><p class="guide-index-note">처음이라도 괜찮아요.<br>한 장씩, 천천히 알아가요.</p></aside><section class="guide-right-page"><article tabindex="0"></article><div class="guide-pagination"><button type="button" class="guide-previous" aria-label="이전 페이지">← 이전</button><span class="guide-page-number" aria-live="polite"></span><button type="button" class="guide-next" aria-label="다음 페이지">다음 →</button></div></section></div><footer><span>모아의 작은 안내서 · 지도 옆에 늘 있어요</span><span><kbd>Esc</kbd> 책 덮기</span></footer>`;
        const nav = this.dialog.querySelector('nav');
        chapters.forEach(([label], i) => {
            const button = document.createElement('button'); button.type = 'button';
            const number = document.createElement('span'); number.className = 'guide-chapter-number'; number.textContent = String(i + 1).padStart(2, '0');
            const text = document.createElement('span'); text.textContent = label;
            const arrow = document.createElement('span'); arrow.className = 'guide-chapter-arrow'; arrow.textContent = '›'; arrow.setAttribute('aria-hidden', 'true');
            button.append(number, text, arrow);
            button.onclick = () => this.select(i); nav.append(button);
        });
        this.dialog.querySelector('.guide-previous').onclick = () => this.select(this.index - 1);
        this.dialog.querySelector('.guide-next').onclick = () => this.select(this.index + 1);
        this.dialog.querySelector('header button').onclick = () => this.close();
        this.dialog.addEventListener('cancel', e => { e.preventDefault(); this.close(); });
        this.dialog.addEventListener('close', () => this.stopMovement());
        const back = document.createElement('button'); back.type = 'button'; back.className = 'guide-choice-back'; back.textContent = '← 선택으로';
        back.onclick = () => this.returnToChoice(); this.dialog.querySelector('footer').prepend(back);
        this.choice = document.createElement('dialog'); this.choice.className = 'information-map-choice';
        this.choice.setAttribute('aria-label', '지도와 가이드북 선택');
        this.choice.innerHTML = '<header><small>모아 안내소</small><button type="button" aria-label="선택창 닫기">×</button></header><h2>무엇을 살펴볼까요?</h2><p>마을을 둘러보기 전에 천천히 읽어보세요.</p><div class="information-map-options"><button type="button" data-read="map"><span aria-hidden="true">⌖</span><strong>지도 보기</strong><small>포포리 마을을 한눈에</small></button><button type="button" data-read="book"><span aria-hidden="true">▤</span><strong>가이드북 보기</strong><small>마을 생활과 조작 안내</small></button></div>';
        this.choice.querySelector('header button').onclick = () => this.close();
        this.choice.querySelector('[data-read="map"]').onclick = () => this.openMap();
        this.choice.querySelector('[data-read="book"]').onclick = () => { this.choice.close(); this.dialog.showModal(); };
        this.mapDialog = document.createElement('dialog'); this.mapDialog.className = 'information-map-reader';
        this.mapDialog.setAttribute('aria-label', '포포리 마을 지도');
        this.mapDialog.innerHTML = '<header><button type="button" class="guide-choice-back">← 선택으로</button><h2>포포리 마을 지도</h2><button type="button" aria-label="지도 닫기">×</button></header><div class="information-map-paper"><img alt="안내소 거치대에 비치된 포포리 마을 지도"></div><footer>지도를 살펴보고, 직접 걸어서 찾아가 보세요.</footer>';
        this.mapDialog.querySelector('.guide-choice-back').onclick = () => this.returnToChoice();
        this.mapDialog.querySelector('[aria-label="지도 닫기"]').onclick = () => this.close();
        for (const dialog of [this.choice, this.mapDialog]) {
            dialog.addEventListener('cancel', e => { e.preventDefault(); this.close(); });
            document.body.append(dialog);
        }
        document.body.append(this.dialog); books.add(this); this.select(0);
        window.addEventListener('keydown', e => this.handleKeyDown(e), true);
    }
    available() {
        const c = this.owner.controller, app = window.stockWarsExhibition;
        return this.owner.active && !this.owner.exitPending && !c.scriptedWalking && !c.busSeated
            && !this.owner.blocked() && (!app || (app.started && !app.scenes.tourActive
                && !app.scenes.receivingItem && !app.scenes.receivingApplication
                && (!app.busy || app.scenes.informationAwaitingTalk)));
    }
    near() {
        const c = this.owner.controller, b = this.bounds;
        const x = c.charPosX, z = c.charPosY / P;
        return Math.hypot(x - THREE.MathUtils.clamp(x, b.min.x, b.max.x),
            z - THREE.MathUtils.clamp(z, b.min.z, b.max.z)) < 90;
    }
    stopMovement() { this.owner.controller.keysHeld.clear(); this.owner.controller.isMoving = false; }
    open() {
        if (!this.available() || !this.near()) return;
        this.stopMovement(); this.button.hidden = true; this.choice.showModal();
    }
    openMap() {
        if (!this.choice.open) return;
        const image = this.mapDialog.querySelector('img');
        if (!image.src && this.mapTexture?.image) {
            const source = this.mapTexture.image, canvas = document.createElement('canvas');
            canvas.width = source.width; canvas.height = source.height;
            canvas.getContext('2d').drawImage(source, 0, 0); image.src = canvas.toDataURL('image/png');
        }
        this.choice.close(); this.mapDialog.showModal();
    }
    returnToChoice() { this.dialog.close(); this.mapDialog.close(); this.stopMovement(); this.choice.showModal(); }
    close() { this.dialog.close(); this.choice.close(); this.mapDialog.close(); this.stopMovement(); if (this.owner.active) this.owner.layer.focus({ preventScroll: true }); }
    select(index) {
        index = Math.max(0, Math.min(chapters.length - 1, index)); this.index = index;
        const [, title, paragraphs] = chapters[index];
        const article = this.dialog.querySelector('article');
        article.replaceChildren();
        const label = document.createElement('p'); label.className = 'guide-eyebrow'; label.textContent = `CHAPTER ${String(index + 1).padStart(2, '0')} · ${chapters[index][0]}`;
        const h = document.createElement('h2'); h.textContent = title; article.append(label, h);
        const intro = document.createElement('p'); intro.className = 'guide-lead'; intro.textContent = paragraphs[0]; article.append(intro);
        paragraphs.slice(1).forEach((text, i) => {
            const section = document.createElement('div'); section.className = 'guide-reading-note';
            const marker = document.createElement('span'); marker.className = 'guide-note-marker'; marker.textContent = String(i + 1).padStart(2, '0');
            const p = document.createElement('p'); p.textContent = text; section.append(marker, p); article.append(section);
        });
        this.dialog.querySelector('.guide-page-number').textContent = `${String(index + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
        this.dialog.querySelector('.guide-previous').disabled = index === 0;
        this.dialog.querySelector('.guide-next').disabled = index === chapters.length - 1;
        [...this.dialog.querySelector('nav').children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
        article.scrollTop = 0;
    }
    handleKeyDown(event) {
        if (this.dialog.open || this.choice.open || this.mapDialog.open) {
            event.stopImmediatePropagation();
            if (event.code === 'Escape') { event.preventDefault(); this.close(); }
            if (this.dialog.open && ['ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault(); this.select(this.index + (event.code === 'ArrowRight' ? 1 : -1));
            }
            return true;
        }
        if (event.code !== 'KeyF' || event.ctrlKey || event.metaKey || event.altKey
            || event.target?.closest?.('input,textarea,select,[contenteditable="true"]')
            || !this.available() || !this.near()) return false;
        event.preventDefault(); event.stopImmediatePropagation(); if (!event.repeat) this.open(); return true;
    }
    update() { this.button.hidden = !this.available() || !this.near(); return false; }
    onKeyRelease() {}
    tryEnter() { return false; }
    reset() { this.button.hidden = true; if (this.dialog.open || this.choice.open || this.mapDialog.open) this.close(); }
}
