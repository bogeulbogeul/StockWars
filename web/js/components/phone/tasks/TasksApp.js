import { TaskNotes } from './TaskNotes.js';
import { tasksList, taskDetail, taskForm } from './TasksViews.js';
export function mountTasksApp(phone,host,source){
    const store=new TaskNotes(source.taskDomain||'normal');
    let view='list',selected=null,note='',signature='',alive=true;
    const app={store,filter:'all',tasks:()=>[...(source.tasks?.()||[]),...store.tasks()]};
    phone.detail.classList.add('cozy-phone__detail--tasks');host.classList.add('phone-tasks');
    function render(){
        if(!alive)return;
        const task=app.tasks().find(t=>t.id===selected);if(view==='detail'&&!task)view='list';
        host.innerHTML=`${view==='add'?taskForm():view==='detail'?taskDetail(app,task):tasksList(app)}<p class="tasks-status" role="status" aria-live="polite"></p>`;
        host.querySelector('.tasks-status').textContent=note;
        if(view==='add')host.querySelector('input').focus();
    }
    function saved(ok){note=ok?'변경한 내용을 저장했어요.':'현재 실행에 적용했어요. 저장 공간을 사용할 수 없어 다음 실행에는 유지되지 않아요.';}
    host.onclick=e=>{
        const b=e.target.closest('button');if(!b)return;
        const d=b.dataset;note='';
        if(d.filter)app.filter=d.filter;
        if(d.task){selected=d.task;view='detail';}
        if(d.action==='list')view='list';
        if(d.action==='add')view='add';
        if(d.action==='pin')saved(store.pin(selected));
        if(d.action==='toggle')saved(store.toggle(selected));
        if(d.action==='delete'){saved(store.remove(selected));view='list';}
        // The form submit button must retain its form until native validation/submission.
        if(!d.filter&&!d.task&&!d.action)return;
        render();
    };
    host.onsubmit=e=>{e.preventDefault();if(!e.target.matches('[data-task-form]'))return;try{saved(store.add(new FormData(e.target).get('title')));view='list';app.filter='all';render();}catch(error){host.querySelector('.tasks-status').textContent=error.message;}};
    render();
    const timer=setInterval(()=>{const next=JSON.stringify(source.tasks?.()||[]);if(next!==signature){signature=next;if(view!=='add')render();}},1000);
    return()=>{alive=false;clearInterval(timer);host.onclick=host.onsubmit=null;host.classList.remove('phone-tasks');phone.detail.classList.remove('cozy-phone__detail--tasks');};
}
