from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
path = root / 'web/js/components/inventory/RumorPopup.js'
text = path.read_text(encoding='utf-8')
text = text.replace("import { ITEM_RARITIES } from '../../data/inventoryData.js';\n", '')
text = re.sub(r'\s*<div class="rumor-icon-box"[^\n]+\n', '\n', text)
text = re.sub(r'\s*<div class="rumor-tags">[\s\S]*?</div>', '', text, count=1)
text = re.sub(r'\s*<!-- Target Enterprise Highlight Card -->[\s\S]*?(?=\s*<!-- Secret Document)', '', text, count=1)
text = re.sub(r'\s*<div class="rumor-reliability-note">[^\n]+', '', text, count=1)
text = re.sub(r'\s*<!-- Market Impact Effects -->[\s\S]*?(?=\n                    </div>\n\n                    <!-- Footer)', '', text, count=1)
obsolete = ['iconBox', 'rarityTag', 'stockCard', 'stockIcon', 'stockName', 'stockSector',
            'changeBadge', 'effectsList', 'oldPrice', 'newPrice', 'readBadge', 'depletionNote']
for name in obsolete:
    text = re.sub(r'^        this\.' + name + r' = .+\n', '', text, flags=re.M)
start = text.index('        if (isFirstRead) {', text.index('this.quizCard.reset(item, decoded);'))
end = text.index("        this.modal?.classList.remove('hidden');", start)
text = text[:start] + text[end:]
start, end = text.index('    refreshInterpretation() {'), text.index('    close() {')
text = text[:start] + '''    refreshInterpretation() {
        const item = this.currentItem;
        if (!item) return;
        const decoded = rumorDecryption(item.intelReport || item.desc || '미공개 현장 소식이에요.',
            item, this.callbacks.getAnalysisLevel?.() ?? 1);
        const companyStage = decoded.legacy ? 4 : 2;
        if (this.nameText) this.nameText.textContent = decoded.level < companyStage && item.targetStockName
            ? item.name.replaceAll(item.targetStockName, '익명 기업') : item.name;
        if (this.docText) this.docText.textContent = decoded.text;
        if (this.analysisStatus) this.analysisStatus.textContent =
            `해석 ${decoded.level}/5단계${decoded.legacy ? '' : ` · ${STAGE_LABELS[decoded.level - 1]}`}`;
        return decoded;
    }

''' + text[end:]
path.write_text(text, encoding='utf-8')
assert all(token not in text for token in ['rumor-tags', 'rumor-stock-highlight', 'rumor-effects-box', 'rumor-value-status-box'])
print(f'Simplified popup: {len(text.splitlines())} lines. Price/read callbacks preserved.')
