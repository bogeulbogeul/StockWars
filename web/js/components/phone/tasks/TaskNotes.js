export class TaskNotes {
    constructor(domain='normal',storage=globalThis.localStorage) {
        this.storage=storage;this.key=`stockwars.phone.tasks.${domain}.v1`;this.notes=[];this.pinned=null;
        try {const data=JSON.parse(storage?.getItem(this.key)||'{}');this.notes=Array.isArray(data.notes)?data.notes.filter(n=>typeof n?.id==='string'&&typeof n.title==='string'&&n.title.trim()&&n.title.length<=80).slice(0,100).map(n=>({id:n.id,title:n.title,done:n.done===true})):[];this.pinned=typeof data.pinned==='string'?data.pinned:null;}catch{}
    }
    save(){try{if(!this.storage)return false;this.storage.setItem(this.key,JSON.stringify({notes:this.notes,pinned:this.pinned}));return true;}catch{return false;}}
    add(title){title=String(title).trim();if(!title||title.length>80)throw new Error('할 일을 1~80자로 적어 주세요.');if(this.notes.length>=100)throw new Error('메모는 최대 100개까지 저장할 수 있어요.');this.notes.push({id:`note-${globalThis.crypto?.randomUUID?.()||Date.now()}`,title,done:false});return this.save();}
    toggle(id){const note=this.notes.find(n=>n.id===id);if(note)note.done=!note.done;return this.save();}
    remove(id){this.notes=this.notes.filter(n=>n.id!==id);if(this.pinned===id)this.pinned=null;return this.save();}
    pin(id){this.pinned=this.pinned===id?null:id;return this.save();}
    tasks(){return this.notes.map(n=>({...n,category:'내 메모',description:'직접 적은 할 일이에요. 마친 뒤 완료 표시를 눌러 주세요.',steps:[{title:n.title,done:n.done}],manual:true}));}
}
