import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document={getElementById:()=>({})};
const {VivianStoreModal}=await import('../js/components/store/VivianStoreModal.js');
const {toastManager}=await import('../js/components/ToastManager.js');
toastManager.show=()=>{};

test('authoritative purchase success receives original quantity; failure has no receipt',()=>{
    for (const success of [true,false]) {
        let receipt;
        const room={selectedItemId:'item_energy_drink',quantity:2,
            callbacks:{onPurchaseItem:()=>({success,message:'result'})},
            showReceipt:(...args)=>receipt=args,updateHeaderInfo(){},renderItemsGrid(){},selectItem(){this.quantity=1;}};
        VivianStoreModal.prototype.executePurchase.call(room,true);
        assert.equal(Boolean(receipt),success);
        if(success){assert.equal(receipt[1],2);assert.equal(receipt[2],true);}
    }
});

test('receipt shows total and delivery mode and restores shopping focus on dismissal',()=>{
    const fields={}; let focused=false;
    const room={receiptEl:{hidden:true,querySelector:id=>fields[id]??=( {textContent:''})},shopPanel:{inert:false},
        receiptClose:{focus(){}},btnBuy:{focus(){focused=true;}}};
    VivianStoreModal.prototype.showReceipt.call(room,{name:'상품',price:500},2,false);
    assert.equal(fields['#vivianReceiptTotal'].textContent,'1,000 G');
    assert.match(fields['#vivianReceiptDelivery'].textContent,/소지품/);
    assert.equal(room.shopPanel.inert,true);
    VivianStoreModal.prototype.hideReceipt.call(room);
    assert.equal(room.receiptEl.hidden,true);assert.equal(room.shopPanel.inert,false);assert(focused);
});
