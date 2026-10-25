import { profileView, documentsView, documentView } from './ProfileViews.js';
export function mountProfileApp(phone,host,source){
    let view='profile',filter='all',selected=null,signature='',alive=true;
    let playerCode=null,identityPending=false;
    const read=()=>({...source.profile?.()||{name:'아직 등록되지 않았어요',documents:[],analysis:null},playerCode});
    async function refreshIdentity(){
        if(identityPending||!source.profileIdentity)return;
        identityPending=true;
        try{const code=await source.profileIdentity();if(alive){playerCode=Number.isInteger(code)||typeof code==='string'&&code!=='local-player'?code:null;if(JSON.stringify(read())!==signature)render();}}catch{}finally{identityPending=false;}
    }
    function render(){if(!alive)return;const data=read(),doc=data.documents.find(d=>d.id===selected);if(view==='document'&&!doc)view='documents';host.innerHTML=view==='profile'?profileView(data):view==='documents'?documentsView(data,filter):documentView(doc);signature=JSON.stringify(data);}
    phone.detail.classList.add('cozy-phone__detail--profile');host.classList.add('phone-profile');
    host.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.action)view=b.dataset.action;if(b.dataset.filter)filter=b.dataset.filter;if(b.dataset.document){selected=b.dataset.document;view='document';}render();};
    render();
    void refreshIdentity();
    const identityTimer=setInterval(()=>void refreshIdentity(),10000);
    const timer=setInterval(()=>{if(JSON.stringify(read())!==signature)render();},500);
    return()=>{alive=false;clearInterval(timer);clearInterval(identityTimer);host.onclick=null;host.classList.remove('phone-profile');phone.detail.classList.remove('cozy-phone__detail--profile');};
}
