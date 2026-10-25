// Flat sector pictograms; decorative only, company identity remains in readable text.
const sectors = {
    IT: ['#638fc9', 'IT', '<rect x="11" y="11" width="26" height="26" rx="4"/><path d="M18 3v8m12-8v8M18 37v8m12-8v8M3 18h8m-8 12h8m26-12h8m-8 12h8" fill="none" stroke="currentColor" stroke-width="3"/>'],
    Entertainment: ['#d96799', '엔터', '<path d="m24 5 6 12 13 2-9 9 2 14-12-7-12 7 2-14-9-9 13-2Z"/>'],
    Infrastructure: ['#4f9ca1', '인프라', '<path d="M5 20h38v7H5Z M10 7h5v34h-5Zm23 0h5v34h-5Z"/><path d="M12 13q12 14 23 0" fill="none" stroke="currentColor" stroke-width="3"/>'],
    Bio: ['#76a75d', '바이오', '<rect x="17" y="6" width="14" height="36" rx="3"/><rect x="6" y="17" width="36" height="14" rx="3"/>'],
    Aerospace: ['#6b92d0', '우주', '<circle cx="24" cy="24" r="10"/><ellipse cx="24" cy="24" rx="23" ry="8" transform="rotate(-35 24 24)" fill="none" stroke="currentColor" stroke-width="3"/>'],
    Retail: ['#dba44e', '유통', '<rect x="8" y="14" width="32" height="29" rx="4"/><path d="M16 15V11a8 8 0 0 1 16 0v4" fill="none" stroke="currentColor" stroke-width="3"/>'],
    Energy: ['#63a579', '에너지', '<path d="M8 38C3 14 20 6 42 5c-1 22-11 37-31 34l20-20Z"/>'],
    Finance: ['#9775c8', '금융', '<rect x="5" y="10" width="38" height="29" rx="5"/><path d="M5 18h38" stroke="#9775c8" stroke-width="5"/><path d="M12 31h11" stroke="#9775c8" stroke-width="3"/>']
};
export const shortSectorName = key => sectors[key]?.[1] || key;
export function stockBrand(stock) {
    const [color, , shape] = sectors[stock.sector] || sectors.IT;
    return `<span class="stock-brand" style="--brand-color:${color}" aria-hidden="true"><svg viewBox="0 0 48 48" fill="currentColor" stroke-linecap="round" stroke-linejoin="round">${shape}</svg></span>`;
}
export const summarySprout = '<svg class="stock-summary-sprout" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M29 59V35C12 35 4 24 3 7c17 0 28 9 29 23C35 15 45 8 61 7c-1 18-11 29-26 29v23Z"/></svg>';
