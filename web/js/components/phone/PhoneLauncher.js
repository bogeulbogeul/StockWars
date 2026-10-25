// Shared 2D button artwork: the same rounded charcoal handset, display off.
export function decoratePhoneLauncher(button) {
    button.classList.add('phone-launcher');
    button.setAttribute('aria-label', '스마트폰 열기');
    button.title = '스마트폰 열기 (P)';
    // Space belongs to world jumping, even when the launcher retains focus.
    // Cancel its native keyup click; Enter remains available for keyboard access.
    button.addEventListener('keyup', event => {
        if (event.code === 'Space') event.preventDefault();
    });
    button.innerHTML = `<svg viewBox="0 0 72 112" aria-hidden="true" focusable="false">
        <rect x="5" y="30" width="4" height="22" rx="2" fill="#30312f"/>
        <rect x="63" y="37" width="4" height="17" rx="2" fill="#30312f"/>
        <rect x="8" y="3" width="56" height="106" rx="13" fill="#30312f" stroke="#171916" stroke-width="2"/>
        <rect x="12" y="7" width="48" height="98" rx="10" fill="#272925"/>
        <rect x="29" y="9" width="14" height="2.5" rx="1.25" fill="#10120f"/>
        <rect x="12" y="14" width="48" height="89" rx="8" fill="#0e100e" stroke="#1a1c18" stroke-width="1"/>
    </svg>`;
    return button;
}
