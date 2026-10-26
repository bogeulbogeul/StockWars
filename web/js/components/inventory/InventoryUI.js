import { itemIconHtml } from '../../data/itemArtwork.js';
// New ivory inventory view. Ownership and effects stay with the caller.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const INVENTORY_CAPACITY = 30;
const quantity = item => item.quantity ?? 1;
const countItems = items => items.reduce((total, item) => total + quantity(item), 0);
const validItems = items => items.every(item => Number.isInteger(quantity(item)) && quantity(item) > 0) && countItems(items) <= INVENTORY_CAPACITY;
const drawings = {
 bag: '<path d="M19 23v-7a13 13 0 0 1 26 0v7" fill="none" stroke="#68785b" stroke-width="5"/><rect x="12" y="19" width="40" height="39" rx="12" fill="#a7b98a"/><rect x="19" y="36" width="26" height="16" rx="5" fill="#dae3bc"/><path d="M24 26h16" stroke="#f9f4dc" stroke-width="4" stroke-linecap="round"/>',
 cookie: '<circle cx="32" cy="32" r="23" fill="#ddb17c"/><path d="M18 25l6-7m16 5 5 4m-9 16 4-6m-21 3 5 4" stroke="#95684c" stroke-width="5" stroke-linecap="round"/><circle cx="30" cy="30" r="3" fill="#95684c"/>',
 drink: '<rect x="21" y="15" width="24" height="40" rx="8" fill="#d39c8d"/><path d="M25 10h16v8H25z" fill="#728e76"/><rect x="21" y="28" width="24" height="17" rx="3" fill="#fff5d9"/><path d="M32 40c-9-5-5-12 1-7 5-6 10 1-1 7" fill="#9ba96c"/>',
 intel: '<rect x="8" y="17" width="48" height="34" rx="5" fill="#e2ca8f"/><path d="m10 20 22 17 22-17" fill="#f3dfaf" stroke="#c3a66b" stroke-width="2"/><circle cx="32" cy="36" r="7" fill="#c98270"/>',
 powder: '<path d="M25 9h14v13l10 25c3 8-3 10-17 10S12 55 15 47l10-25z" fill="#b8c8db"/><path d="M19 42h26l4 9c-5 5-29 5-34 0z" fill="#e5d9b3"/><path d="M24 9h16" stroke="#a28767" stroke-width="6" stroke-linecap="round"/><path d="m32 26 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff8df"/>',
 book: '<rect x="14" y="10" width="37" height="46" rx="5" fill="#8fa995"/><path d="M20 10v46" stroke="#698674" stroke-width="3"/><path d="M29 24h14m-14 7h10" stroke="#f8f1dc" stroke-width="3" stroke-linecap="round"/><path d="M22 51h27" stroke="#ebe2c9" stroke-width="5"/>',
 etc: '<path d="m32 8 21 17-8 27H19l-8-27z" fill="#b6b1ce"/><path d="m11 25 21 9 21-9M32 8v26l-13 18m13-18 13 18" fill="none" stroke="#e5dfed" stroke-width="2"/>'
};
export function inventoryIcon(kind) { return `<svg viewBox="0 0 64 64" aria-hidden="true">${drawings[kind] || drawings.etc}</svg>`; }

export class InventoryUI {
 constructor(container, {items = [], onAction, onClose} = {}) {
  if (!validItems(items)) throw new RangeError('가방에는 최대 30개까지 담을 수 있어요.');
  this.items = items.map(item => ({...item})); this.onAction = onAction; this.onClose = onClose; this.query = ''; this.selected = null;
  this.dialog = document.createElement('dialog'); this.dialog.className = 'leaf-inventory'; this.dialog.setAttribute('aria-labelledby','leaf-inventory-title');
  this.dialog.innerHTML = `<header class="li-header"><div class="li-bag">${inventoryIcon('bag')}</div><div><h1 id="leaf-inventory-title">내 가방</h1></div><span class="li-capacity"></span><button class="li-close" aria-label="가방 닫기">×</button></header><div class="li-toolbar"><label class="li-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="가방에서 찾기" placeholder="가방에서 찾기"></label></div><div class="li-body"><section class="li-collection" aria-label="보유 아이템"><div class="li-list-heading"><strong>차곡차곡 담아 둔 물건들</strong><span class="li-count" role="status"></span></div><div class="li-grid"></div><p class="li-empty" hidden>찾는 물건이 없어요.<br><span>다른 검색어로 찾아보세요.</span></p></section><section class="li-detail" aria-label="선택한 아이템"></section></div><footer class="li-footer"><span><kbd>Esc</kbd> 닫기</span></footer>`;
  container.append(this.dialog);
  this.dialog.querySelector('.li-close').onclick = () => this.close();
  this.dialog.addEventListener('click', e => {if(e.target===this.dialog){const r=this.dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.close();}});
  this.dialog.addEventListener('close', () => this.onClose?.());
  this.dialog.querySelector('input').oninput = e => {this.query=e.target.value.trim().toLocaleLowerCase();this.render();};
  this.render();
 }
 open() { if(!this.dialog.open)this.dialog.showModal(); }
 close() { this.dialog.close(); }
 setItems(items) {
  if (!validItems(items)) return false;
  this.items=items.map(item => ({...item}));this.render();return true;
 }
 addItem(item) {
  if (!validItems([item]) || countItems(this.items) + quantity(item) > INVENTORY_CAPACITY) return false;
  const existing=this.items.find(i => i.id===item.id);
  if(existing) existing.quantity=quantity(existing)+quantity(item);
  else this.items.push({...item});
  this.render();return true;
 }
 render() {
  const items=this.items.filter(i=>`${i.name} ${i.desc||''}`.toLocaleLowerCase().includes(this.query));
  if(!items.some(i=>i.id===this.selected))this.selected=items[0]?.id??null;
  this.dialog.querySelector('.li-capacity').textContent=`${countItems(this.items)} / ${INVENTORY_CAPACITY}개`;
  this.dialog.querySelector('.li-count').textContent=`${countItems(items)}개`;
  this.dialog.querySelector('.li-empty').hidden=!!items.length;
  const grid=this.dialog.querySelector('.li-grid');grid.replaceChildren();
  for(const item of items){ for(let unit=0;unit<quantity(item);unit++){
   const b=document.createElement('button');b.className='li-item';b.dataset.kind=item.category;b.setAttribute('aria-pressed',String(item.id===this.selected));
   b.innerHTML=`<span class="li-art">${itemIconHtml({...item,id:item.artworkId||item.id})}</span><span class="li-item-name">${escape(item.name)}</span>`;
   b.onclick=()=>{this.selected=item.id;this.renderSelection();};b.dataset.id=item.id;grid.append(b);
  }}
  for(let i=countItems(this.items);!this.query&&i<INVENTORY_CAPACITY;i++){const blank=document.createElement('div');blank.className='li-slot-empty';blank.setAttribute('aria-hidden','true');grid.append(blank);}
  this.renderSelection();
 }
 renderSelection() {
  this.dialog.querySelectorAll('.li-item').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===this.selected)));
  const item=this.items.find(i=>i.id===this.selected), detail=this.dialog.querySelector('.li-detail');
  if(!item){detail.innerHTML=`<div class="li-detail-empty">${inventoryIcon('bag')}<p>물건을 고르면<br>자세히 볼 수 있어요.</p></div>`;return;}
  detail.innerHTML=`<div class="li-hero" data-kind="${escape(item.category)}">${itemIconHtml({...item,id:item.artworkId||item.id})}</div><h2>${escape(item.name)}</h2><p class="li-description">${escape(item.desc)}</p>${item.effect?`<div class="li-effect"><span>사용 효과</span><strong>${escape(item.effect)}</strong></div>`:''}<dl class="li-facts"><div><dt>보유 수량</dt><dd>${escape(item.quantity??1)}개</dd></div></dl><button class="li-use" ${!this.onAction||item.usable===false?'disabled':''}>${escape(item.actionLabel||'사용하기')} <span aria-hidden="true">→</span></button><p class="li-action-note">${item.usable===false?'소중히 보관하는 물건이에요.':'물건을 사용하기 전에 설명을 확인해 주세요.'}</p>`;
  detail.querySelector('.li-use').onclick=()=>this.onAction?.(item);
 }
}
