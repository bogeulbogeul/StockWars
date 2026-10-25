import test from 'node:test';
import assert from 'node:assert/strict';
import {TaskNotes} from '../js/components/phone/tasks/TaskNotes.js';
import {exhibitionTasks} from '../js/components/phone/tasks/StoryTasks.js';

test('task notes survive restart and stay separate from exhibition records',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const normal=new TaskNotes('normal',storage);normal.add('메모 <script>');const id=normal.notes[0].id;
 normal.toggle(id);normal.pin(id);
 const restored=new TaskNotes('normal',storage);assert.equal(restored.notes[0].done,true);assert.equal(restored.pinned,id);
 assert.equal(new TaskNotes('exhibition',storage).notes.length,0);
 restored.remove(id);assert.equal(new TaskNotes('normal',storage).notes.length,0);assert.equal(restored.pinned,null);
});
test('invalid records are rejected and storage failures retain session notes',()=>{
 const store=new TaskNotes('normal',{getItem:()=>'{bad',setItem(){throw Error('quota');}});
 assert.equal(store.add('기억할 일'),false);assert.equal(store.notes.length,1);
 assert.throws(()=>store.add(' '));assert.throws(()=>store.add('x'.repeat(81)));
});
test('story tasks reflect real flags without mutating story or granting rewards',()=>{
 const state={cash:300,flags:{bank:true,order:true,notice:true}};const before=JSON.stringify(state);
 const tasks=exhibitionTasks(state);assert.equal(tasks.length,5);assert.equal(tasks[0].done,true);
 assert.equal(tasks.find(t=>t.id==='story-packing').steps.filter(s=>s.done).length,1);
 assert.equal(JSON.stringify(state),before);state.flags.packing=true;
 assert.equal(exhibitionTasks(state).find(t=>t.id==='story-packing').done,true);
 assert.equal(exhibitionTasks({flags:{}}).length,1);
});
