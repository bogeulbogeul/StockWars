export function createRumorQuizStamp() {
    const stamp = document.createElement('div');
    stamp.className = 'rumor-quiz-stamp';
    stamp.hidden = true;
    stamp.setAttribute('role', 'img');
    stamp.setAttribute('aria-label', '참 잘했어요 도장');
    const leaf = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    leaf.setAttribute('viewBox', '0 0 64 44');
    leaf.setAttribute('aria-hidden', 'true');
    leaf.innerHTML = '<path d="M32 38V19M32 29C14 31 9 18 10 9c14-1 24 5 22 20ZM32 23C31 7 43 3 54 5c0 14-8 23-22 18Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    const words = document.createElement('span');
    words.className = 'rumor-quiz-stamp-words';
    words.textContent = '참 잘했어요';
    const stars = document.createElement('span');
    stars.className = 'rumor-quiz-stamp-stars';
    stars.textContent = '✦  ✦  ✦';
    stars.setAttribute('aria-hidden', 'true');
    stamp.append(leaf, words, stars);
    return stamp;
}
