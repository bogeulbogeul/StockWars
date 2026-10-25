import { el } from './View.js';

export function mountInvestmentCertificate(panel, { name = '', onReceive }) {
    panel.classList.add('residence-panel', 'investment-certificate-panel');
    panel.replaceChildren();
    const certificate = el('article', 'investment-certificate');
    certificate.setAttribute('aria-label', '포포리 마을 투자 자격증');
    certificate.innerHTML = `
        <div class="certificate-topline"><span>포포리 마을</span><span>첫 투자 교육 수료</span></div>
        <div class="certificate-emblem" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="m32 5 17 14-6 29H21l-6-29L32 5Z" fill="#dce8eb" stroke="#7896a2" stroke-width="2"/><path d="m32 5-7 14 7 29 7-29-7-14ZM15 19h34" stroke="#7896a2" stroke-width="2"/></svg></div>
        <p class="certificate-kicker">토리 증권사</p>
        <h1>투자 자격증</h1>
        <p class="certificate-english" aria-hidden="true">CERTIFICATE OF INVESTMENT</p>
        <div class="certificate-holder"><span>성명</span><strong></strong></div>
        <p class="certificate-statement">위 주민은 정보 읽기 교육을 마쳤으므로<br>포포리 마을의 투자 자격을 인정합니다.</p>
        <div class="certificate-lessons"><span>정보 읽기</span><strong>3문항 이수</strong><span>이용 범위</span><strong>마을 주식 거래</strong></div>
        <p class="certificate-motto">작은 관심으로 살피고,<br>자신의 판단으로 한 걸음씩.</p>
        <footer class="certificate-issuer"><div><span>발급 기관</span><strong>토리 증권사</strong><span>담당 토리</span></div><div class="certificate-seal" aria-label="토리 증권사 발급 인장">토리<br>증권</div></footer>`;
    certificate.querySelector('.certificate-holder strong').textContent = name;
    const button = el('button', 'certificate-receive', '투자 자격증 받기');
    button.type = 'button';
    button.addEventListener('click', () => onReceive());
    panel.append(certificate, button);
    button.focus({ preventScroll: true });
}
