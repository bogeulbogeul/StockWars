import test from 'node:test';
import assert from 'node:assert/strict';
import { bankTripBlocksNavigation } from '../js/app/exhibition/BankTripNavigation.js';

test('pending bank trip rejects reentrant room changes before any room or Moa can be shown',async()=>{
 for(const place of ['information','home','store','stock','informationOutside']){
  let reminders=0;const s={place:'informationOutside',bankTripPending:true,bankTripGuard:{remind(){reminders++;}}};
  assert.equal(bankTripBlocksNavigation(s,place),true);
  assert.equal(s.place,'informationOutside');assert.equal(reminders,1);assert.equal(s.bankTripPending,true);
 }
});
test('duplicate bank request cannot start a second pending journey',async()=>{
 const s={place:'informationOutside',bankTripPending:true,bankTripGuard:{remind(){throw Error('Bank is the allowed destination');}}};
 assert.equal(bankTripBlocksNavigation(s,'bank'),true);assert.equal(s.place,'informationOutside');
});

test('ordinary navigation is unchanged after the bank journey ends',()=>{assert.equal(bankTripBlocksNavigation({bankTripPending:false},'information'),false);});
