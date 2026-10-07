import test from 'node:test';
import assert from 'node:assert/strict';
import { PresenceRegistry } from './registry.mjs';
import { createPresenceServer } from './server.mjs';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const {PresenceClient}=createRequire(import.meta.url)('../../electron-app/src/presence-client.cjs');
test('forget releases only the caller nickname and removes related social records',()=>{
 const r=new PresenceRegistry(),a=r.session(),b=r.session();
 r.update(a.token,'nickname',undefined,{nickname:'반복테스터'});r.update(b.token,'nickname',undefined,{nickname:'유지유저'});
 r.social={requests:[{from:a.token,to:b.token}],friendships:[[a.token,b.token]],gifts:[{from:b.token,to:a.token}],arenaResults:[{results:[{owner:a.token},{owner:b.token}]}]};
 assert.throws(()=>r.forget(),/세션/);r.forget(a.token);r.forget(a.token);
 assert.equal(r.sessions.has(a.token),false);assert.equal(r.names.size,1);assert.equal(r.social.friendships.length,0);assert.equal(r.social.requests.length,0);assert.equal(r.social.gifts.length,0);assert.deepEqual(r.social.arenaResults[0].results,[{owner:b.token}]);
 const c=r.session();r.update(c.token,'nickname',undefined,{nickname:'반복테스터'});
 assert.throws(()=>r.update(c.token,'nickname',undefined,{nickname:'유지유저'}),/이미 사용/);
});
test('client shutdown awaits durable deletion and clears its token only after acknowledgement',async()=>{
 const r=new PresenceRegistry();let persisted;
 const server=createPresenceServer({registry:r,durable:{flush:async r=>{persisted=JSON.stringify([...r.names])}}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stockwars-forget-'));const tokenFile=path.join(dir,'token.json');
 try {
  const client=new PresenceClient({url:'http://127.0.0.1:'+server.address().port,tokenFile});
  await client.command('nickname',undefined,{nickname:'반복테스트'});
  assert.equal(r.names.size,1);assert.equal(fs.existsSync(tokenFile),true);
  await client.stop({deleteUser:true});assert.equal(r.names.size,0);assert.equal(persisted,'[]');assert.equal(fs.existsSync(tokenFile),false);
  const next=new PresenceClient({url:client.url,tokenFile});assert.equal((await next.command('nickname',undefined,{nickname:'반복테스트'})).error,undefined);await next.stop({deleteUser:true});
 } finally {await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
test('failed deletion retains token for retry',async()=>{
 const client=new PresenceClient({url:'https://test.invalid',tokenFile:'unused',fetchImpl:async()=>({ok:false,status:500,json:async()=>({error:'저장 실패'})})});client.token='owned-token';
 await assert.rejects(client.stop({deleteUser:true}),/저장 실패/);assert.equal(client.token,'owned-token');
});
