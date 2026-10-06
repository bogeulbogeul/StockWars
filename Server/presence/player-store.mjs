export class DurablePlayerStore {
    constructor({ url, key, fetchImpl = fetch }) {
        this.url = new URL('/rest/v1/stockwars_player_state', url);
        this.headers = { apikey: key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' };
        if (!key.startsWith('sb_secret_')) this.headers.Authorization = `Bearer ${key}`;
        this.fetch = fetchImpl; this.queue = Promise.resolve(); this.last = null;
    }
    async restore(registry) {
        const url = new URL(this.url); url.searchParams.set('id','eq.primary'); url.searchParams.set('select','payload');
        const response = await this.fetch(url, {headers:this.headers,signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw new Error('무료 저장소를 읽지 못했습니다. 기존 기록을 덮어쓰지 않고 서버 시작을 중단합니다.');
        const rows = await response.json();
        if(rows.length) {
            const state=rows[0].payload;
            if(state?.version!==1||!Array.isArray(state.names)||!state.social||!Array.isArray(state.social.friendships)||!Array.isArray(state.social.requests))throw new Error('저장소 형식이 올바르지 않습니다.');
            registry.names=new Map(state.names);registry.social=state.social;
            this.last=JSON.stringify(state);
        } else await this.flush(registry);
    }
    flush(registry) {
        const payload={version:1,names:[...registry.names],social:registry.social};
        const serialized=JSON.stringify(payload);
        const write=async()=>{
            if(this.last===serialized)return;
            const response=await this.fetch(this.url,{method:'POST',headers:this.headers,body:JSON.stringify({id:'primary',payload}),signal:AbortSignal.timeout(10000)});
            if(!response.ok)throw new Error('유저 기록 저장을 확인하지 못했습니다. 다시 시도해 주세요.');
            this.last=serialized;
        };
        this.queue=this.queue.then(write,write);return this.queue;
    }
}
export function configuredPlayerStore(env=process.env) {
    const url=env.SUPABASE_URL,key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url&&!key)return null;
    if(!url||!key)throw new Error('무료 저장소 주소와 서버 전용 키를 모두 설정해 주세요.');
    if(new URL(url).protocol!=='https:')throw new Error('저장소에는 HTTPS 주소가 필요합니다.');
    return new DurablePlayerStore({url,key});
}