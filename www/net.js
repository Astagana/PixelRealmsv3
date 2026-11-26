// Lapisan online: akun, world tersimpan, multiplayer (Realtime) dan voice chat (WebRTC, signaling via Realtime)
(()=>{
// voice codec: 8 kHz mono, mu-law (8 KB/s while talking)
const VR=8000,CHK=3200,UL=new Float32Array(256);for(let i=0;i<256;i++){const sg=i&128?-1:1,y=(i&127)/127;UL[i]=sg*(Math.pow(256,y)-1)/255}
const mu=x=>{x=Math.max(-1,Math.min(1,x));return(x<0?128:0)|Math.min(127,Math.round(Math.log(1+255*Math.abs(x))/Math.log(256)*127))};
const packV=f=>{const u=new Uint8Array(f.length);for(let i=0;i<f.length;i++)u[i]=mu(f[i]);let s='';for(let i=0;i<u.length;i+=4096)s+=String.fromCharCode.apply(null,u.subarray(i,i+4096));return btoa(s)};
const unpackV=b=>{try{const s=atob(b),f=new Float32Array(s.length);for(let i=0;i<s.length;i++)f[i]=UL[s.charCodeAt(i)];return f}catch(e){return null}};
window.PRVoice={packV,unpackV};
const C=window.PR_CONFIG||{},N=window.Net={on:false};
if(!(C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&window.supabase))return;
N.on=true;
const sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY,{realtime:{params:{eventsPerSecond:20}}});
const mail=u=>u.toLowerCase()+'@'+(C.EMAIL_DOMAIN||'pixelrealm.app'),OKU=/^[A-Za-z0-9_]{3,16}$/;
const fail=e=>{if(e)throw new Error(e.message||String(e))};
async function prof(uid){const{data,error}=await sb.from('profiles').select('*').eq('id',uid).single();fail(error);return data}
const done=async u=>{N.uid=u.id;return{user:u,profile:await prof(u.id)}};

// ----- akun -----
N.session=async()=>{const{data}=await sb.auth.getSession();return data.session?done(data.session.user):null};
N.signUp=async(u,p)=>{
 if(!OKU.test(u))throw new Error('Username: 3-16 letters, numbers or _');
 if(p.length<6)throw new Error('Password needs 6+ characters');
 const{data,error}=await sb.auth.signUp({email:mail(u),password:p,options:{data:{username:u}}});
 if(error)throw new Error(/registered|exists|duplicate/i.test(error.message)?'That username is already taken':error.message);
 if(!data.session)throw new Error('Turn off "Confirm email" in Supabase > Auth > Providers > Email');
 return done(data.user)};
N.signIn=async(u,p)=>{const{data,error}=await sb.auth.signInWithPassword({email:mail(u),password:p});
 if(error)throw new Error('Wrong username or password');return done(data.user)};
N.signOut=()=>sb.auth.signOut();
N.saveProfile=async s=>fail((await sb.from('profiles').update({gems:s.gems,inv:s.inv,look:s.look}).eq('id',N.uid)).error);

// ----- world & casino (dijaga di database lewat RLS/RPC) -----
N.getWorld=async n=>{const{data,error}=await sb.from('worlds').select('*').eq('name',n).maybeSingle();fail(error);return data};
N.saveWorld=async(n,d)=>fail((await sb.rpc('save_world',{p_name:n,p_data:d})).error);
N.claim=async(n,d)=>fail((await sb.rpc('claim_world',{p_name:n,p_data:d})).error);
N.setAccess=async(n,a,b)=>fail((await sb.rpc('set_world_access',{p_name:n,p_access:a,p_banned:b})).error);
N.worldMeta=async n=>{const{data,error}=await sb.from('worlds').select('updated_at,owner,owner_name,locked,access,banned').eq('name',n).maybeSingle();fail(error);return data};
N.token='';sb.auth.getSession().then(({data})=>{N.token=data.session?data.session.access_token:''});sb.auth.onAuthStateChange((_e,ss)=>{N.token=ss?ss.access_token:''});
// best-effort save while the tab is closing (keepalive requests survive page unload)
N.flush=(name,data,prof)=>{if(!N.token||!N.uid)return;const h={apikey:C.SUPABASE_ANON_KEY,Authorization:'Bearer '+N.token,'Content-Type':'application/json'};
 if(data&&name)fetch(C.SUPABASE_URL+'/rest/v1/rpc/save_world',{method:'POST',headers:h,body:JSON.stringify({p_name:name,p_data:data}),keepalive:true}).catch(()=>{});
 if(prof)fetch(C.SUPABASE_URL+'/rest/v1/profiles?id=eq.'+N.uid,{method:'PATCH',headers:Object.assign({Prefer:'return=minimal'},h),body:JSON.stringify(prof),keepalive:true}).catch(()=>{})};
N.unlock=async n=>fail((await sb.rpc('unlock_world',{p_name:n})).error);
N.spin=async(k,num,a)=>{const{data,error}=await sb.rpc('spin_roulette',{p_kind:k,p_num:num,p_amount:a});fail(error);return data};

// ----- room: presence + broadcast -----
let ch=null,meta=null,H={},peers={},stream=null;const auds={};
N.join=async(name,m,h)=>{
 await N.leave();meta=m;H=h;
 const c=ch=sb.channel('pr:'+name,{config:{broadcast:{self:false},presence:{key:m.id}}});
 c.on('presence',{event:'sync'},()=>{H.presence&&H.presence(c.presenceState());voiceSync()});
 ['pos','edit','chat','lock','cmd','trade'].forEach(ev=>c.on('broadcast',{event:ev},({payload})=>H[ev]&&H[ev](payload)));
 c.on('broadcast',{event:'voice'},({payload})=>playV(payload));
 c.subscribe(s=>{if(s==='SUBSCRIBED')c.track(meta)})};
N.leave=async()=>{closePeers();if(ch){const c=ch;ch=null;try{await sb.removeChannel(c)}catch(e){}}};
N.send=(ev,p)=>{if(ch)ch.send({type:'broadcast',event:ev,payload:p})};
N.track=o=>{if(!meta)return;Object.assign(meta,o);if(ch)ch.track(meta)};

// ----- teman, lobby (siapa online), top world -----
N.friends=async()=>{const{data,error}=await sb.rpc('list_friends');fail(error);return data||[]};
N.addFriend=async u=>{const{data,error}=await sb.rpc('add_friend',{p_username:u});fail(error);return data};
N.respondFriend=async(u,a)=>fail((await sb.rpc('respond_friend',{p_username:u,p_action:a})).error);
N.top=async()=>{const{data,error}=await sb.rpc('top_worlds');fail(error);return data||[]};
N.visit=async n=>{fail((await sb.rpc('visit_world',{p_name:n})).error)};
let lob=null,lmeta=null;
N.lobby=(m,cb)=>{if(lob)return;lmeta=m;lob=sb.channel('pr:lobby',{config:{presence:{key:m.id}}});
 lob.on('presence',{event:'sync'},()=>cb(lob.presenceState()));lob.subscribe(s=>{if(s==='SUBSCRIBED')lob.track(lmeta)})};
N.lobbyTrack=o=>{if(lob){Object.assign(lmeta,o);lob.track(lmeta)}};

// ----- voice chat: audio is relayed through the realtime channel, so it works on any network (no TURN needed) -----
let ac=null,mic=null,node=null,src=null,buf=[],hang=0;const sp={},vols={};N.talking={};
function voiceSync(){}
function closePeers(){for(const k in sp){try{sp[k].g.disconnect()}catch(e){}delete sp[k]}}
N.setVol=(id,v)=>{vols[id]=v;if(sp[id])sp[id].g.gain.value=v};
function sendChunk(chunk,ratio){
 if(!ch||!meta)return;const out=new Float32Array(CHK);let e=0;
 for(let j=0;j<CHK;j++){const a=Math.floor(j*ratio),z=Math.max(a+1,Math.floor((j+1)*ratio));let s=0;for(let i=a;i<z;i++)s+=chunk[i]||0;out[j]=s/(z-a);e+=out[j]*out[j]}
 const rms=Math.sqrt(e/CHK);if(rms>.012)hang=2;else if(hang>0)hang--;else return;       // skip silence
 N.send('voice',{id:meta.id,d:packV(out)})}
function playV(p){
 if(!ac||!node||!p||typeof p.d!=='string'||!meta||p.id===meta.id)return;
 const f=unpackV(p.d);if(!f||!f.length)return;N.talking[p.id]=performance.now();
 let s=sp[p.id];if(!s){const g=ac.createGain();g.gain.value=vols[p.id]??1;g.connect(ac.destination);s=sp[p.id]={g,next:0}}
 const b=ac.createBuffer(1,f.length,VR);b.copyToChannel(f,0);const a=ac.createBufferSource();a.buffer=b;a.connect(s.g);
 const t=ac.currentTime;if(s.next<t+.04||s.next>t+1.6)s.next=t+.25;a.start(s.next);s.next+=b.duration}
N.voice=async on=>{
 if(on){
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('Microphone needs HTTPS and a supported browser');
  ac=ac||new(window.AudioContext||window.webkitAudioContext)();await ac.resume();
  mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  src=ac.createMediaStreamSource(mic);node=ac.createScriptProcessor(4096,1,1);const ratio=ac.sampleRate/VR,need=Math.round(CHK*ratio);
  node.onaudioprocess=e=>{const inp=e.inputBuffer.getChannelData(0);for(let i=0;i<inp.length;i++)buf.push(inp[i]);while(buf.length>=need)sendChunk(buf.splice(0,need),ratio)};
  const silent=ac.createGain();silent.gain.value=0;src.connect(node);node.connect(silent);silent.connect(ac.destination);N.track({voice:true})}
 else{try{node&&node.disconnect();src&&src.disconnect()}catch(e){}if(mic)mic.getTracks().forEach(t=>t.stop());node=src=mic=null;buf=[];closePeers();N.track({voice:false})}
 return on};
})();
window.Net=window.Net||{on:false};
