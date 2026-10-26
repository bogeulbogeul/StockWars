import { InventoryModal } from '../InventoryModal.js';
import { InventoryUI } from './InventoryUI.js';
import { installBagLauncher } from '../../app/InventoryAccess.js';

// Preserve the established ownership, use, interpretation and quiz controller.
export class GameInventory extends InventoryModal {
 render() {
  this.view = new InventoryUI(this.container, {
   onAction: visible => { const item=this.items.find(i=>i.id===visible.id); this.handleItemAction(item); this.renderGrid(); this.callbacks.onChanged?.(); },
   onClose: () => { if(this.modal.open)return; this.modal.classList.add('hidden'); this.rumorPopup?.close(); this.callbacks.onClose?.(); }
  });
  this.view.dialog.id='inventoryModal'; this.view.dialog.classList.add('hidden');
 }
 initDOM() {
  this.modal=this.view.dialog; this.gridContainer=this.modal.querySelector('.li-grid');
  this.detailContainer=this.modal.querySelector('.li-detail');
 }
 initEventListeners() {
  this.maxSlots=30;
  installBagLauncher({open:()=>this.toggle(),isOpen:()=>this.modal.open,canOpen:()=>!document.body.classList.contains('title-screen-active')});
  this.modal.addEventListener('cancel',e=>{if(!this.rumorPopup.modal.classList.contains('hidden')){e.preventDefault();this.rumorPopup.close();}else{e.preventDefault();this.close();}});
 }
 renderGrid() {
  this.view.items=this.items.filter(i=>i.category!=='apparel').map(item=>({...this.getItemPresentation(item),
   artworkId:item.category==='intel'?'item_premium_rumor':item.id,
   actionLabel:item.category==='intel'?'확인하기':item.actionLabel,
   usable:!['apparel','furniture','book'].includes(item.category)}));
  this.view.selected=this.selectedItemId;this.view.render();this.selectedItemId=this.view.selected;
 }
 selectItem(id) { this.selectedItemId=id;this.view.selected=id;this.view.renderSelection(); }
 renderDetail() { this.renderGrid(); }
 open() {
  this.renderGrid(); this.rumorPopup && this.modal.append(this.rumorPopup.modal);
  this.modal.classList.remove('hidden');this.view.open();this.callbacks.onOpen?.();
 }
 close() { this.modal.classList.add('hidden');this.rumorPopup?.close();this.view.close(); }
 openGift() { return false; } // Social screens remain retired.
 addItem(item) {
  const count=this.items.reduce((n,i)=>n+(i.quantity??1),0),qty=item.quantity??1;
  if(!Number.isInteger(qty)||qty<1||count+qty>30){this.callbacks.onShowToast?.('가방이 가득 찼어요. 최대 30개까지 담을 수 있어요.',false);return false;}
  const existing=this.items.find(i=>i.id===item.id);
  if(existing)existing.quantity=(existing.quantity??1)+qty;else this.items.push({...item,quantity:qty});
  this.renderGrid();return true;
 }
}
