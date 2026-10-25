import { gameKey, bindingLabel } from './GameKeys.js';
export function showRumorReceipt() {
 document.querySelector('.inventory-receipt')?.remove();
 const notice=document.createElement('div');notice.className='inventory-receipt';notice.setAttribute('role','status');
 notice.textContent=`찌라시가 가방에 들어왔어요. [${bindingLabel('i')}] 키로 가방을 열어 확인하세요.`;
 document.body.append(notice);setTimeout(()=>notice.remove(),8000);
}
export function installBagLauncher({open,isOpen,canOpen}) {
 window.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.repeat||gameKey(e)!=='i'||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  if(!isOpen()&&(!canOpen()||document.querySelector('dialog[open]')))return;
  e.preventDefault();e.stopImmediatePropagation();open();
 },true);

}
