export const VILLAGE_NOTICES = [
    { id: 'packing', category: '구인', title: '작은 상자에 마음을 담아요', author: '봉봉 잡화점', color: 'peach', summary: '처음이어도 괜찮아요. 포장을 도와주실 분을 찾아요.', paragraphs: ['잡화점 상품을 상자에 차곡차곡 담아주실 분을 찾고 있어요.', '상품이 서로 겹치지 않도록 빈틈없이 넣어주세요. 서두르지 않아도 괜찮아요. 처음이라면 봉봉이 방법을 알려드릴게요.', '관심이 있다면 봉봉 잡화점에 들러주세요.'], location: '봉봉 잡화점 · 마을 동쪽' },
    { id: 'welcome', category: '마을 안내', title: '포포리에 오신 걸 환영해요', author: '모아 안내소', color: 'sage', summary: '낯선 첫날, 모아와 함께 천천히 시작해요.', paragraphs: ['새로운 곳에서의 첫걸음은 누구에게나 낯설지요.', '마을 생활이 궁금하다면 안내소의 모아에게 말을 걸어주세요. 한 걸음씩 둘러보다 보면 익숙한 풍경이 될 거예요.'], location: '모아 안내소 · 게시판 옆' },
    { id: 'rest', category: '생활 안내', title: '잠깐 쉬어가도 괜찮아요', author: '마을 안내', color: 'butter', summary: '산책길의 벤치에서 마을 풍경을 바라보세요.', paragraphs: ['마을 곳곳의 빈 벤치는 누구나 이용할 수 있어요.', '가까이 다가가 E키나 앉기 버튼을 눌러보세요. 다시 E키를 누르거나 이동키를 누르면 일어날 수 있어요.'], location: '광장과 산책길의 빈 벤치' }
];

export class VillageBoard {
    constructor({ onOpen = () => {} } = {}) {
        this.onOpen = onOpen;
        this.dialog = document.createElement('dialog');
        this.dialog.className = 'village-board';
        this.dialog.setAttribute('aria-labelledby', 'village-board-title');
        this.dialog.innerHTML = `<header class="board-header"><div><p>포포리 · VILLAGE NOTICE</p><h1 id="village-board-title">우리 마을 게시판</h1><span>작은 소식이 모이는 곳</span></div><button type="button" class="board-close" aria-label="게시판 닫기">×</button></header><div class="board-layout"><nav aria-label="게시글 목록" class="board-list"></nav><article class="board-preview" aria-live="polite"></article></div><footer class="board-footer"><span>포포리 마을의 오늘을 함께 나눠요.</span><span>Esc 닫기</span></footer>`;
        this.list = this.dialog.querySelector('.board-list');
        this.preview = this.dialog.querySelector('.board-preview');
        this.reader = document.createElement('dialog');
        this.reader.className = 'board-reader';
        this.reader.setAttribute('aria-label', '공고문 크게 보기');
        this.reader.innerHTML = '<button type="button" class="board-back">← 게시판으로</button><article class="board-paper"></article>';
        this.paper = this.reader.querySelector('article');
        this.reader.querySelector('.board-back').onclick = () => this.reader.close();
        this.reader.addEventListener('click', event => { if (event.target === this.reader) this.reader.close(); });
        document.body.append(this.reader);
        for (const notice of VILLAGE_NOTICES) {
            const button = document.createElement('button'); button.type = 'button';
            button.className = `board-note ${notice.color}`;
            button.innerHTML = `<span class="board-category">${notice.category}</span><strong>${notice.title}</strong><span class="board-summary">${notice.summary}</span><small>${notice.author} ↗</small>`;
            button.onclick = () => this.select(notice.id, { expand: false });
            button.dataset.notice = notice.id; this.list.append(button);
        }
        this.dialog.querySelector('.board-close').onclick = () => this.close();
        this.dialog.addEventListener('click', event => { if (event.target === this.dialog) { const r = this.dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) this.close(); } });
        // Keep game hotkeys from consuming dialog navigation and native Escape.
        window.addEventListener('keydown', event => {
            if (!this.dialog.open) return;
            if (event.code === 'Escape') { event.preventDefault(); if (this.reader.open) this.reader.close(); else this.close(); }
            event.stopImmediatePropagation();
        }, true);
        document.body.append(this.dialog);
    }
    select(id, { expand = true } = {}) {
        const notice = VILLAGE_NOTICES.find(item => item.id === id) || VILLAGE_NOTICES[0];
        for (const button of this.list.children) button.setAttribute('aria-pressed', String(button.dataset.notice === notice.id));
        this.paper.innerHTML = `<span class="board-category">${notice.category}</span><h2>${notice.title}</h2><p class="board-author">${notice.author}</p><div class="board-body">${notice.paragraphs.map(text => `<p>${text}</p>`).join('')}</div><p class="board-location">⌖ ${notice.location}</p>`;
        if (notice.id === 'packing' && this.onRead) {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'board-read'; button.textContent = '공고를 읽었어요 · 잡화점으로';
            button.onclick = () => { const done = this.onRead; this.onRead = null; this.close(); done(); };
            this.paper.append(button);
        }
        this.preview.innerHTML = this.paper.innerHTML;
        const read = this.preview.querySelector('.board-read');
        if (read) read.onclick = () => { const done = this.onRead; this.close(); done?.(); };
        const enlarge = document.createElement('button'); enlarge.type = 'button';
        enlarge.className = 'board-enlarge'; enlarge.textContent = '공고문 크게 보기 ↗';
        enlarge.onclick = () => this.select(notice.id);
        this.preview.append(enlarge);
        if (expand && !this.reader.open) this.reader.showModal();
        this.reader.scrollTop = 0;
    }
    open({ onRead = null } = {}) {
        if (this.dialog.open) return;
        this.onRead = onRead; this.onOpen(); this.select('packing', { expand: false }); this.dialog.showModal();
    }
    close() { this.onRead = null; this.reader.close(); this.dialog.close(); }
}
