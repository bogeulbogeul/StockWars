import { playerLevelProgress } from '../../../engine/PlayerGrowth.js';
export const DOCUMENTS = [
    {id:'residence',flag:'nickname',title:'입주 신청서',office:'모아 안내소',type:'입주',reflect:'이름 · 입주 등록 상태'},
    {id:'bank',flag:'bank',title:'계좌 개설 신청서',office:'차곡 은행',type:'금융',reflect:'생활 계좌 개설 상태'},
    {id:'loan',flag:'loan',title:'대출 신청서',office:'차곡 은행',type:'금융',reflect:'정착 자금 대출 · 빌린 금액'}
];
export function receiveProfileDocument(app,id,amount){
    const existed=Object.hasOwn(app.state,'profileDocuments');
    const previous=structuredClone(app.state.profileDocuments||{});
    app.state.profileDocuments??={};
    if(app.state.profileDocuments[id])return true;
    app.state.profileDocuments[id]={receivedAt:new Date().toISOString(),...(Number.isFinite(amount)?{amount}:{})};
    if(app.save()!==false)return true;
    app.state.profileDocuments=previous;
    if(!existed)delete app.state.profileDocuments;
    app.view.error('서류 수령 기록을 저장하지 못했어요. 다시 시도해 주세요.');
    return false;
}
export function signProfileDocument(state,flag){
    const def=DOCUMENTS.find(d=>d.flag===flag);if(!def)return;
    state.profileDocuments??={};
    const previous=state.profileDocuments[def.id]||{};
    state.profileDocuments[def.id]={...previous,receivedAt:previous.receivedAt||null,signedAt:new Date().toISOString(),name:state.nickname,...(flag==='loan'?{amount:state.debt}:{})};
}
export function exhibitionProfile(state){
    const flags=state.flags||{},records=state.profileDocuments||{};
    return {
        name:flags.nickname?state.nickname:'아직 등록되지 않았어요',registered:!!flags.nickname,
        level:playerLevelProgress(state),
        analysis:{level:state.analysis,current:null,required:null,max:false,exam:true},
        documents:DOCUMENTS.filter(d=>records[d.id]||flags[d.flag]).map(d=>{
            const record=records[d.id]||{},signed=!!flags[d.flag];
            return {...d,signed,receivedAt:record.receivedAt||null,signedAt:record.signedAt||null,name:record.name||state.nickname||'미등록',amount:d.id==='loan'?(record.amount??(signed?state.debt:undefined)):undefined};
        }),
        debt:flags.loan?state.debt:null
    };
}
export function normalProfile(app){
    return {name:app.userProfile?.nickname||'아직 등록되지 않았어요',registered:false,level:app.itemEngine?.playerLevelProgress?.()||null,analysis:app.itemEngine?.analysisProgress?.()||null,documents:[],debt:null};
}
