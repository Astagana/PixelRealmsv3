'use strict';
(()=>{
const T=16,W=80,H=60,REACH=5.5,GROW=90,PW=.28,PH=.98;
const $=s=>document.querySelector(s),cv=$('#c'),ctx=cv.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+(Math.random()*(b-a+1)|0);

// ---------- block data ----------
const DEF={
1:{n:'Grass',h:2,s:1,p:1,g:[.2,1,1],sd:.14,c:'#68b03e'},
2:{n:'Dirt',h:2,s:1,p:1,g:[.15,1,1],sd:.1,c:'#74503a'},
3:{n:'Rock',h:4,s:1,p:1,g:[.35,1,3],c:'#6f727c'},
4:{n:'Bedrock',s:1,c:'#26262e'},
5:{n:'Lava',h:2,c:'#ff6e1e'},
6:{n:'Sand',h:2,s:1,p:1,g:[.2,1,1],c:'#e2ca84'},
7:{n:'Wood',h:3,s:1,p:1,g:[.25,1,2],c:'#a5703c'},
8:{n:'Glass',h:1,s:1,p:1,c:'#b6e8ff'},
9:{n:'Brick',h:5,s:1,p:1,g:[.3,1,2],c:'#b0483e'},
10:{n:'Door',c:'#f4f4fc'},
12:{n:'Sapling',h:1,c:'#78d654'},
13:{n:'Tree',h:3,c:'#348a3a'},
40:{n:'Gold Lock',h:8,s:1,p:1,c:'#ffc247'},
41:{n:'Diamond Lock',h:8,s:1,p:1,c:'#4fd8ff'},
16:{n:'Pepper Sprout',h:1,c:'#7bc043'},
17:{n:'Pepper Tree',h:2,c:'#2f8f3a'},
31:{n:'Pepper',p:1,c:'#d92f2f'},
18:{n:'Ladder',h:1,p:1,c:'#a5703c'},
19:{n:'Jump Pad',h:2,s:1,p:1,c:'#3fb34d'},
20:{n:'Lantern',h:1,p:1,c:'#ffd66b'},
43:{n:'Pickaxe',perm:1,cur:1,c:'#c9d4f2'},
44:{n:'Wing',perm:1,cur:1,c:'#e8f4ff'},
45:{n:'Speed Boots',perm:1,cur:1,c:'#8a5a2b'},
46:{n:'Fertilizer',p:1,c:'#8a6a3a'},
14:{n:'Gate',h:3,s:1,p:1,c:'#8a5a2b'},
15:{n:'Open Gate',h:3,c:'#8a5a2b'},
42:{n:'Wrench',p:1,nopl:1,perm:1,c:'#c9d4f2'},
30:{n:'Seed',p:1,c:'#96dc5a'}};
47:{n:'Malevolent Luminary Hair', perm:1, cur:1, isAnimatedHair:1, c:'#b8873a'},
 
const CAVE={n:'Cave',h:2,c:'#1b1311'};   // black cave tile (dug out or natural): breakable, drops Dirt or a Seed
const DAYLEN=360,LANT=[];
const GROWS={12:[13,GROW],16:[17,45]};   // leftover of a broken block: breakable, drops a Dirt block or a Seed
const SHOP=[[8,10,15],[7,10,25],[6,20,10],[3,20,30],[9,10,40],[30,5,20],[40,1,500],[31,1,10,5],[43,1,800],[44,1,2000],[45,1,600],[46,3,25],[18,10,10],[19,3,30],[20,3,40], [47, 1, 300]];

// ---------- rng / noise ----------
const mb=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const hash=(a,b,s)=>{let h=Math.imul(a,374761393)^Math.imul(b,668265263)^Math.imul(s,2147483647);h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967296};
const vn=(x,y,s)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),a=hash(xi,yi,s),b=hash(xi+1,yi,s),c=hash(xi,yi+1,s),d=hash(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
const strHash=s=>{let h=5381;for(const c of s)h=(h*33+c.charCodeAt(0))%1000003;return h};

// ---------- tile atlas (drawn in code, no image files) ----------
const mk=f=>{const c=document.createElement('canvas');c.width=c.height=T;f(c.getContext('2d'));return c};
const F=(x,a,b,w,h,c)=>{x.fillStyle=c;x.fillRect(a,b,w,h)};
const sp=(x,r,cols,n,y0=0,y1=T)=>{for(let i=0;i<n;i++)F(x,r()*T|0,y0+(r()*(y1-y0)|0),1,1,cols[r()*cols.length|0])};
const bevel=x=>{F(x,0,0,T,1,'rgba(255,255,255,.14)');F(x,0,0,1,T,'rgba(255,255,255,.1)');F(x,0,T-1,T,1,'rgba(0,0,0,.22)');F(x,T-1,0,1,T,'rgba(0,0,0,.18)')};
const A={};
A[2]=mk(x=>{const r=mb(2);F(x,0,0,T,T,'#74503a');sp(x,r,['#5e3f2d','#8a6044','#4d3324'],46);bevel(x)});
A[1]=mk(x=>{const r=mb(1);x.drawImage(A[2],0,0);F(x,0,0,T,5,'#68b03e');sp(x,r,['#86cc54','#4f8f2e','#5aa032'],14,0,5);for(let i=0;i<T;i++)if(r()<.6)F(x,i,5,1,1+(r()*2|0),'#68b03e');F(x,0,0,T,1,'#93d65e')});
A[3]=mk(x=>{const r=mb(3);F(x,0,0,T,T,'#6f727c');sp(x,r,['#5d606a','#82858f','#4e515a'],44);F(x,3,4,4,1,'#4a4d56');F(x,6,5,1,3,'#4a4d56');F(x,10,10,4,1,'#4a4d56');F(x,10,10,1,3,'#4a4d56');bevel(x)});
A[4]=mk(x=>{const r=mb(4);F(x,0,0,T,T,'#26262e');sp(x,r,['#1a1a20','#33333c','#3b3b46'],50);bevel(x)});
A[6]=mk(x=>{const r=mb(6);F(x,0,0,T,T,'#e2ca84');sp(x,r,['#d1b673','#efd998','#c7ab68'],40);bevel(x)});
A[7]=mk(x=>{const r=mb(7);F(x,0,0,T,T,'#a5703c');for(let y=0;y<T;y+=4)F(x,0,y,T,1,'#7d5128');for(let y=0;y<T;y+=4)F(x,(y/4%2)*8+2,y+1,1,3,'#8d5d31');sp(x,r,['#b98349','#946030'],22);bevel(x)});
A[8]=mk(x=>{x.globalAlpha=.3;F(x,0,0,T,T,'#cfefff');x.globalAlpha=1;F(x,0,0,T,1,'#e8f8ff');F(x,0,0,1,T,'#e8f8ff');F(x,0,T-1,T,1,'#9fd0e8');F(x,T-1,0,1,T,'#9fd0e8');for(let i=0;i<5;i++)F(x,3+i,3+i,1,1,'#fff');F(x,3,10,1,1,'#fff');F(x,4,11,1,1,'#fff')});
A[9]=mk(x=>{const r=mb(9);F(x,0,0,T,T,'#b0483e');sp(x,r,['#9a3b32','#c25a4e'],26);for(let k=0;k<4;k++){const y=k*4;F(x,0,y+3,T,1,'#dccbb8');for(let j=0;j<2;j++)F(x,((k%2)*4+j*8)%T,y,1,3,'#dccbb8')}bevel(x)});
A[10]=mk(x=>{F(x,0,0,T,T,'#8a93b8');F(x,1,1,14,14,'#f4f4fc');F(x,3,3,10,5,'#c9d4f2');F(x,3,9,10,5,'#c9d4f2');F(x,11,8,2,2,'#ffc247');F(x,0,0,T,1,'#b4bcdc')});
A[14]=mk(x=>{const r=mb(14);F(x,0,0,T,T,'#8a5a2b');for(let i=2;i<T;i+=4)F(x,i,0,2,T,'#5e3b1d');F(x,0,3,T,2,'#b98349');F(x,0,11,T,2,'#b98349');sp(x,r,['#a5703c','#7d5128'],14);bevel(x)});
A[15]=mk(x=>{F(x,0,0,2,T,'#8a5a2b');F(x,T-2,0,2,T,'#8a5a2b');F(x,0,0,T,2,'#5e3b1d');F(x,2,0,1,T,'#b98349');F(x,T-3,0,1,T,'#b98349')});
A[42]=mk(x=>{F(x,2,11,3,3,'#8a93b8');F(x,4,9,3,3,'#c9d4f2');F(x,6,7,3,3,'#c9d4f2');F(x,8,5,3,3,'#c9d4f2');F(x,9,2,5,3,'#c9d4f2');F(x,12,2,2,6,'#c9d4f2');F(x,10,4,2,2,'#2b1d14')});
A[12]=mk(x=>{F(x,7,9,2,7,'#4f8f2e');F(x,4,8,4,2,'#78d654');F(x,8,5,4,2,'#78d654');F(x,5,7,2,1,'#9be67a');F(x,9,4,2,1,'#9be67a')});
A[13]=mk(x=>{const r=mb(13);F(x,6,9,4,7,'#7a4f2a');F(x,6,9,1,7,'#5e3b1d');for(let yy=0;yy<12;yy++)for(let xx=0;xx<16;xx++){const d=(xx-7.5)**2+(yy-5.5)**2;if(d<=30)F(x,xx,yy,1,1,['#348a3a','#2a7430','#43a248'][r()*3|0])}F(x,5,3,2,1,'#6cc66e');F(x,9,2,2,1,'#6cc66e');F(x,10,6,2,2,'#d9402e')});
A[5]=[0,1].map(f=>mk(x=>{const r=mb(50+f);F(x,0,0,T,T,'#e8501a');sp(x,r,['#ff8a2a','#ffd24a','#c43a10','#ff9a3a'],70)}));
A[30]=mk(x=>{F(x,6,5,4,6,'#96dc5a');F(x,5,6,6,4,'#96dc5a');F(x,6,5,2,2,'#c6f08f');F(x,9,9,1,2,'#5f9a30')});
A[40]=mk(x=>{F(x,0,0,T,T,'#d9a62a');sp(x,mb(40),['#f2c94c','#b98a1c','#e8b83a'],40);F(x,6,2,1,6,'#c9d4f2');F(x,9,2,1,6,'#c9d4f2');F(x,6,2,4,1,'#c9d4f2');F(x,4,7,8,7,'#7a5410');F(x,5,8,6,5,'#ffc247');F(x,7,9,2,2,'#2b1d14');F(x,7,11,2,1,'#2b1d14');bevel(x)});
A[41]=mk(x=>{F(x,0,0,T,T,'#2aa8d8');sp(x,mb(41),['#7fe0ff','#1b8fc0','#4fd8ff'],40);F(x,6,2,1,6,'#e8f8ff');F(x,9,2,1,6,'#e8f8ff');F(x,6,2,4,1,'#e8f8ff');F(x,4,7,8,7,'#0f5f80');F(x,5,8,6,5,'#4fd8ff');F(x,7,9,2,2,'#0b2d3d');F(x,7,11,2,1,'#0b2d3d');bevel(x)});
A[18]=mk(x=>{F(x,3,0,2,T,'#a5703c');F(x,11,0,2,T,'#a5703c');F(x,3,0,1,T,'#c28a4a');F(x,11,0,1,T,'#c28a4a');for(let y=2;y<T;y+=4)F(x,5,y,6,2,'#7d5128')});
A[19]=mk(x=>{F(x,0,0,T,T,'#2f9a40');F(x,0,0,T,3,'#7be07b');F(x,7,5,2,7,'#fff');F(x,5,7,2,2,'#fff');F(x,9,7,2,2,'#fff');F(x,3,9,2,2,'#fff');F(x,11,9,2,2,'#fff');bevel(x)});
A[20]=mk(x=>{F(x,6,1,4,2,'#5a3a1b');F(x,4,3,8,10,'#c28a2a');F(x,5,4,6,8,'#ffd66b');F(x,7,5,2,5,'#fff2b0');F(x,5,13,6,2,'#5a3a1b')});
A[43]=mk(x=>{F(x,3,12,2,2,'#7a4f2a');F(x,5,10,2,2,'#7a4f2a');F(x,7,8,2,2,'#7a4f2a');F(x,9,6,2,2,'#7a4f2a');F(x,5,3,8,2,'#c9d4f2');F(x,11,3,2,6,'#c9d4f2');F(x,4,4,2,2,'#8a93b8');F(x,6,3,6,1,'#eef3ff')});
A[44]=mk(x=>{F(x,2,4,10,2,'#fff');F(x,3,6,9,2,'#dbe8ff');F(x,4,8,8,2,'#fff');F(x,5,10,6,2,'#c4d8fa');F(x,12,3,2,4,'#bcd0ee')});
A[45]=mk(x=>{F(x,3,4,5,8,'#8a5a2b');F(x,3,11,9,3,'#5a3a1b');F(x,3,4,5,2,'#c9d4f2');F(x,9,12,3,1,'#c9a06a')});
A[46]=mk(x=>{F(x,4,5,8,9,'#8a6a3a');F(x,5,3,6,3,'#a58450');F(x,6,8,4,3,'#6fbf4a');F(x,7,9,2,1,'#b6f08a')});
A[16]=mk(x=>{F(x,7,10,2,6,'#4f8f2e');F(x,5,8,3,2,'#7bc043');F(x,8,6,3,2,'#7bc043');F(x,6,7,1,1,'#a5e06b')});
A[17]=mk(x=>{const r=mb(17);F(x,7,9,2,7,'#7a4f2a');for(let yy=0;yy<12;yy++)for(let xx=0;xx<16;xx++){const d=(xx-8)**2+(yy-6)**2;if(d<=25)F(x,xx,yy,1,1,['#2f8f3a','#287a31','#3fa648'][r()*3|0])}F(x,4,7,2,2,'#d92f2f');F(x,10,5,2,2,'#d92f2f');F(x,8,9,2,2,'#e8402e');F(x,6,4,1,1,'#ff7a5a')});
A[31]=mk(x=>{F(x,7,3,2,2,'#4f8f2e');F(x,5,5,6,7,'#d92f2f');F(x,6,12,4,2,'#d92f2f');F(x,6,6,1,3,'#ff7a5a')});
A.wall=mk(x=>{const r=mb(77);F(x,0,0,T,T,'#0a0608');sp(x,r,['#150e0d','#1b1311','#120b0a'],26);F(x,0,0,T,1,'rgba(255,255,255,.04)')});
const CR=[1,2,3,4].map(s=>mk(x=>{const r=mb(99);for(let i=0;i<s*9;i++)F(x,r()*T|0,r()*T|0,1+(r()*2|0),1,'rgba(10,6,10,.75)')}));
const GEM=document.createElement('canvas');GEM.width=GEM.height=8;
(x=>{['..0000..','.001111.','01111112','11111122','.111122.','..1122..','...22...'].forEach((row,y)=>[...row].forEach((ch,xx)=>{if(ch!='.')F(x,xx,y,1,1,{0:'#c4f4ff',1:'#4fd8ff',2:'#1b8fc0'}[ch])}))})(GEM.getContext('2d'));
$('#gi').getContext('2d').drawImage(GEM,0,0);

// ---------- character (traced from the kit, see sprite.js) ----------
const{HAIR,SHIRT,PANTS,SHOES,SKINN}=PRSprite;
const SPR=new Map(),look0=()=>({h:0,s:0,p:0,k:1,o:0});let look=look0();
function sprite(L,fr){const key=[L.h|0,L.s|0,L.p|0,L.k|0,L.o|0,L.w|0,fr].join();let c=SPR.get(key);if(c)return c;
 const b=PRSprite.build(L,fr);c=document.createElement('canvas');c.width=b.w;c.height=b.h;c.getContext('2d').putImageData(new ImageData(b.data,b.w,b.h),0,0);
 if(SPR.size>300)SPR.clear();SPR.set(key,c);return c}
// fx,fy = feet centre, u = Z, f = facing, an = gait, pt = punch timer (0.3 -> 0)
function drawChar(c,fx,fy,u,L,f,an,pt){
 const ph=pt>0?Math.min(3,Math.floor((1-pt/.3)*4)):-1,fr=ph>=0?3+ph:an>0?1:an<0?2:0,s=u*.3636,sp=sprite(L,fr),cx=PRSprite.CX*s;
 c.imageSmoothingEnabled=s<3;c.imageSmoothingQuality='high';c.fillStyle='rgba(0,0,0,.22)';c.fillRect(fx-9*s,fy-1.5*s,18*s,1.5*s);
 if(f>0)c.drawImage(sp,fx-cx,fy-sp.height*s,sp.width*s,sp.height*s);
 else{c.save();c.translate(fx,0);c.scale(-1,1);c.drawImage(sp,-cx,fy-sp.height*s,sp.width*s,sp.height*s);c.restore()}

 // --- TAMBAHAN KODE ANIMASI RAMBUT 12 FRAME ---
 if (L.hairItem === 47 || L.h === 47) {
     let animFrame = Math.floor(Date.now() / 80) % 12;
     let hairX = fx - 32 * s;
     let hairY = fy - sp.height * s - 18 * s;
     if (window.drawAnimatedHair) {
         window.drawAnimatedHair(c, animFrame, hairX, hairY);
     }
 }
}


// ---------- world ----------
let M,SU,AVG,BG,SAP={},DMG={},name='START',SPAWN={x:40.5,y:20};
const get=(x,y)=>x<0||x>=W||y>=H?4:y<0?0:M[x*H+y];
const set=(x,y,v)=>{M[x*H+y]=v};
const isS=(x,y)=>{const d=DEF[get(x,y)];return d&&d.s};
const isCave=(x,y)=>x>=0&&x<W&&y>=0&&y<H&&M[x*H+y]===0&&(BG[x*H+y]===1||(y>SU[x]&&BG[x*H+y]!==2));
const owns=id=>(inv[id]||0)>0,need=h=>owns(43)?Math.max(1,Math.round(h*.6)):h;

function gen(n){
 const s=strHash(n),m=new Uint8Array(W*H),su=[],c=W>>1;
 const sf=x=>22+Math.round((vn(x*.07,0,s)-.5)*14+(vn(x*.23,3,s)-.5)*3),fl=sf(c);
 for(let x=0;x<W;x++){
  const u=Math.abs(x-c)<=4?fl:sf(x),sand=Math.abs(x-c)>6&&vn(x*.06,9,s)>.7;su[x]=u;
  for(let y=0;y<H;y++){let id=0;
   if(x==0||x==W-1||y>=H-2)id=4;
   else if(y>=H-5)id=vn(x*.35,y*.5,s+3)>.45?5:3;
   else if(y>u+8){id=3;if(vn(x*.11,y*.13,s+7)>.66)id=0}
   else if(y>u)id=(sand&&y<=u+3)?6:2;
   else if(y==u)id=sand?6:1;
   m[x*H+y]=id}
  if(x==c){m[x*H+u-1]=10;m[x*H+u]=4}
  else if(x>4&&x<W-5&&Math.abs(x-c)>6&&!sand&&hash(x,1,s)<.09)m[x*H+u-1]=13;
 }
 return[m,su]}
function enc(m){const o=[];let p=m[0],c=1;for(let i=1;i<m.length;i++){if(m[i]==p&&c<65535)c++;else{o.push(p,c);p=m[i];c=1}}o.push(p,c);return o.join(',')}
function dec(s){const a=s.split(',').map(Number),m=new Uint8Array(W*H);let i=0;for(let k=0;k<a.length;k+=2)for(let j=0;j<a[k+1];j++){if(i>=m.length)return null;m[i++]=a[k]}return i==m.length?m:null}

let inv={2:10,30:5},gems=50;
let dirty=false,WS={owner:null,ownerName:'',locked:false,access:[],banned:[]},me=null,lastProf='',myRole='player',stamp='',noSave=false,syncing=false,lastEdit=0,EQ=[],DR=[],DQ=[],dropN=0;const RP={};
const wdata=()=>JSON.stringify({m:enc(M),b:enc(BG),su:SU,dr:DR.slice(-300).map(d=>[d.i,d.id,d.n,+d.x.toFixed(2),+d.y.toFixed(2)]),s:Object.entries(SAP).map(([i,t])=>[+i,t])});
function canEdit(){if(noSave)return false;if(me&&name==='START'&&!WS.locked&&!isMod(me.username))return false;if(!WS.locked)return true;if(!me)return false;const n=me.username.toLowerCase();if(WS.banned.includes(n)&&!isDev(me.username))return false;return WS.owner===me.id||WS.access.includes(n)}
let saveWarn=0;
function saveFail(e){const n=Date.now();if(n-saveWarn>30000){saveWarn=n;toast('Save failed: '+(e&&e.message||e))}}
// local mirror: every edit is written to this device first, so a refresh or a failed upload never loses it
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const LK=n=>'pr1w2:'+(me?me.id:'g')+':'+n,PK=()=>'pr1p:'+(me?me.id:'g');
let ldirty=false,lTimer=0;
function saveLocal(force){if(!M||noSave||!(ldirty||dirty||force))return;ldirty=false;lsSet(LK(name),{t:Date.now(),u:!!(me&&dirty),data:wdata()})}
async function saveWorld(){if(!M||noSave)return;
 saveLocal(!me);
 if(me){if(!dirty||!canEdit())return;dirty=false;const nm=name;
  try{await Net.saveWorld(nm,wdata());if(nm===name)lsSet(LK(nm),{t:Date.now(),u:dirty,data:wdata()})}catch(e){dirty=true;saveFail(e)}}}
async function saveAll(){const jobs=[saveWorld()];
 if(me){const q=JSON.stringify({gems,inv,look});if(q!==lastProf){lastProf=q;lsSet(PK(),{u:true,g:gems,inv,look});
  jobs.push(Net.saveProfile({gems,inv,look}).then(()=>{if(JSON.stringify({gems,inv,look})===q)lsSet(PK(),{u:false,g:gems,inv,look})}).catch(e=>{lastProf='';saveFail(e)}))}}
 else try{localStorage.setItem('pr1',JSON.stringify({g:gems,inv,look,w:name}))}catch(e){}
 await Promise.all(jobs)}

const P={x:0,y:0,vx:0,vy:0,g:false,f:1,jb:0,co:0,jh:false,arm:0,at:0,pt:0,dj:0};
function respawn(){Object.assign(P,{x:SPAWN.x,y:SPAWN.y,vx:0,vy:0});cam.x=P.x;cam.y=P.y-.5}
const cam={x:0,y:0};

async function loadWorld(n){
 n=(n||'START').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16)||'START';
 if(M)await saveWorld();
 name=n;SAP={};DMG={};PT.length=0;PO.length=0;dirty=false;WS={owner:null,ownerName:'',locked:false,access:[],banned:[]};
 let d=null,m=null;noSave=false;
 const loc=lsGet(LK(n));
 if(me){
  try{const r=await Net.getWorld(n);
   if(r){WS={owner:r.owner,ownerName:r.owner_name||'',locked:!!r.locked,access:r.access||[],banned:r.banned||[]};stamp=r.updated_at||'';
    try{d=JSON.parse(r.data)}catch(e){d=null}
    if(!(d&&d.m&&dec(d.m))){noSave=true;d=null;toast('Saved world could not be read. Editing is paused.')}}
   else stamp=''}
  catch(e){noSave=true;toast('Could not load your saved world. Editing is paused, retrying...')}
  if(noSave&&loc){try{d=JSON.parse(loc.data)}catch(e){}}                       // show the last copy from this device meanwhile
  else if(loc&&loc.u&&canEdit()){try{const ld=JSON.parse(loc.data);if(ld&&ld.m&&dec(ld.m)){d=ld;dirty=true;ldirty=true}}catch(e){}}   // unsaved edits win over the server copy
 }else{try{d=loc?JSON.parse(loc.data):JSON.parse(localStorage.getItem('pr1w:'+n))}catch(e){}}
 if(d&&d.m&&d.su)m=dec(d.m);
 if(m){M=m;SU=d.su;const now=Date.now();(d.s||[]).forEach(([i,t])=>{const g=GROWS[M[i]];if(!g)return;if(now-t>=g[1]*1e3)M[i]=g[0];else SAP[i]=t})}
 else[M,SU]=gen(n);
 BG=(d&&d.b&&dec(d.b))||new Uint8Array(W*H);
 DR=((d&&d.dr)||[]).slice(0,300).filter(a=>a[1]==='g'||DEF[a[1]]).map(a=>({i:String(a[0]),id:a[1],n:a[2]|0||1,x:+a[3],y:+a[4],vx:0,vy:0,age:9,rest:false}));DQ=[];
 AVG=SU.reduce((a,b)=>a+b,0)/W;
 const c=W>>1;SPAWN={x:c+.5,y:SU[c]-.001};
 for(let y=0;y<H;y++)if(M[c*H+y]==10){SPAWN.y=y+1-.001;if(y+1<H)M[c*H+y+1]=4;break}
 respawn();updWorldLabel();
 if(!me)try{localStorage.setItem('pr1l:'+n,Date.now())}catch(e){}
 if(me&&inWorld)joinRoom();
}

// ---------- audio ----------
let ac,mute=false;
function snd(f,d=.06,t='square',v=.045,s=0){if(mute)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime;o.type=t;o.frequency.setValueAtTime(f,n);if(s)o.frequency.exponentialRampToValueAtTime(s,n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(n+d)}catch(e){}}

// ---------- effects ----------
const PT=[],PO=[];
function burst(x,y,c,n){for(let i=0;i<n;i++)PT.push({x,y,vx:(Math.random()-.5)*7,vy:-Math.random()*6-1,l:.5+Math.random()*.4,c})}
function pop(t,g){PO.push({x:P.x+(Math.random()-.5)*.8,y:P.y-1.5,t:0,txt:t,g})}
let toastT;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),2200)}

// ---------- inventory / ui ----------
let sel=0,LIST=[0];
const HB=$('#hotbar');
const icon=id=>{const c=document.createElement('canvas');c.width=c.height=id==='gem'?8:T;c.getContext('2d').drawImage(id==='gem'?GEM:A[id],0,0);return c};
let hot=[],packOpen=false;
function refreshHotbar(){
 const ids=Object.keys(inv).map(Number).filter(i=>inv[i]>0&&DEF[i]&&DEF[i].p).sort((a,b)=>a-b);
 {const wf=owns(44)?1:0;if((look.w|0)!==wf){look.w=wf;if(me)Net.track({look})}}
 inv[42]=1;if(!ids.includes(42))ids.push(42);hot=hot.filter(i=>ids.includes(i));if(!hot.includes(42))hot.unshift(42);for(const i of ids)if(hot.length<8&&!hot.includes(i))hot.push(i);hot.length=Math.min(hot.length,8);
 LIST=[0,...hot];if(!LIST.includes(sel))sel=0;HB.innerHTML='';
 LIST.forEach((id,i)=>{const d=document.createElement('button');d.className='slot'+(id===sel?' on':'');d.title=id?DEF[id].n:'Fist';
  d.insertAdjacentHTML('beforeend',`<i>${i+1}</i>`);
  if(id){d.append(icon(id));d.insertAdjacentHTML('beforeend',`<b>${id===42?'':inv[id]}</b>`)}else d.insertAdjacentHTML('beforeend','<span>Fist</span>');
  d.onclick=()=>slotTap(id);HB.append(d)});
 $('#gems').textContent=gems;if(packOpen)renderPack(Object.keys(inv).map(Number).filter(i=>inv[i]>0&&DEF[i]&&(DEF[i].p||DEF[i].cur)).sort((a,b)=>a-b));saveSet();
}
let packSel=null;
function renderPack(ids){const g=$('#pgrid');g.innerHTML='';
 const mk=(id,label,cnt,icn)=>{const d=document.createElement('button');d.className='slot'+(id===packSel?' on':'');d.title=label;d.append(icn);
  d.insertAdjacentHTML('beforeend',`<b>${cnt}</b><span class="nm">${label}</span>`);d.onclick=()=>packTap(id);g.append(d)};
 mk('g','Gems',gems,icon('gem'));ids.forEach(id=>mk(id,DEF[id].n,DEF[id].perm?'':inv[id],icon(id)));updDrop()}
function packTap(id){packSel=id;if(id!=='g'){if(DEF[id].p&&id!==42&&!hot.includes(id)){if(hot.length>=8)hot[7]=id;else hot.push(id)}slotTap(id)}else refreshHotbar()}
function updDrop(){const n=packSel==='g'?gems:(inv[packSel]||0);if(packSel!=null&&n<=0)packSel=null;
 const nn=packSel==='g'?gems:(inv[packSel]||0);$('#pdn').textContent=packSel==null?'Tap an item to drop it':(packSel==='g'?'Gems':DEF[packSel].n)+' x'+(packSel!=='g'&&DEF[packSel].perm?'(owned)':nn)}
function doDrop(all){
 if(packSel==null||(packSel!=='g'&&DEF[packSel].perm))return;
 if(!inWorld){toast('Enter a world to drop items');return}
 if(!canEdit()){toast("You can't drop items in this world");return}
 const have=packSel==='g'?gems:(inv[packSel]||0);let n=all?have:Math.floor(+$('#pdq').value);n=Math.min(n,have);if(!(n>=1))return;
 if(packSel==='g')gems-=n;else{inv[packSel]-=n;if(inv[packSel]<=0)delete inv[packSel]}
 spawnDrop(packSel,n,P.x+P.f*.8,P.y-.2,P.f*2.5,-2);snd(300,.08,'triangle',.05,200);refreshHotbar();saveAll()}
$('#pdo').onclick=()=>doDrop(false);$('#pda').onclick=()=>doDrop(true);
const pick=i=>{if(LIST[i]!==undefined){sel=LIST[i];refreshHotbar()}};
const add=(id,n,show)=>{inv[id]=(inv[id]||0)+n;if(show)pop('+'+n+' '+DEF[id].n)};
const gain=n=>{gems+=n;pop('+'+n,1)};

function drops(id,d,x,y){
 const cx=x+.5,cy=y+.5;
 if(id===-1){spawnDrop(Math.random()<.5?2:30,1,cx,cy);return}
 if(id==5)return;if(id==15)id=14;
 if(id==13){spawnDrop('g',rnd(4,10),cx,cy);spawnDrop(30,rnd(1,2),cx,cy);if(Math.random()<.5)spawnDrop(7,rnd(1,3),cx,cy);return}
 if(id==12||id==16){spawnDrop(30,1,cx,cy);return}
 if(id==17){spawnDrop(30,rnd(3,5),cx,cy);return}
 spawnDrop(id,1,cx,cy);
 if(d.g&&Math.random()<d.g[0])spawnDrop('g',rnd(d.g[1],d.g[2]),cx,cy);
 if(d.sd&&Math.random()<d.sd)spawnDrop(30,1,cx,cy);
}
function spawnDrop(id,n,x,y,vx,vy){
 const i=(me?me.id.slice(0,4):'g')+(dropN++).toString(36)+Date.now().toString(36);
 vx=vx??(Math.random()-.5)*3;vy=vy??-3-Math.random()*2;
 DR.push({i,id,n,x,y,vx,vy,age:0,rest:false});if(DR.length>300)DR.shift();dirty=true;ldirty=true;
 if(me)DQ.push(['a',i,id,n,+x.toFixed(2),+y.toFixed(2),+vx.toFixed(2),+vy.toFixed(2)])}
function applyDrop(e){if(!Array.isArray(e))return;
 if(e[0]==='a'){const[,i,id,n,x,y,vx,vy]=e;
  if(typeof i!=='string'||i.length>24||!(id==='g'||(DEF[id]&&!DEF[id].perm))||!Number.isInteger(n)||n<1||n>1e6||DR.length>=300||DR.some(d=>d.i===i))return;
  DR.push({i,id,n,x:+x||0,y:+y||0,vx:+vx||0,vy:+vy||0,age:0,rest:false});if(canEdit()){dirty=true;ldirty=true}}
 else if(e[0]==='t'){const k=DR.findIndex(d=>d.i===e[1]);if(k>=0){DR.splice(k,1);if(canEdit()){dirty=true;ldirty=true}}}}
function collectDrop(k){const d=DR[k];if(!d)return;DR.splice(k,1);
 if(d.id==='g'){gems+=d.n;pop('+'+d.n,1)}else add(d.id,d.n,1);
 snd(760,.07,'triangle',.05,980);dirty=true;ldirty=true;if(me)DQ.push(['t',d.i]);refreshHotbar()}
function dropsTick(dt){
 for(let k=DR.length-1;k>=0;k--){const d=DR[k];d.age+=dt;
  if(!d.rest){d.vy=Math.min(d.vy+40*dt,25);const nx=d.x+d.vx*dt;if(isS(Math.floor(nx),Math.floor(d.y-.25)))d.vx*=-.3;else d.x=nx;d.y+=d.vy*dt;
   if(isS(Math.floor(d.x),Math.floor(d.y))){d.y=Math.floor(d.y)-.001;d.vy=0;d.vx*=.4;if(Math.abs(d.vx)<.2){d.vx=0;d.rest=true}}
   if(d.y>H+2){DR.splice(k,1);continue}}
  else if(!isS(Math.floor(d.x),Math.floor(d.y+.02)))d.rest=false;
  if(playing&&d.age>.45&&Math.abs(d.x-P.x)<.6&&Math.abs((d.y-.25)-(P.y-.5))<.7)collectDrop(k)}}

const modal=id=>{closeModals();$(id).hidden=false;document.body.classList.add('panel');if(id==='#mW'){$('#wi').value='';listWorlds();setTimeout(()=>$('#wi').focus(),30)}};
const closeModals=()=>{document.querySelectorAll('.modal').forEach(m=>m.hidden=true);document.body.classList.remove('panel')};
const anyModal=()=>[...document.querySelectorAll('.modal')].some(m=>!m.hidden);
function listWorlds(){
 const L=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('pr1l:'))L.push([k.slice(5),+localStorage.getItem(k)])}
 L.sort((a,b)=>b[1]-a[1]);const box=$('#wl');box.innerHTML='';
 L.slice(0,10).forEach(([n])=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>go(n);box.append(b)});
}
async function go(n){closeModals();await loadWorld(n);if(me)localStorage.setItem('pr1last',name);toast('Entered '+name);refreshHotbar();saveAll()}
$('#bS').onclick=()=>modal('#mS');
$('#bM').onclick=()=>{mute=!mute;$('#bM').classList.toggle('off',mute);saveSet()};


document.querySelectorAll('[data-x]').forEach(b=>b.onclick=closeModals);
SHOP.forEach(([id,q,p,sp])=>{const r=document.createElement('div');r.className='shoprow';r.append(icon(id));
 r.insertAdjacentHTML('beforeend',`<span>${DEF[id].n}${q>1?' x'+q:''}</span>`);
 const buy=(cost,cur)=>{if(id===40&&!me){toast('Log in to buy a Gold Lock');return}if(DEF[id].perm&&owns(id)){toast('You already own the '+DEF[id].n);return}
  if(cur==='g'){if(gems<cost){toast('Not enough gems');snd(120,.15,'sawtooth');return}gems-=cost}
  else{if((inv[30]||0)<cost){toast('Not enough seeds');snd(120,.15,'sawtooth');return}inv[30]-=cost;if(!inv[30])delete inv[30]}
  add(id,q);refreshHotbar();snd(520,.1,'triangle',.05,780);saveAll()};
 const b=document.createElement('button');b.className='btn go';b.append(String(p),icon('gem'));b.onclick=()=>buy(p,'g');r.append(b);
 if(sp){const b2=document.createElement('button');b2.className='btn go';b2.append(String(sp),icon(30));b2.onclick=()=>buy(sp,'s');r.append(b2)}
 $('#sl').append(r)});

// ---------- input ----------
const K={},tc={l:0,r:0,j:0};let playing=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;K[e.code]=1;
 if(/^Digit[1-9]$/.test(e.code))pick(+e.code[5]-1);
 if(e.code==='Escape')closeModals();
 if(e.code==='KeyF')punch();
 if(e.code==='Equal'||e.code==='NumpadAdd')zoom(1);
 if(e.code==='Minus'||e.code==='NumpadSubtract')zoom(-1);
 if(e.code==='Enter'&&playing&&!anyModal()){e.preventDefault();openChat()}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>{K[e.code]=0});addEventListener('blur',()=>{for(const k in K)K[k]=0;ptr.down=false});
[['#tL','l'],['#tR','r'],['#tJ','j']].forEach(([s,k])=>{const b=$(s);
 b.addEventListener('pointerdown',e=>{if(hudEdit)return;e.preventDefault();tc[k]=1;b.setPointerCapture(e.pointerId)});
 ['pointerup','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>tc[k]=0))});
const ptr={x:0,y:0,down:false,id:null,touch:false};
const upd=e=>{ptr.x=e.clientX*dpr;ptr.y=e.clientY*dpr};
const pts=new Map();let pinch=null;
const pdist=()=>{const[a,b]=[...pts.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
cv.addEventListener('pointerdown',e=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pts.size>=2){ptr.down=false;pinch={d:Math.max(pdist(),1),z:zoomOff};return}
 if(pinch)return;
 ptr.down=true;ptr.id=e.pointerId;ptr.touch=e.pointerType!=='mouse';upd(e);P.at=0;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{if(pts.has(e.pointerId))pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&pts.size>=2){zoomTo(pinch.z+Math.round(Math.log(pdist()/pinch.d)/Math.log(1.3)));return}
 if(e.pointerType==='mouse'){ptr.touch=false;upd(e)}else if(e.pointerId===ptr.id)upd(e)});
['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,e=>{pts.delete(e.pointerId);if(!pts.size)pinch=null;if(e.pointerId===ptr.id)ptr.down=false}));
cv.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?1:-1)},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
$('#play').onclick=start;
function start(){snd(440,.1,'triangle',.05,880);showHome()}

// ---------- view ----------
let dpr=1,Z=3,TS=48,OX=0,OY=0;
let baseZ=3,zoomOff=0;try{zoomOff=+localStorage.getItem('pr1zoom')||0}catch(e){}
const zoomTo=v=>{Z=clamp(baseZ+v,1,10);zoomOff=Z-baseZ;try{localStorage.setItem('pr1zoom',zoomOff)}catch(e){}};
const zoom=d=>zoomTo(zoomOff+d);
function resize(){dpr=Math.min(devicePixelRatio||1,3);cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);
 baseZ=Math.max(2,Math.floor(Math.min(cv.height/(T*14),cv.width/(T*9))));zoomTo(zoomOff)}
addEventListener('resize',resize);resize();
function view(){TS=T*Z;OX=Math.round(-cam.x*TS+cv.width/2);OY=Math.round(-cam.y*TS+cv.height/2)}

// ---------- physics ----------
function box(){return[Math.floor(P.x-PW),Math.floor(P.x+PW),Math.floor(P.y-PH),Math.floor(P.y-.001)]}
function colX(){const[a,b,c,d]=box();for(let x=a;x<=b;x++)for(let y=c;y<=d;y++)if(isS(x,y)){if(P.vx>0)P.x=x-PW-.001;else if(P.vx<0)P.x=x+1+PW+.001;else continue;P.vx=0;return}}
function colY(){const[a,b,c,d]=box();for(let x=a;x<=b;x++)for(let y=c;y<=d;y++)if(isS(x,y)){if(P.vy>0){P.y=y-.001;P.g=true;if(get(x,y)===19)BNC=1}else if(P.vy<0)P.y=y+1+PH+.001;else continue;P.vy=0;return}}
const overlap=(tx,ty)=>P.x+PW>tx&&P.x-PW<tx+1&&P.y>ty&&P.y-PH<ty+1;
function die(msg){hp=5;drawHp();$('#flash').classList.add('on');requestAnimationFrame(()=>requestAnimationFrame(()=>$('#flash').classList.remove('on')));
 burst(P.x,P.y-.5,'#ff6e1e',16);snd(90,.35,'sawtooth',.07,40);toast(msg||'Burned. Back to the door.');respawn()}

// ---------- actions ----------
let HV=null,hp=5,hurtT=0,regT=0,wLatch=false,PTRW={x:0,y:0},BNC=0;
let lastDeny=0,claiming=false;
function deny(){const n=performance.now();if(n-lastDeny<1500)return;lastDeny=n;toast(noSave?'World is still loading. Try again in a few seconds.':me&&name==='START'&&!WS.locked?'START is protected. Only moderators can build here.':'This world is locked by '+(WS.ownerName||'its owner'))}
function edit(x,y,v){dirty=true;ldirty=true;lastEdit=performance.now();if(me)EQ.push([x,y,v]);if(!lTimer)lTimer=setTimeout(()=>{lTimer=0;saveLocal()},600)}
async function claim(tx,ty,lk){
 if(!me)return toast('Log in to use a Gold Lock');
 if(name==='START'&&!isMod(me.username))return toast('Only moderators can lock START');
 if(WS.locked)return toast('This world is already locked');
 if(overlap(tx,ty))return;
 claiming=true;set(tx,ty,lk);
 try{await Net.saveProfile({gems,inv,look});await Net.claim(name,wdata())}
 catch(e){set(tx,ty,0);claiming=false;return toast(e.message)}
 if(--inv[lk]<=0)delete inv[lk];
 WS={owner:me.id,ownerName:me.username,locked:true,access:[],banned:[]};dirty=false;updWorldLabel();
 Net.send('lock',{owner:me.id,ownerName:me.username});
 toast('World locked. Only you can build here.');snd(300,.25,'triangle',.06,900);refreshHotbar();saveAll();claiming=false}
async function unlockWorld(tx,ty,lk){
 try{await Net.unlock(name)}catch(e){set(tx,ty,lk);return toast(e.message)}
 add(lk,1);WS={owner:null,ownerName:'',locked:false,access:[],banned:[]};dirty=true;updWorldLabel();
 Net.send('lock',{owner:null});toast('World unlocked. Gold Lock returned.');refreshHotbar()}
function fert(tx,ty,id){const g=GROWS[id];if(!g){toast('Use Fertilizer on a sapling');return}
 if(!(inv[46]>0))return;const k=tx*H+ty;set(tx,ty,g[0]);delete SAP[k];edit(tx,ty,g[0]);
 if(--inv[46]<=0)delete inv[46];burst(tx+.5,ty+.5,'#6fbf4a',12);snd(660,.15,'triangle',.05,990);refreshHotbar()}
function act(tx,ty){
 const id=get(tx,ty);
 if(sel===42){wrenchTap(tx,ty);return}
 if(!canEdit()){if(id||sel)deny();return}
 if(sel===46){fert(tx,ty,id);return}
 if(sel===0){
  const k=tx*H+ty,cave=isCave(tx,ty),d=cave?CAVE:DEF[id];if(!d||!d.h)return;
  const now=performance.now();let c=DMG[k];
  if(!c||now-c.t>2000)c=DMG[k]={h:0,t:0};
  c.h++;c.t=now;snd(150+Math.random()*50,.04,'square',.04);burst(tx+.5,ty+.5,d.c,2);
  if(c.h<need(d.h))return;
  if(cave){delete DMG[k];BG[k]=2;edit(tx,ty,-1);burst(tx+.5,ty+.5,'#3a2a26',12);snd(110,.12,'sawtooth',.06,50);drops(-1,d,tx,ty);refreshHotbar();return}
  delete DMG[k];delete SAP[k];BG[k]=1;set(tx,ty,0);edit(tx,ty,0);
  const a=get(tx,ty-1);if(a==12||a==13||a==16||a==17){set(tx,ty-1,0);delete SAP[tx*H+ty-1];edit(tx,ty-1,0)}
  burst(tx+.5,ty+.5,d.c,12);snd(110,.12,'sawtooth',.06,50);
  if(id==40||id==41)unlockWorld(tx,ty,id);else drops(id,d,tx,ty);
  refreshHotbar();
 }else{
  if(id!==0||tx<1||tx>=W-1||ty<1||ty>=H-2||!(inv[sel]>0))return;
  const d=DEF[sel];
  if(d.nopl){toast('Double-tap the Diamond Lock to get 100 Gold Locks');return}
  if(sel===40||sel===41){if(!claiming)claim(tx,ty,sel);return}
  if(sel===30||sel===31){const b=get(tx,ty+1);if(b!=1&&b!=2){toast('Plant on grass or dirt');return}const cell=sel===30?12:16;set(tx,ty,cell);SAP[tx*H+ty]=Date.now();edit(tx,ty,cell)}
  else{if(d.s&&overlap(tx,ty))return;set(tx,ty,sel);edit(tx,ty,sel)}
  if(--inv[sel]<=0)delete inv[sel];
  snd(240,.07,'triangle',.05,330);refreshHotbar();
 }
}
let gt=0;
function grow(){const now=Date.now();for(const k in SAP){const x=Math.floor(k/H),y=k%H,g=GROWS[M[k]];if(!g){delete SAP[k];continue}
 if(now-SAP[k]>=g[1]*1e3){set(x,y,g[0]);delete SAP[k];burst(x+.5,y+.5,'#43a248',10);if(Math.abs(x-P.x)<12)snd(600,.15,'triangle',.04,900)}}}

// ---------- update ----------
function update(dt){
 const l=K.KeyA||K.ArrowLeft||tc.l,r=K.KeyD||K.ArrowRight||tc.r,j=K.Space||K.KeyW||K.ArrowUp||tc.j;
 const ok=playing&&!anyModal()&&!hudEdit,dir=ok?(r?1:0)-(l?1:0):0;
 if(dir)P.f=dir;
 P.vx+=(dir*(owns(45)?9:7)-P.vx)*Math.min(1,dt*(P.g?18:9));
 const jj=ok&&j,lad=get(Math.floor(P.x),Math.floor(P.y-.4))===18;if(jj&&!P.jh)P.jb=.1;P.jh=jj;P.jb-=dt;P.co-=dt;if(P.g){P.co=.09;P.dj=0}
 if(lad){P.vy=jj?-4.5:(K.KeyS||K.ArrowDown)?4.5:0;P.dj=0}
 else if(P.jb>0&&P.co>0){P.vy=-17;P.co=0;P.jb=0;P.g=false;snd(380,.09,'square',.04,620)}
 else if(P.jb>0&&owns(44)&&P.dj<1&&!P.g){P.vy=-15;P.dj=1;P.jb=0;burst(P.x,P.y-.3,'#ffffff',10);snd(520,.1,'triangle',.05,900)}
 if(!lad){if(!jj&&P.vy<-5)P.vy+=90*dt;P.vy=Math.min(P.vy+60*dt,34)}
 P.x+=P.vx*dt;colX();P.g=false;P.y+=P.vy*dt;colY();if(BNC){BNC=0;P.vy=-24;P.g=false;P.dj=0;snd(300,.15,'square',.05,700);burst(P.x,P.y,'#7be07b',8)}
 if(get(Math.floor(P.x),Math.floor(P.y-.3))==5||get(Math.floor(P.x),Math.floor(P.y-.75))==5)lavaHit();
 // camera
 const hw=cv.width/(2*TS),hh=cv.height/(2*TS);
 let tx=P.x,ty=P.y-.5;
 tx=hw*2>=W?W/2:clamp(tx,hw,W-hw);ty=clamp(ty,hh-8,Math.max(hh-8,H-hh));
 const a=1-Math.exp(-dt*9);cam.x+=(tx-cam.x)*a;cam.y+=(ty-cam.y)*a;
 view();
 // pointer
 HV=null;
 if(ok&&(!ptr.touch||ptr.down)){
  const tx2=Math.floor((ptr.x-OX)/TS),ty2=Math.floor((ptr.y-OY)/TS);PTRW={x:(ptr.x-OX)/TS,y:(ptr.y-OY)/TS};
  if(tx2>=0&&tx2<W&&ty2>=0&&ty2<H)HV={x:tx2,y:ty2,ok:Math.hypot(tx2+.5-P.x,ty2+.5-(P.y-.5))<=REACH};
 }
 P.at-=dt;P.arm=Math.max(0,P.arm-dt);P.pt=Math.max(0,P.pt-dt);pcd-=dt;hurtT-=dt;if(hp<5){regT+=dt;if(regT>8){regT=0;hp++;drawHp()}}
 if(!ptr.down)wLatch=false;
 if(ok&&ptr.down&&HV&&(HV.ok||sel===42)&&P.at<=0){P.at=owns(43)?.09:.12;P.arm=.15;if(sel===0)P.pt=.3;act(HV.x,HV.y)}
 gt+=dt;if(gt>1){gt=0;grow()}
 netTick(dt);dropsTick(dt);
 for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.l-=dt;p.vy+=30*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.l<=0)PT.splice(i,1)}
 for(let i=PO.length-1;i>=0;i--){const p=PO[i];p.t+=dt;p.y-=1.4*dt;if(p.t>1.1)PO.splice(i,1)}
}

// ---------- draw ----------
function draw(t){
 const cw=cv.width,ch=cv.height,ts=TS;
 ctx.imageSmoothingEnabled=false;
 const hz=Math.round(AVG*ts+OY);
 const ph=(Date.now()/1000%DAYLEN)/DAYLEN,dl=clamp(Math.sin(ph*Math.PI*2)*1.5+.55,0,1),dusk=1-Math.abs(dl*2-1);
 const mx=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k)),rgb=a=>`rgb(${a[0]},${a[1]},${a[2]})`;
 const top=mx([10,14,44],[74,151,230],dl),bot=mx(mx([34,40,92],[210,236,253],dl),[255,170,110],dusk*.6);
 const g=ctx.createLinearGradient(0,hz-ch,0,hz);g.addColorStop(0,rgb(top));g.addColorStop(1,rgb(bot));ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);
 if(dl<.6){ctx.fillStyle=`rgba(255,255,255,${(1-dl/.6)*.9})`;for(let i=0;i<70;i++){const sx=(hash(i,3,11)*cw)|0,sy=(hash(i,9,5)*Math.max(1,hz))|0;if(sy<0||sy>hz)continue;if(Math.sin(t*2+i)>-.4)ctx.fillRect(sx,sy,i%5===0?Z*1.6:Z,i%5===0?Z*1.6:Z)}}
 {const pr=(ph*2)%1,up=ph<.5,sx=cw*(.12+.76*pr),sy=hz-ch*(.2+.45*Math.sin(pr*Math.PI));ctx.fillStyle=up?'#ffe27a':'#e8eeff';ctx.fillRect(Math.round(sx),Math.round(sy),Math.round(ts*1.2),Math.round(ts*1.2));if(!up){ctx.fillStyle='#c4cde8';ctx.fillRect(Math.round(sx+ts*.3),Math.round(sy+ts*.3),Math.round(ts*.3),Math.round(ts*.3))}}
 [[.12,'#a4c9e8',8,.05,2],[.28,'#86b0d3',5,.1,7]].forEach(([p,c,h,s,o])=>{ctx.fillStyle=c;const st=4*Z;
  for(let px=-st;px<cw+st;px+=st){const u=(px+cam.x*ts*p)/ts,hg=Math.round((vn(u*s*3,o,7)*h+1.5)*ts*.7/st)*st;ctx.fillRect(px,hz-hg,st+1,hg+ts*8)}});
 ctx.fillStyle='rgba(255,255,255,.92)';
 for(let i=0;i<6;i++){const x=((i*263+t*(5+i*2)-cam.x*ts*.06)%(cw+400)+cw+400)%(cw+400)-200,y=hz-Math.round((5+(i%3)*2.6)*ts),w=(7+(i%3)*3)*Z*2;
  ctx.fillRect(x,y,w,Z*4);ctx.fillRect(x+Z*4,y-Z*3,w-Z*10,Z*3)}
 const x0=Math.max(0,Math.floor(-OX/ts)),x1=Math.min(W-1,Math.ceil((cw-OX)/ts)),y0=Math.max(0,Math.floor(-OY/ts)),y1=Math.min(H-1,Math.ceil((ch-OY)/ts)),lf=Math.floor(t*3)%2;LANT.length=0;
 for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
  const id=M[x*H+y],px=x*ts+OX,py=y*ts+OY,under=y>SU[x],wl=BG[x*H+y]===1||(under&&BG[x*H+y]!==2);
  if(id===0){if(wl)ctx.drawImage(A.wall,px,py,ts,ts);continue}
  if(wl&&!DEF[id].s)ctx.drawImage(A.wall,px,py,ts,ts);
  ctx.drawImage(id===5?A[5][lf]:A[id],px,py,ts,ts);if(id===20)LANT.push([px,py])}
 for(const k in DMG){const c=DMG[k],id=M[k],dd=id===0&&isCave(Math.floor(k/H),k%H)?CAVE:DEF[id];if(!dd||!dd.h||c.h<1)continue;
  ctx.drawImage(CR[clamp(Math.ceil(c.h/need(dd.h)*4),1,4)-1],Math.floor(k/H)*ts+OX,k%H*ts+OY,ts,ts)}
 if(HV){const px=HV.x*ts+OX,py=HV.y*ts+OY;
  if(sel&&HV.ok&&get(HV.x,HV.y)===0){ctx.globalAlpha=.45;ctx.drawImage(A[sel],px,py,ts,ts);ctx.globalAlpha=1}
  ctx.lineWidth=Z;ctx.strokeStyle=HV.ok?'#fff':'#ff5a5a';ctx.strokeRect(px+Z/2,py+Z/2,ts-Z,ts-Z);
  const hid=get(HV.x,HV.y),hn=hid?(DEF[hid]||{}).n:isCave(HV.x,HV.y)?'Cave':'';
  if(hn){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${Math.round(3.4*Z)}px "Press Start 2P",monospace`;ctx.fillStyle='#000';ctx.fillText(hn,px+ts/2+Z/2,py-Z*3+Z/2);ctx.fillStyle='#f3e6c4';ctx.fillText(hn,px+ts/2,py-Z*3);ctx.textAlign='left'}}
 for(const d of DR){const px=Math.round(d.x*ts+OX),py=Math.round(d.y*ts+OY)+(d.rest?Math.round(Math.sin(t*3+d.x*5)*Z*.8):0),w=Math.round(ts*.5);
  if(px<-ts||px>cw+ts||py<-ts||py>ch+ts)continue;
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(px-w/2,py-Z,w,Z);ctx.drawImage(d.id==='g'?GEM:A[d.id],px-w/2,py-w-Z,w,w);
  if(d.n>1){ctx.textAlign='right';ctx.textBaseline='middle';ctx.font=`${Math.round(2.8*Z)}px "Press Start 2P",monospace`;ctx.fillStyle='#000';ctx.fillText(d.n,px+w/2+Z/2,py-Z*2+Z/2);ctx.fillStyle='#f3e6c4';ctx.fillText(d.n,px+w/2,py-Z*2);ctx.textAlign='left'}}
 // players
 {const plate=(x,y,nm,own,chat,ct,vt)=>{const px=Math.round(x*ts+OX),py=Math.round(y*ts+OY)-24*Z;
   ctx.textAlign='center';ctx.font=`${Math.round(3.4*Z)}px "Press Start 2P",monospace`;
   const nt=dn(nm);ctx.fillStyle='#000';ctx.fillText(nt,px+Z/2,py+Z/2);ctx.fillStyle=isMod(nm)?'#ff6ec7':own?'#5fe05f':'#ffffff';ctx.fillText(nt,px,py);
   if(vt&&performance.now()-vt<700){ctx.fillStyle='#5fe05f';ctx.fillRect(Math.round(px-ctx.measureText(nt).width/2-Z*4),Math.round(py-Z*1.2),Math.round(Z*2.4),Math.round(Z*2.4))}
   if(chat&&ct>0){const w=ctx.measureText(chat).width+Z*6,by=py-Z*8;ctx.globalAlpha=clamp(ct,0,1);ctx.fillStyle='#fff';ctx.fillRect(px-w/2,by-Z*4,w,Z*8);ctx.fillStyle='#2b1d14';ctx.fillText(chat,px,by);ctx.globalAlpha=1}
   ctx.textAlign='left'};
  for(const id in RP){const r=RP[id];if(r.first||!r.look)continue;
   drawChar(ctx,Math.round(r.x*ts+OX),Math.round(r.y*ts+OY),Z,r.look,r.f,r.w?Math.round(Math.sin(t*16)*1.5):0,r.pt||0);
   plate(r.x,r.y,r.name||'?',id===WS.owner,r.chat,r.chatT,Net.talking?Net.talking[id]:0)}
  const walk=Math.abs(P.vx)>.8&&P.g;
  drawChar(ctx,Math.round(P.x*ts+OX),Math.round(P.y*ts+OY),Z,look,P.f,walk?Math.round(Math.sin(t*16)*1.5):0,P.pt);
  plate(P.x,P.y,me?me.username:'Guest',!!me&&WS.owner===me.id,myChat,myChatT)}

 for(const p of PT){ctx.globalAlpha=clamp(p.l*2.5,0,1);ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x*ts+OX),Math.round(p.y*ts+OY),Z*2,Z*2)}ctx.globalAlpha=1;
 ctx.font=`${Math.round(4.5*Z)}px "Press Start 2P",monospace`;ctx.textBaseline='middle';
 for(const p of PO){const px=Math.round(p.x*ts+OX),py=Math.round(p.y*ts+OY);ctx.globalAlpha=clamp(2-p.t*1.8,0,1);
  ctx.fillStyle='#000';ctx.fillText(p.txt,px+Z,py+Z);ctx.fillStyle=p.g?'#4fd8ff':'#f3e6c4';ctx.fillText(p.txt,px,py);
  if(p.g)ctx.drawImage(GEM,px+ctx.measureText(p.txt).width+Z*2,py-Z*4,Z*8,Z*8);ctx.globalAlpha=1}
 // cave light
 ctx.fillStyle=`rgba(8,12,44,${(1-dl)*.4})`;ctx.fillRect(0,0,cw,ch);
 const dk=clamp((P.y-AVG-4)/26,0,.78);
 if(dk>0){const cx=P.x*ts+OX,cy=(P.y-.5)*ts+OY,gr=ctx.createRadialGradient(cx,cy,ts*3,cx,cy,ts*11);gr.addColorStop(0,'rgba(6,3,12,0)');gr.addColorStop(1,`rgba(6,3,12,${dk})`);ctx.fillStyle=gr;ctx.fillRect(0,0,cw,ch)}
 if(LANT.length){ctx.globalCompositeOperation='lighter';for(const[lx,ly]of LANT){const cx=lx+ts/2,cy=ly+ts/2,g2=ctx.createRadialGradient(cx,cy,ts*.2,cx,cy,ts*4.5);g2.addColorStop(0,'rgba(255,200,100,.5)');g2.addColorStop(1,'rgba(255,200,100,0)');ctx.fillStyle=g2;ctx.fillRect(cx-ts*5,cy-ts*5,ts*10,ts*10)}ctx.globalCompositeOperation='source-over'}
}

// ---------- online: world label, room, chat ----------
const CL=$('#clog'),CI=$('#chatIn');let myChat='',myChatT=0,lastSay=0,voiceOn=false,lx=0,ly=0,st=0;
function updWorldLabel(){$('#wname').textContent=name+(WS.locked?' | '+WS.ownerName:'')}
function joinRoom(){
 for(const k in RP)delete RP[k];
 Net.join(name,{id:me.id,name:me.username,look,voice:voiceOn},{
  presence(stt){const seen={};
   for(const id in stt){if(id===me.id)continue;const m=stt[id][0];seen[id]=1;
    let r=RP[id];if(!r){r=RP[id]={x:SPAWN.x,y:SPAWN.y,tx:SPAWN.x,ty:SPAWN.y,f:1,w:0,a:0,first:true};sysMsg(m.name+' joined')}
    r.name=m.name;r.look=m.look}
   for(const id in RP)if(!seen[id]){sysMsg((RP[id].name||'Player')+' left');delete RP[id]}},
  pos(p){if(Array.isArray(p.e))p.e.forEach(e=>applyEdit(p.id,e[0],e[1],e[2]));if(Array.isArray(p.d))p.d.forEach(applyDrop);const r=RP[p.id];if(!r||typeof p.x!=='number')return;r.tx=p.x;r.ty=p.y;r.f=p.f>0?1:-1;r.w=p.w;r.a=p.a;if(p.a&&!(r.pt>0))r.pt=.3;if(r.first){r.x=p.x;r.y=p.y;r.first=false}},
  edit(p){applyEdit(p.u,p.x,p.y,p.v)},
  chat(p){if(typeof p.t!=='string')return;const t=p.t.slice(0,120);addLog(String(p.name).slice(0,16),t);const r=RP[p.id];if(r){r.chat=t;r.chatT=4}},
  cmd(p){onCmd(p)},
  trade(p){onTrade(p)},
  lock(p){WS=p.owner?{owner:p.owner,ownerName:String(p.ownerName||'').slice(0,16),locked:true,access:(p.access||[]).slice(0,60).map(String),banned:(p.banned||[]).slice(0,60).map(String)}:{owner:null,ownerName:'',locked:false,access:[],banned:[]};updWorldLabel()}
 });
}
function netTick(dt){
 myChatT-=dt;
 if(me){const now=performance.now(),mv=Math.abs(P.x-lx)+Math.abs(P.y-ly)>.01||P.pt>0;
  if(now-st>((mv||EQ.length||DQ.length)?150:900)){st=now;lx=P.x;ly=P.y;const pl={id:me.id,x:+P.x.toFixed(2),y:+P.y.toFixed(2),f:P.f,w:Math.abs(P.vx)>.8&&P.g?1:0,a:P.pt>0?1:0};if(EQ.length)pl.e=EQ.splice(0,60);if(DQ.length)pl.d=DQ.splice(0,40);Net.send('pos',pl)}}
 for(const id in RP){const r=RP[id],a=1-Math.exp(-dt*14);r.x+=(r.tx-r.x)*a;r.y+=(r.ty-r.y)*a;if(r.chatT>0)r.chatT-=dt;if(r.pt>0)r.pt-=dt;
  if(voiceOn)Net.setVol(id,clamp(1-Math.hypot(r.x-P.x,r.y-P.y)/30,0,1))}
}
$('#bV').onclick=async()=>{
 if(!me){toast('Log in to use voice chat');return}
 try{voiceOn=await Net.voice(!voiceOn)}catch(e){voiceOn=false;toast(e&&e.name==='NotAllowedError'?'Microphone blocked. Allow it in your browser settings.':'Voice error: '+(e&&e.message||e))}
 $('#bV').classList.toggle('on',voiceOn);toast(voiceOn?'Voice on. You hear players who also turned their mic on.':'Voice off')};

// ---------- style editor ----------
const ROWS=[['Hair','h',HAIR,2],['Shirt','s',SHIRT,3],['Pants','p',PANTS,3],['Shoes','o',SHOES,3],['Skin','k',SKINN,-1]];
function drawPrev(){const c=$('#stPrev'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#a6d2f6';g.fillRect(0,0,c.width,c.height);g.fillStyle='#68b03e';g.fillRect(0,c.height-20,c.width,20);drawChar(g,c.width/2,c.height-20,7.7,look,1,0,0)}
function buildStyle(){const b=$('#stRows');b.innerHTML='';
 ROWS.forEach(([t,k,arr,ni])=>{const n=arr.length,r=document.createElement('div');r.className='strow';
  r.innerHTML=`<span>${t}</span><button class="btn">&lt;</button><em></em><button class="btn">&gt;</button>`;
  const[,pv,em,nx]=r.children,u=()=>{const it=arr[look[k]];em.textContent=(look[k]+1)+'/'+n+' '+(ni<0?it:it[ni]);drawPrev()};
  pv.onclick=()=>{look[k]=(look[k]+n-1)%n;u()};nx.onclick=()=>{look[k]=(look[k]+1)%n;u()};u();b.append(r)});
 $('#stOut').hidden=!me}
$('#bY').onclick=()=>{buildStyle();modal('#mY')};
$('#stDone').onclick=()=>{closeModals();saveAll();if(me)Net.track({look})};
$('#stOut').onclick=async()=>{await saveAll();await Net.signOut();location.reload()};

// ---------- roulette ----------
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]),ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const BETS=[['red','Red'],['black','Black'],['odd','Odd'],['even','Even'],['low','1-18'],['high','19-36'],['d1','1st 12'],['d2','2nd 12'],['d3','3rd 12'],['num','Number']];
const mult=(k,n,r)=>{const o={red:r>0&&REDS.has(r),black:r>0&&!REDS.has(r),odd:r>0&&r%2==1,even:r>0&&r%2==0,low:r>=1&&r<=18,high:r>=19,d1:r>=1&&r<=12,d2:r>=13&&r<=24,d3:r>=25,num:r==n}[k];return o?({d1:2,d2:2,d3:2,num:35}[k]||1):0};
let bet='red',spinning=false,rot=0;
function drawWheel(){const c=$('#rw'),g=c.getContext('2d'),R=120,a=Math.PI*2/37;g.clearRect(0,0,260,260);g.save();g.translate(130,130);g.rotate(rot);
 ORDER.forEach((n,i)=>{g.beginPath();g.moveTo(0,0);g.arc(0,0,R,-Math.PI/2+i*a,-Math.PI/2+(i+1)*a);g.fillStyle=n==0?'#2f8f3a':REDS.has(n)?'#b8332b':'#1b1612';g.fill();g.strokeStyle='#d9b06a';g.lineWidth=1;g.stroke();
  g.save();g.rotate(-Math.PI/2+(i+.5)*a);g.translate(R-12,0);g.rotate(Math.PI/2);g.fillStyle='#f3e6c4';g.font='8px "Press Start 2P",monospace';g.textAlign='center';g.fillText(n,0,3);g.restore()});
 g.beginPath();g.arc(0,0,62,0,7);g.fillStyle='#4a3220';g.fill();g.strokeStyle='#d9b06a';g.lineWidth=3;g.stroke();g.restore();
 g.fillStyle='#fff';g.beginPath();g.moveTo(122,4);g.lineTo(138,4);g.lineTo(130,22);g.fill()}
function buildCasino(){const b=$('#rb');BETS.forEach(([k,t])=>{const x=document.createElement('button');x.textContent=t;x.dataset.k=k;if(k===bet)x.className='on';
  x.onclick=()=>{bet=k;b.querySelectorAll('button').forEach(q=>q.classList.toggle('on',q===x));$('#rn').hidden=k!=='num'};b.append(x)});
 document.querySelectorAll('[data-a]').forEach(x=>x.onclick=()=>$('#ra').value=x.dataset.a);drawWheel();$('#rs').onclick=spin}
$('#bC').onclick=()=>{$('#rnote').textContent=me?'Online: results are drawn on the server.':'Guest mode: results are drawn on this device.';modal('#mC')};
const ease=x=>1-Math.pow(1-x,3);
const roll=end=>new Promise(res=>{const s=rot,t0=performance.now();(function f(n){const k=Math.min(1,(n-t0)/3400);rot=s+(end-s)*ease(k);drawWheel();k<1?requestAnimationFrame(f):res()})(t0)});
async function spin(){
 if(spinning)return;const amt=Math.floor(+$('#ra').value),num=Math.floor(+$('#rn').value),box=$('#rres');
 if(!(amt>=1&&amt<=1000))return toast('Bet 1-1000 gems');if(amt>gems)return toast('Not enough gems');
 if(bet==='num'&&!(num>=0&&num<=36))return toast('Pick a number from 0 to 36');
 spinning=true;box.className='';box.textContent='Spinning...';let r,delta,ng;
 try{if(me){await Net.saveProfile({gems,inv,look});const d=await Net.spin(bet,num,amt);r=d.r;delta=d.delta;ng=d.gems}
  else{r=Math.floor(Math.random()*37);const m=mult(bet,num,r);delta=m?amt*m:-amt;ng=gems+delta}}
 catch(e){spinning=false;box.textContent=e.message;return}
 const a=Math.PI*2/37,target=-(ORDER.indexOf(r)+.5)*a,diff=((target-rot)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
 snd(300,.5,'sawtooth',.02,120);await roll(rot+diff+Math.PI*2*5);
 gems=ng;lastProf='';refreshHotbar();saveAll();
 const col=r==0?'green':REDS.has(r)?'red':'black';
 box.className=delta>0?'win':'lose';box.textContent=`Landed on ${r} (${col}). ${delta>0?'You won '+delta:'You lost '+(-delta)} gems.`;
 snd(delta>0?660:140,.3,delta>0?'triangle':'sawtooth',.06,delta>0?990:70);spinning=false}

const isDev=n=>String(n||'').toLowerCase()==='diaszt';
function addLog(who,txt,sys){const d=document.createElement('div');if(sys)d.className='sys';else{const b=document.createElement('b');b.textContent=dn(who)+': ';if(isMod(who))b.style.color='#ff6ec7';d.append(b)}
 d.append(document.createTextNode(txt));const bot=CL.scrollHeight-CL.scrollTop-CL.clientHeight<28;CL.append(d);while(CL.children.length>300)CL.firstChild.remove();if(bot)CL.scrollTop=CL.scrollHeight}
const sysMsg=t=>addLog('',t,1);
function openChat(){if(!me){toast('Log in to chat with other players');return}for(const k in K)K[k]=0;if(cp.classList.contains('min'))chatSet(150);CI.focus()}
CI.addEventListener('keydown',e=>{
 if(e.key==='Enter'){const t=CI.value.trim().slice(0,120);CI.value='';CI.blur();if(!t)return;
  if(!me){toast('Log in to chat with other players');return}
  if(t[0]==='/'){runCmd(t);return}
  if(performance.now()-lastSay>800){lastSay=performance.now();addLog(me.username,t);myChat=t;myChatT=4;Net.send('chat',{id:me.id,name:me.username,t})}}
 else if(e.key==='Escape'){CI.value='';CI.blur()}});
const cg=$('#cgrip'),cp=$('#chat'),cpn=$('#cpanel');let cr=null;
function chatSet(total){total=clamp(total,0,innerHeight*.6);const mn=total<70;cp.classList.toggle('min',mn);if(!mn)CL.style.height=Math.max(36,total-62)+'px';saveSet()}
cg.addEventListener('pointerdown',e=>{cr={y:e.clientY,h:cp.classList.contains('min')?0:cpn.offsetHeight,moved:false};cg.setPointerCapture(e.pointerId);e.preventDefault()});
cg.addEventListener('pointermove',e=>{if(!cr)return;const dy=e.clientY-cr.y;if(Math.abs(dy)>4)cr.moved=true;chatSet(cr.h+dy)});
['pointerup','pointercancel'].forEach(ev=>cg.addEventListener(ev,()=>{if(cr&&!cr.moved)chatSet(cp.classList.contains('min')?150:0);cr=null}));

// ---------- punch + owner/dev commands ----------
let pcd=0;
function punch(){
 if(!playing||pcd>0||anyModal()||hudEdit)return;pcd=.32;P.pt=.3;P.arm=.15;snd(200,.08,'square',.05,90);
 const tx=Math.floor(P.x+P.f*(PW+.45)),ty=Math.floor(P.y-.5),o=sel;sel=0;act(tx,ty);sel=o}
$('#bP').onclick=punch;$('#tP').addEventListener('pointerdown',e=>{if(hudEdit)return;e.preventDefault();punch()});
function runCmd(t){
 const[a,...r]=t.slice(1).trim().split(/\s+/),cmd=a.toLowerCase(),who=(r[0]||'').replace(/^@/,'').toLowerCase();
 if(cmd==='player'||cmd==='players'){listPlayers();return}
 // ---------- punch + owner/dev commands ----------
let pcd=0;
function punch(){
 if(!playing||pcd>0||anyModal()||hudEdit)return;pcd=.32;P.pt=.3;P.arm=.15;snd(200,.08,'square',.05,90);
 const tx=Math.floor(P.x+P.f*(PW+.45)),ty=Math.floor(P.y-.5),o=sel;sel=0;act(tx,ty);sel=o}
$('#bP').onclick=punch;$('#tP').addEventListener('pointerdown',e=>{if(hudEdit)return;e.preventDefault();punch()});
function runCmd(t){
 const[a,...r]=t.slice(1).trim().split(/\s+/),cmd=a.toLowerCase(),who=(r[0]||'').replace(/^@/,'').toLowerCase();
 if(cmd==='player'||cmd==='players'){listPlayers();return}
 // --- FITUR /FIND ---
if(cmd==='find'){
 if(!isMod(me.username)){toast('Only moderators can use /find');return}
 if(!r.length){
  const list=Object.entries(DEF).filter(([,d])=>d.p).map(([id,d])=>`${id}:${d.n}`).join(', ');
  sysMsg('Items: '+list);
  return;
 }
 let qty=10;
 if(r.length>1 && /^\d+$/.test(r[r.length-1])){
  qty=clamp(parseInt(r.pop(),10),1,999);
 }
 const query=r.join(' ').toLowerCase();
 const found=Object.entries(DEF).find(([id,d])=>d.p && (id===query || d.n.toLowerCase().includes(query)));
 if(!found){toast('Item not found: '+query);return}

 const[itemId,itemDef]=found;
 add(+itemId,qty,1);
 refreshHotbar();
 saveAll();
 snd(600,.1,'triangle',.05,880);
 sysMsg(`Given ${qty}x ${itemDef.n} (ID: ${itemId})`);
 return;
}
 
 if(cmd==='gems'||cmd==='warp'){if(!isMod(me.username)){toast('Only moderators can use /'+cmd);return}if(cmd==='gems')giveGems(r[0]);else warpTo(who);return}
 if(cmd!=='pull'&&cmd!=='kick'){toast('Commands: /player, /pull name, /kick name'+(isMod(me.username)?', /gems amount, /warp name':''));return}
 if(!(WS.locked&&WS.owner===me.id)&&!isMod(me.username)){toast('Only the world owner or a moderator can use /'+cmd);return}
 if(!who){toast('Usage: /'+cmd+' name');return}
 const id=Object.keys(RP).find(k=>(RP[k].name||'').toLowerCase()===who);
 if(!id){toast('That player is not in this world');return}
 if(prot(RP[id].name)){toast('You cannot target staff');return}
 Net.send('cmd',{k:cmd,to:id,from:me.id,fn:me.username,x:+P.x.toFixed(2),y:+P.y.toFixed(2)});sysMsg('/'+cmd+' '+RP[id].name)}
async function onCmd(p){
 if(!me||p.to!==me.id)return;
 const sd=RP[p.from],staff=!!sd&&isMod(sd.name);
 let ok=staff||(WS.locked&&p.from===WS.owner);
 if(!ok&&Net.worldMeta){try{const r=await Net.worldMeta(name);if(r&&r.locked&&r.owner===p.from){WS={owner:r.owner,ownerName:r.owner_name||'',locked:true,access:r.access||[],banned:r.banned||[]};ok=true}}catch(e){}}
 if(!ok)return;
 if((isDev(me.username)&&!(sd&&isDev(sd.name)))||(isMod(me.username)&&!staff))return;
 if(p.k==='pull'&&typeof p.x==='number'&&typeof p.y==='number'){P.x=clamp(p.x,1.5,W-1.5);P.y=clamp(p.y,2,H-3);P.vx=P.vy=0;cam.x=P.x;cam.y=P.y-.5;toast('Pulled by '+p.fn)}
 else if(p.k==='kick')die('Kicked by '+p.fn);
 else if(p.k==='ban'){toast('Banned from this world by '+p.fn);enterWorld('START')}}
 
 if(cmd==='gems'||cmd==='warp'){if(!isMod(me.username)){toast('Only moderators can use /'+cmd);return}if(cmd==='gems')giveGems(r[0]);else warpTo(who);return}
 if(cmd!=='pull'&&cmd!=='kick'){toast('Commands: /player, /pull name, /kick name'+(isMod(me.username)?', /gems amount, /warp name':''));return}
 if(!(WS.locked&&WS.owner===me.id)&&!isMod(me.username)){toast('Only the world owner or a moderator can use /'+cmd);return}
 if(!who){toast('Usage: /'+cmd+' name');return}
 const id=Object.keys(RP).find(k=>(RP[k].name||'').toLowerCase()===who);
 if(!id){toast('That player is not in this world');return}
 if(prot(RP[id].name)){toast('You cannot target staff');return}
 Net.send('cmd',{k:cmd,to:id,from:me.id,fn:me.username,x:+P.x.toFixed(2),y:+P.y.toFixed(2)});sysMsg('/'+cmd+' '+RP[id].name)}
async function onCmd(p){
 if(!me||p.to!==me.id)return;
 const sd=RP[p.from],staff=!!sd&&isMod(sd.name);
 let ok=staff||(WS.locked&&p.from===WS.owner);
 if(!ok&&Net.worldMeta){try{const r=await Net.worldMeta(name);if(r&&r.locked&&r.owner===p.from){WS={owner:r.owner,ownerName:r.owner_name||'',locked:true,access:r.access||[],banned:r.banned||[]};ok=true}}catch(e){}}
 if(!ok)return;
 if((isDev(me.username)&&!(sd&&isDev(sd.name)))||(isMod(me.username)&&!staff))return;
 if(p.k==='pull'&&typeof p.x==='number'&&typeof p.y==='number'){P.x=clamp(p.x,1.5,W-1.5);P.y=clamp(p.y,2,H-3);P.vx=P.vy=0;cam.x=P.x;cam.y=P.y-.5;toast('Pulled by '+p.fn)}
 else if(p.k==='kick')die('Kicked by '+p.fn);
 else if(p.k==='ban'){toast('Banned from this world by '+p.fn);enterWorld('START')}}

// ---------- pixel icons ----------
const ICO={
 quit:['######..','#....#..','#..#.#..','#....#..','#....#..','#....#..','######..','........'],
 punch:['..####..','.######.','########','########','########','.######.','.######.','..####..'],
 shop:['..####..','..#..#..','.######.','########','########','########','########','.######.'],
 style:['.##..##.','########','########','#.####.#','..####..','..####..','..####..','........'],
 friends:['..####..','..####..','..####..','...##...','.######.','########','########','########'],
 dice:['########','#......#','#.#..#.#','#......#','#..##..#','#......#','#.#..#.#','########'],
 mic:['..####..','..####..','..####..','#.####.#','#.####.#','.######.','...##...','..####..'],
 hud:['###..###','#.#..#.#','###..###','........','###..###','#.#..#.#','###..###','........'],
 sound:['....#...','...##.#.','####.#.#','####.#.#','####.#.#','...##.#.','....#...','........']};
function icon8(rows){const c=document.createElement('canvas');c.width=c.height=8;const g=c.getContext('2d');g.fillStyle='#f3e6c4';rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='#')g.fillRect(x,y,1,1)}));return c}
function buildIcons(){document.querySelectorAll('[data-ico]').forEach(b=>b.prepend(icon8(ICO[b.dataset.ico])))}

// ---------- backpack: drag the hotbar upward ----------
let dy0=null,py0=null;
function openPack(v){if(hudEdit&&v)return;packOpen=v;$('#pack').classList.toggle('open',v);if(v)refreshHotbar()}
$('#dock').addEventListener('pointerdown',e=>{dy0=e.clientY});
$('#phead').addEventListener('pointerdown',e=>{py0=e.clientY});
addEventListener('pointermove',e=>{if(dy0!==null&&dy0-e.clientY>30){dy0=null;openPack(true)}if(py0!==null&&e.clientY-py0>30){py0=null;openPack(false)}});
['pointerup','pointercancel'].forEach(ev=>addEventListener(ev,()=>{dy0=null;py0=null}));
$('#grab').onclick=()=>openPack(!packOpen);$('#pclose').onclick=()=>openPack(false);

// ---------- friends ----------
let lobby={},lobbyAll=[];
function lobbyInit(){if(!me||!Net.on)return;Net.lobby({id:me.id,name:me.username,world:inWorld?name:null},st=>{lobby={};lobbyAll=[];for(const id in st){const m=st[id][0];if(m&&m.name){lobby[m.name.toLowerCase()]=m.world||null;lobbyAll.push({name:m.name,world:m.world||null})}}})}
async function addFriend(u){try{toast(await Net.addFriend(u));renderFriends()}catch(e){toast(e.message)}}
async function respond(u,a){try{await Net.respondFriend(u,a);renderFriends()}catch(e){toast(e.message)}}
async function renderFriends(){
 const box=$('#fl');box.textContent='';
 if(!me){box.textContent='Log in to add friends.';return}
 let list=[];try{list=await Net.friends()}catch(e){box.textContent=e.message;return}
 const sec=t=>{const h=document.createElement('h3');h.textContent=t;box.append(h)};
 const row=(nm,sub,btns)=>{const r=document.createElement('div');r.className='frow';const a=document.createElement('span');a.textContent=dn(nm);if(isMod(nm))a.style.color='#ff6ec7';
  const e=document.createElement('em');e.textContent=sub;r.append(a,e);btns.forEach(([t,fn])=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.onclick=fn;r.append(b)});box.append(r)};
 const by=k=>list.filter(x=>x.status===k);
 if(by('incoming').length){sec('Requests');by('incoming').forEach(x=>row(x.username,'wants to be friends',[['Accept',()=>respond(x.username,'accept')],['Decline',()=>respond(x.username,'remove')]]))}
 sec('Friends');if(!by('friend').length)box.append(document.createTextNode('No friends yet.'));
 by('friend').forEach(x=>{const w=lobby[x.username.toLowerCase()];row(x.username,w===undefined?'offline':w?'in '+w:'at home',[...(w?[['Join',()=>enterWorld(w)]]:[]),['Remove',()=>respond(x.username,'remove')]])});
 if(by('outgoing').length){sec('Sent');by('outgoing').forEach(x=>row(x.username,'waiting',[['Cancel',()=>respond(x.username,'remove')]]))}
 const nb=Object.values(RP).filter(r=>r.name);if(inWorld&&nb.length){sec('In this world');nb.forEach(r=>row(r.name,'nearby',[['Add',()=>addFriend(r.name)]]))}}
$('#bF').onclick=()=>{modal('#mF');renderFriends()};$('#hF').onclick=()=>{modal('#mF');renderFriends()};
$('#fAdd').onclick=()=>{const u=$('#fi').value.trim();if(u){addFriend(u);$('#fi').value=''}};
$('#fi').addEventListener('keydown',e=>{if(e.key==='Enter')$('#fAdd').click()});

// ---------- home screen: enter world, history, top worlds ----------
let inWorld=false;
const HK=()=>'pr1h:'+(me?me.id:'guest');
const history=()=>{try{return JSON.parse(localStorage.getItem(HK()))||[]}catch(e){return[]}};
function pushHist(n){try{localStorage.setItem(HK(),JSON.stringify([n,...history().filter(x=>x!==n)].slice(0,10)))}catch(e){}}
function showHome(){
 playing=false;inWorld=false;document.body.classList.remove('ingame');openPack(false);closeModals();
 $('#title').hidden=true;$('#home').hidden=false;
 if(me){Net.leave();Net.lobbyTrack({world:null})}
 for(const k in RP)delete RP[k];
 $('#hwho').textContent=me?'Logged in as '+me.username:'Guest. Progress is saved on this device.';$('#hOut').hidden=!me;
 const hb=$('#hh');hb.textContent='';const h=history();if(!h.length)hb.textContent='No worlds visited yet.';
 h.forEach(n=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>enterWorld(n);hb.append(b)});
 const tb=$('#ht');tb.textContent=me?'Loading...':'Log in to see the top worlds.';
 if(me)Net.top().then(rows=>{tb.textContent=rows.length?'':'No visits recorded yet.';rows.forEach((r,i)=>{const b=document.createElement('button');b.className='trow';
  const n=document.createElement('i');n.textContent=i+1;const s=document.createElement('span');s.textContent=r.name;const e=document.createElement('em');e.textContent=r.visits+' visits'+(r.owner_name?' | '+r.owner_name:'');
  b.append(n,s,e);b.onclick=()=>enterWorld(r.name);tb.append(b)})}).catch(e=>{tb.textContent=e.message})}
async function enterWorld(n){
 n=String(n||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16);if(!n){toast('Type a world name');return}
 closeModals();$('#home').hidden=true;inWorld=true;playing=true;document.body.classList.add('ingame');
 await loadWorld(n);if(me&&WS.locked&&WS.banned.includes(me.username.toLowerCase())&&!isDev(me.username)){toast('You are banned from '+n);return enterWorld('START')}
 if(me){try{localStorage.setItem('pr1last',name)}catch(e){}Net.lobbyTrack({world:name});Net.visit(name).catch(()=>{})}
 pushHist(name);refreshHotbar();toast('Entered '+name);saveAll();setTimeout(daily,1800)}
function daily(){
 const k='pr1d:'+(me?me.id:'g'),today=new Date().toISOString().slice(0,10),S=lsGet(k)||{day:'',streak:0};if(S.day===today)return;
 const y=new Date(Date.now()-864e5).toISOString().slice(0,10),streak=S.day===y?S.streak+1:1,gem=50+Math.min(streak,7)*25;
 gems+=gem;lsSet(k,{day:today,streak});toast('Daily reward: +'+gem+' gems (day '+streak+' streak)');refreshHotbar();saveAll()}
async function quitWorld(){await saveAll();showHome()}
$('#hgo').onclick=()=>enterWorld($('#hi').value||'START');
$('#hi').addEventListener('keydown',e=>{if(e.key==='Enter')enterWorld($('#hi').value||'START')});
$('#hstart').onclick=()=>enterWorld('START');$('#bQ').onclick=quitWorld;
$('#hY').onclick=()=>{buildStyle();modal('#mY')};
$('#hOut').onclick=async()=>{await saveAll();await Net.signOut();location.reload()};


// ---------- moderators (www/moderators.txt), /player /gems /warp ----------
const MODS=new Set(['diaszt']);
fetch('moderators.txt',{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>t.split(/\r?\n/).forEach(l=>{l=l.replace(/#.*/,'').trim().replace(/^@/,'').toLowerCase();if(l)MODS.add(l)})).catch(()=>{});
const isMod=n=>MODS.has(String(n||'').toLowerCase())||(!!me&&myRole!=='player'&&String(n||'').toLowerCase()===me.username.toLowerCase()),dn=n=>isMod(n)?'@'+n:n;
function listPlayers(){
 if(!Net.on||!lobbyAll.length){sysMsg('No online data yet. Try again in a moment.');return}
 sysMsg('Online players ('+lobbyAll.length+'):');
 lobbyAll.forEach(x=>sysMsg(' '+dn(x.name)+(x.world?'  in '+x.world:'  at home')))}
function giveGems(v){const n=Math.floor(+v);if(!(n>=1&&n<=1e9)){toast('Usage: /gems amount');return}
 gems+=n;lastProf='';refreshHotbar();saveAll();sysMsg('You received '+n+' gems');snd(660,.2,'triangle',.06,990)}
async function warpTo(who){
 if(!who){toast('Usage: /warp name');return}
 const e=lobbyAll.find(x=>x.name.toLowerCase()===who);
 if(!e){toast('That player is not online');return}
 if(!e.world){toast(e.name+' is at the home screen');return}
 if(e.world!==name)await enterWorld(e.world);
 for(let i=0;i<40;i++){const id=Object.keys(RP).find(k=>(RP[k].name||'').toLowerCase()===who&&!RP[k].first);
  if(id){P.x=RP[id].tx;P.y=RP[id].ty;P.vx=P.vy=0;cam.x=P.x;cam.y=P.y-.5;sysMsg('Warped to '+RP[id].name);return}
  await new Promise(r=>setTimeout(r,100))}
 toast('Could not reach '+e.name+'. They may have moved.')}


// ---------- HP + lava ----------
function saveSet(){try{lsSet('pr1set',{mute,hot,sel,chat:cp.classList.contains('min')?0:cpn.offsetHeight})}catch(e){}}
function loadSet(){const S=lsGet('pr1set')||{};mute=!!S.mute;$('#bM').classList.toggle('off',mute);
 if(Array.isArray(S.hot))hot=S.hot.filter(Number.isInteger).slice(0,8);sel=Number.isInteger(S.sel)?S.sel:0;if(typeof S.chat==='number')chatSet(S.chat)}
function drawHp(){const n=$('#hpn');if(!n)return;n.textContent=hp;const g=$('#hpc').getContext('2d');g.clearRect(0,0,8,8);g.fillStyle=hp>2?'#ff4a5a':'#ffb347';
 ['.##.##.','#######','#######','.#####.','..###..','...#...'].forEach((r,y)=>[...r].forEach((c,x)=>{if(c==='#')g.fillRect(x,y+1,1,1)}))}
function lavaHit(){if(hurtT>0)return;hurtT=.9;hp--;regT=0;drawHp();burst(P.x,P.y-.5,'#ff6e1e',10);snd(140,.2,'sawtooth',.06,60);
 $('#flash').classList.add('on');requestAnimationFrame(()=>requestAnimationFrame(()=>$('#flash').classList.remove('on')));
 if(hp<=0)die('Burned by lava');else toast('Lava! '+hp+' HP left')}

// ---------- wrench: lock settings, player menu, gates, trade ----------
const isOwner=()=>!!me&&WS.locked&&WS.owner===me.id;
const canMod=()=>!!me&&(isMod(me.username)||isOwner());
const prot=n=>isDev(n)?!isDev(me.username):isMod(n)?!isMod(me.username):false;
function wrenchTap(tx,ty){
 if(wLatch)return;wLatch=true;
 const id=Object.keys(RP).find(k=>{const r=RP[k];return r.look&&!r.first&&Math.abs(PTRW.x-r.x)<.8&&PTRW.y<r.y+.1&&PTRW.y>r.y-1.6});
 if(id){openPlayerMenu(id);return}
 const c=get(tx,ty);
 if(c===40||c===41){openLockSettings();return}
 if(c===14||c===15){if(!canEdit()){deny();return}
  if(c===14&&false)return;if(c===15&&overlap(tx,ty)){toast('Someone is in the way');return}
  const v=c===14?15:14;set(tx,ty,v);edit(tx,ty,v);snd(c===14?420:260,.1,'triangle',.05)}}
function sendCmd(k,id){Net.send('cmd',{k,to:id,from:me.id,fn:me.username,x:+P.x.toFixed(2),y:+P.y.toFixed(2)});sysMsg('/'+k+' '+RP[id].name)}
function openPlayerMenu(id){const r=RP[id];if(!r)return;
 $('#pmName').textContent=dn(r.name);$('#pmName').style.color=isMod(r.name)?'#ff6ec7':'';
 const box=$('#pmBtns');box.textContent='';const B=(t,fn)=>{const b=document.createElement('button');b.className='btn';b.textContent=t;b.onclick=()=>{closeModals();fn()};box.append(b)};
 B('Add friend',()=>addFriend(r.name));B('Trade',()=>openTrade(id));
 if(canMod()&&!prot(r.name)){B('Pull',()=>sendCmd('pull',id));B('Kick',()=>sendCmd('kick',id));B('Ban from world',()=>banPlayer(id))}
 modal('#mP')}
async function saveAccess(){try{await Net.setAccess(name,WS.access,WS.banned);Net.send('lock',{owner:WS.owner,ownerName:WS.ownerName,access:WS.access,banned:WS.banned});toast('Saved')}catch(e){toast(e.message)}}
async function banPlayer(id){const r=RP[id];if(!r)return;
 if(isOwner()){const n=r.name.toLowerCase();if(!WS.banned.includes(n))WS.banned.push(n);WS.access=WS.access.filter(x=>x!==n);await saveAccess()}
 Net.send('cmd',{k:'ban',to:id,from:me.id,fn:me.username});sysMsg('Banned '+r.name)}
function openLockSettings(){if(!WS.locked){toast('This world is not locked');return}
 $('#kOwner').textContent='Owner: '+WS.ownerName;$('#kEdit').hidden=!isOwner();renderLock();modal('#mK')}
function renderLock(){const box=$('#kl');box.textContent='';
 const sec=(t,key)=>{const h=document.createElement('h3');h.textContent=t;box.append(h);const arr=WS[key];if(!arr.length){box.append(document.createTextNode('Nobody'));return}
  arr.forEach(n=>{const r=document.createElement('div');r.className='frow';const a=document.createElement('span');a.textContent=n;r.append(a);
   if(isOwner()){const b=document.createElement('button');b.className='btn';b.textContent='Remove';b.onclick=async()=>{WS[key]=WS[key].filter(x=>x!==n);await saveAccess();renderLock()};r.append(b)}box.append(r)})};
 sec('Can build here','access');sec('Banned','banned')}
async function lockList(key,other){const n=$('#ki').value.trim().toLowerCase();if(!n||!isOwner())return;if(!WS[key].includes(n))WS[key].push(n);WS[other]=WS[other].filter(x=>x!==n);$('#ki').value='';await saveAccess();renderLock()}
$('#kAdd').onclick=()=>lockList('access','banned');$('#kBan').onclick=()=>lockList('banned','access');

let tTarget=null,tPend=null,pendingOffer=null;
const gname=id=>id==='g'?'Gems':DEF[id].n,pid=v=>v==='g'?'g':+v;
const have=(id,n)=>id==='g'?gems>=n:(inv[id]||0)>=n;
function take(id,n){if(id==='g')gems-=n;else{inv[id]-=n;if(inv[id]<=0)delete inv[id]}}
function gift(id,n){if(id==='g')gems+=n;else inv[id]=(inv[id]||0)+n}
function openTrade(id){const r=RP[id];if(!r)return;tTarget=id;$('#tTitle').textContent='Trade with '+r.name;
 const g=$('#tg'),a=$('#ta');g.innerHTML='';a.innerHTML='';const o=(el,v,t)=>{const e=document.createElement('option');e.value=v;e.textContent=t;el.append(e)};
 o(g,'g','Gems ('+gems+')');Object.keys(inv).map(Number).filter(i=>inv[i]>0&&DEF[i]&&!DEF[i].perm).forEach(i=>o(g,i,DEF[i].n+' ('+inv[i]+')'));
 o(a,'g','Gems');Object.keys(DEF).map(Number).filter(i=>DEF[i].p&&!DEF[i].perm).forEach(i=>o(a,i,DEF[i].n));modal('#mT')}
$('#tSend').onclick=()=>{const r=RP[tTarget];if(!r||!me)return;const gi=pid($('#tg').value),ai=pid($('#ta').value),gn=Math.floor(+$('#tgn').value),an=Math.floor(+$('#tan').value);
 if(!(gn>=1&&an>=1)||!have(gi,gn)){toast('Check the amounts');return}
 tPend={to:tTarget,give:[gi,gn],ask:[ai,an],esc:false};Net.send('trade',{k:'offer',to:tTarget,from:me.id,fn:me.username,give:tPend.give,ask:tPend.ask});closeModals();toast('Offer sent to '+r.name)};
function onTrade(p){
 if(!me||p.to!==me.id)return;const send=o=>Net.send('trade',Object.assign({to:p.from,from:me.id,fn:me.username},o));
 const ok=a=>Array.isArray(a)&&(a[0]==='g'||(DEF[a[0]]&&!DEF[a[0]].perm))&&Number.isInteger(a[1])&&a[1]>=1&&a[1]<=1e9;
 if(p.k==='offer'){if(!ok(p.give)||!ok(p.ask))return;pendingOffer=p;$('#rTxt').textContent=p.fn+' gives '+p.give[1]+' '+gname(p.give[0])+' for your '+p.ask[1]+' '+gname(p.ask[0]);modal('#mR')}
 else if(p.k==='accept'&&tPend&&tPend.to===p.from&&!tPend.esc){if(!have(...tPend.give)){send({k:'cancel'});tPend=null;toast('You no longer have the items');return}take(...tPend.give);tPend.esc=true;send({k:'give'});refreshHotbar()}
 else if(p.k==='give'&&pendingOffer&&pendingOffer.from===p.from){const o=pendingOffer;pendingOffer=null;
  if(have(...o.ask)){take(...o.ask);gift(...o.give);send({k:'complete'});toast('Trade complete');refreshHotbar();saveAll()}else{send({k:'cancel'});toast('You do not have the items')}}
 else if(p.k==='complete'&&tPend&&tPend.esc&&tPend.to===p.from){gift(...tPend.ask);tPend=null;toast('Trade complete');refreshHotbar();saveAll()}
 else if(p.k==='cancel'&&tPend&&tPend.to===p.from){if(tPend.esc)gift(...tPend.give);tPend=null;refreshHotbar();toast('Trade cancelled')}
 else if(p.k==='decline'&&tPend&&tPend.to===p.from){tPend=null;toast(p.fn+' declined the trade')}}
$('#rYes').onclick=()=>{if(!pendingOffer)return;closeModals();Net.send('trade',{k:'accept',to:pendingOffer.from,from:me.id,fn:me.username})};
$('#rNo').onclick=()=>{if(pendingOffer)Net.send('trade',{k:'decline',to:pendingOffer.from,from:me.id,fn:me.username});pendingOffer=null;closeModals()};

// ---------- world sync, staff, save-on-exit ----------
function applyEdit(uid,x,y,v){
 const sn=String((RP[uid]||{}).name||'').toLowerCase();
 if(name==='START'&&!WS.locked&&!isMod(sn))return;
 if(WS.locked&&!(uid===WS.owner||WS.access.includes(sn)))return;
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<1||x>=W-1||y<1||y>=H-2||(v!==0&&v!==-1&&!DEF[v]))return;
 const k=x*H+y;if(v===-1){BG[k]=2;delete DMG[k];return}if(v===0&&M[k]!==0)BG[k]=1;set(x,y,v);delete DMG[k];if(v==12)SAP[k]=Date.now();else delete SAP[k]}
function applyData(w){let d;try{d=JSON.parse(w.data)}catch(e){return}const m=d&&d.m&&dec(d.m);if(!m)return;
 M=m;BG=(d.b&&dec(d.b))||BG;if(d.su)SU=d.su;SAP={};DMG={};const now=Date.now();(d.s||[]).forEach(([i,t])=>{const g=GROWS[M[i]];if(!g)return;if(now-t>=g[1]*1e3)M[i]=g[0];else SAP[i]=t});stamp=w.updated_at||''}
async function syncWorld(){
 if(!me||!inWorld||syncing||!Net.worldMeta)return;syncing=true;const nm=name,quiet=()=>performance.now()-lastEdit>4000&&!dirty&&!EQ.length;
 try{
  if(noSave){const w=await Net.getWorld(nm);if(nm===name){if(w)applyData(w);noSave=false;toast('World loaded')}}
  else{const r=await Net.worldMeta(nm);
   if(r&&nm===name){WS={owner:r.owner,ownerName:r.owner_name||'',locked:!!r.locked,access:r.access||[],banned:r.banned||[]};updWorldLabel();
    if(WS.locked&&WS.banned.includes(me.username.toLowerCase())&&!isMod(me.username)){toast('You are banned from '+nm);syncing=false;enterWorld('START');return}
    if(stamp&&r.updated_at!==stamp&&quiet()){const w=await Net.getWorld(nm);if(w&&nm===name&&quiet())applyData(w)}
    stamp=r.updated_at||stamp}}}
 catch(e){}syncing=false}
setInterval(syncWorld,8000);
function flushNow(){
 const prof=me&&JSON.stringify({gems,inv,look})!==lastProf?{gems,inv,look}:null,wd=me&&dirty&&canEdit()?wdata():null;
 if(me&&Net.flush)Net.flush(name,wd,prof);
 saveAll()}

// ---------- Gold Lock <-> Diamond Lock (double-tap) ----------
let lastTap={id:-1,t:0};
function slotTap(id){const n=performance.now(),dbl=lastTap.id===id&&n-lastTap.t<450;lastTap={id,t:n};
 if(dbl&&(id===40||id===41)){lockConvert(id);return}sel=id;refreshHotbar()}
function lockConvert(id){
 if(id===40){if((inv[40]||0)>=100){inv[40]-=100;if(!inv[40])delete inv[40];add(41,1);toast('100 Gold Locks became 1 Diamond Lock');snd(520,.2,'triangle',.06,1040)}else{toast('You need 100 Gold Locks ('+(inv[40]||0)+' now)');return}}
 else if((inv[41]||0)>0){inv[41]--;if(!inv[41])delete inv[41];add(40,100);toast('Diamond Lock split into 100 Gold Locks');snd(400,.2,'triangle',.06,300)}
 refreshHotbar();saveAll()}

// ---------- custom HUD ----------
let hudEdit=false,HUD={},hsel=null;
const HUDN={side:'Sidebar',chat:'Chat',dock:'Hotbar',tL:'Left button',tR:'Right button',tJ:'Jump button',tP:'Punch button'};
try{HUD=JSON.parse(localStorage.getItem('pr1hud'))||{}}catch(e){HUD={}}
function hudApply(id){const el=$('#'+id),h=HUD[id];
 if(!h){['left','top','right','bottom','transform'].forEach(k=>el.style[k]='');return}
 el.style.left=h.x*innerWidth+'px';el.style.top=h.y*innerHeight+'px';el.style.right='auto';el.style.bottom='auto';el.style.transform=`translate(-50%,-50%) scale(${h.s})`}
const hudApplyAll=()=>Object.keys(HUDN).forEach(hudApply);
const hudSave=()=>{try{localStorage.setItem('pr1hud',JSON.stringify(HUD))}catch(e){}};
function hudSelect(id){hsel=id;Object.keys(HUDN).forEach(k=>$('#'+k).classList.toggle('sel',k===id));
 $('#hsel').textContent=id?HUDN[id]+' selected. Drag to move.':'Tap an element, then drag it';if(id&&HUD[id])$('#hsz').value=Math.round(HUD[id].s*100)}
function hudMode(v){if(v&&!playing)return;hudEdit=v;document.body.classList.toggle('hudedit',v);$('#hudbar').hidden=!v;closeModals();openPack(false);hudSelect(null);if(!v)hudSave()}
Object.keys(HUDN).forEach(id=>{const el=$('#'+id);el.classList.add('hudel');
 el.addEventListener('pointerdown',e=>{if(!hudEdit)return;e.preventDefault();e.stopPropagation();
  const r=el.getBoundingClientRect();if(!HUD[id])HUD[id]={x:(r.left+r.width/2)/innerWidth,y:(r.top+r.height/2)/innerHeight,s:1};
  hudSelect(id);const dx=e.clientX-HUD[id].x*innerWidth,dy=e.clientY-HUD[id].y*innerHeight;try{el.setPointerCapture(e.pointerId)}catch(_){}
  const mv=ev=>{HUD[id].x=clamp((ev.clientX-dx)/innerWidth,.02,.98);HUD[id].y=clamp((ev.clientY-dy)/innerHeight,.03,.97);hudApply(id)};
  const up=()=>{el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);hudSave()};
  el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up)},true)});
$('#hsz').oninput=()=>{if(hsel&&HUD[hsel]){HUD[hsel].s=+$('#hsz').value/100;hudApply(hsel);hudSave()}};
$('#hrs').onclick=()=>{if(hsel){delete HUD[hsel];hudApply(hsel);hudSelect(hsel);hudSave()}};
$('#hall').onclick=()=>{HUD={};hudApplyAll();hudSelect(null);hudSave()};
$('#hdn').onclick=()=>hudMode(false);$('#bH').onclick=()=>hudMode(true);
$('#hpad').onchange=e=>{document.body.classList.toggle('pad',e.target.checked);try{localStorage.setItem('pr1pad',e.target.checked?'1':'0')}catch(_){}};
{let pd;try{pd=localStorage.getItem('pr1pad')}catch(e){}if(pd===null||pd===undefined)pd=matchMedia('(pointer:coarse)').matches?'1':'0';
 document.body.classList.toggle('pad',pd==='1');$('#hpad').checked=pd==='1'}
addEventListener('resize',hudApplyAll);hudApplyAll();

// ---------- accounts / title ----------
function applyLogin({user,profile}){me={id:user.id,username:profile.username};myRole=profile.role||'player';gems=profile.gems;inv=profile.inv||{};look=Object.assign(look0(),profile.look||{});const bk=lsGet('pr1p:'+user.id);if(bk&&bk.u){gems=bk.g;inv=bk.inv||inv;look=Object.assign(look0(),bk.look||{});lastProf=''}else lastProf=JSON.stringify({gems,inv,look});lobbyInit()}
async function auth(kind){
 const u=$('#au').value.trim(),p=$('#ap').value,msg=$('#amsg');msg.textContent='Working...';
 try{const r=kind==='up'?await Net.signUp(u,p):await Net.signIn(u,p);
  await saveWorld();dirty=false;applyLogin(r);msg.textContent='';
  await loadWorld(localStorage.getItem('pr1last'));refreshHotbar();start()}
 catch(e){msg.textContent=e.message}}
$('#aIn').onclick=()=>auth('in');$('#aUp').onclick=()=>auth('up');
$('#ap').addEventListener('keydown',e=>{if(e.key==='Enter')auth('in')});

// ---------- boot ----------
(async()=>{
 buildCasino();buildIcons();drawHp();loadSet();
 let ses=null;if(Net.on){try{ses=await Net.session()}catch(e){}}
 if(ses)applyLogin(ses);
 else try{const d=JSON.parse(localStorage.getItem('pr1'));if(d){gems=d.g??50;inv=d.inv||inv;look=Object.assign(look0(),d.look)}}catch(e){}
 let w=null;try{w=ses?localStorage.getItem('pr1last'):(JSON.parse(localStorage.getItem('pr1'))||{}).w}catch(e){}
 await loadWorld(w);refreshHotbar();
 if(ses){$('#auth').hidden=true;$('#welcome').hidden=false;$('#welcome').textContent='Welcome back, '+me.username;$('#play').textContent='Play';$('#play').classList.add('go')}
 else if(!Net.on){$('#auth').innerHTML='<p style="color:#b09a74;font-size:8px;line-height:1.8">Online features (accounts, multiplayer, locks, voice) are off until Supabase is set in config.js. You can still play offline.</p>'}
 let last=0;
 const loop=ms=>{const t=ms/1000,dt=Math.min(.05,t-last||.016);last=t;update(dt);draw(t);requestAnimationFrame(loop)};
 requestAnimationFrame(loop);
})();
setInterval(saveAll,3000);
addEventListener('beforeunload',flushNow);addEventListener('pagehide',flushNow);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushNow()});
})();
// --- Tambahan Kode untuk Integrasi Item Kustom ke Shop/Game ---
function loadCustomItemsToShop() {
    // Pastikan CUSTOM_ITEMS dari items.js sudah ada
    if (typeof CUSTOM_ITEMS !== 'undefined') {
        const allItems = getAllCustomItems();
        
        // Loop atau masukkan item ke dalam array shop/inventaris game Anda
        allItems.forEach(item => {
            console.log("Memuat item ke game:", item.name);
            
            // Contoh jika game Anda memiliki array shopItems:
            // if (typeof shopItems !== 'undefined') {
            //     shopItems.push(item);
            // }
        });
    } else {
        console.warn("items.js belum dimuat atau CUSTOM_ITEMS tidak ditemukan!");
    }
}

// Panggil fungsi ini secara aktif (tanda '//' dihapus)
loadCustomItemsToShop();
