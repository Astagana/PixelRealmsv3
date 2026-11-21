// Lapisan online: akun, world tersimpan, multiplayer (Realtime) dan voice chat (WebRTC, signaling via Realtime)
(()=>{
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
N.unlock=async n=>fail((await sb.rpc('unlock_world',{p_name:n})).error);
N.spin=async(k,num,a)=>{const{data,error}=await sb.rpc('spin_roulette',{p_kind:k,p_num:num,p_amount:a});fail(error);return data};

// ----- room: presence + broadcast -----
let ch=null,meta=null,H={},peers={},stream=null;const auds={};
N.join=async(name,m,h)=>{
 await N.leave();meta=m;H=h;
 const c=ch=sb.channel('pr:'+name,{config:{broadcast:{self:false},presence:{key:m.id}}});
 c.on('presence',{event:'sync'},()=>{H.presence&&H.presence(c.presenceState());voiceSync()});
 ['pos','edit','chat','lock','cmd','trade'].forEach(ev=>c.on('broadcast',{event:ev},({payload})=>H[ev]&&H[ev](payload)));
 c.on('broadcast',{event:'rtc'},({payload})=>rtc(payload));
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

// ----- voice chat (mesh WebRTC) -----
N.voice=async on=>{
 if(on){stream=stream||await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});N.track({voice:true})}
 else{closePeers();if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}N.track({voice:false})}
 return on};
N.setVol=(id,v)=>{if(auds[id])auds[id].volume=v};
function voiceSync(){
 if(!stream||!ch||!meta)return;const st=ch.presenceState();
 for(const id in st){if(id===meta.id)continue;const m=st[id][0];if(m&&m.voice&&!peers[id]&&meta.id>id)peer(id,true)}
 for(const id in peers)if(!st[id]||!st[id][0].voice)drop(id)}
const ICE=()=>{const s=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
 if(Array.isArray(C.TURN))s.push(...C.TURN);else s.push({urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'});return s};
const gathered=pc=>new Promise(res=>{if(pc.iceGatheringState==='complete')return res();const t=setTimeout(res,3500);
 pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(t);res()}})});
function peer(id,init){
 const pc=new RTCPeerConnection({iceServers:ICE()});
 const o=peers[id]={pc,q:[],rd:false};
 stream.getTracks().forEach(t=>pc.addTrack(t,stream));
 pc.ontrack=e=>{let a=auds[id];if(!a){a=auds[id]=new Audio();a.autoplay=true}a.srcObject=e.streams[0]||new MediaStream([e.track]);
  a.play().catch(()=>addEventListener('pointerdown',()=>a.play().catch(()=>{}),{once:true}))};
 pc.onconnectionstatechange=()=>{if(peers[id]===o&&['failed','closed'].includes(pc.connectionState))drop(id)};
 // no trickle: send one offer/answer that already contains every ICE candidate (far fewer realtime messages)
 if(init)pc.createOffer().then(d=>pc.setLocalDescription(d)).then(()=>gathered(pc)).then(()=>N.send('rtc',{to:id,from:meta.id,k:'offer',d:pc.localDescription}));
 setTimeout(()=>{if(peers[id]===o&&pc.connectionState!=='connected'){drop(id);voiceSync()}},15000);
 return o}
async function rtc(p){
 if(!stream||!meta||p.to!==meta.id)return;let o=peers[p.from];
 if(p.k==='offer'){if(o)drop(p.from);o=peer(p.from,false);await o.pc.setRemoteDescription(p.d);
  await o.pc.setLocalDescription(await o.pc.createAnswer());await gathered(o.pc);N.send('rtc',{to:p.from,from:meta.id,k:'answer',d:o.pc.localDescription})}
 else if(o&&p.k==='answer'&&!o.pc.currentRemoteDescription)await o.pc.setRemoteDescription(p.d)}
function drop(id){const o=peers[id];if(o){delete peers[id];try{o.pc.close()}catch(e){}}if(auds[id]){auds[id].srcObject=null;delete auds[id]}}
function closePeers(){Object.keys(peers).forEach(drop)}
})();
window.Net=window.Net||{on:false};
