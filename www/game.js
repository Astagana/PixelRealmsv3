'use strict';
(()=>{
const T=16,W=80,H=60,REACH=5.5,GROW=90,PW=.35,PH=1.95;
const $=s=>document.querySelector(s),cv=$('#c'),ctx=cv.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+(Math.random()*(b-a+1)|0);

// ---------- block data ----------
const DEF={
1:{n:'Grass',h:2,s:1,p:1,g:[.2,1,1],sd:.14,c:'#68b03e'},
2:{n:'Dirt',h:2,s:1,p:1,g:[.15,1,1],sd:.1,c:'#74503a'},
3:{n:'Rock',h:4,s:1,p:1,g:[.35,1,3],c:'#6f727c'},
4:{n:'Bedrock',s:1,c:'#26262e'},
5:{n:'Lava',c:'#ff6e1e'},
6:{n:'Sand',h:2,s:1,p:1,g:[.2,1,1],c:'#e2ca84'},
7:{n:'Wood',h:3,s:1,p:1,g:[.25,1,2],c:'#a5703c'},
8:{n:'Glass',h:1,s:1,p:1,c:'#b6e8ff'},
9:{n:'Brick',h:5,s:1,p:1,g:[.3,1,2],c:'#b0483e'},
10:{n:'Door',c:'#f4f4fc'},
12:{n:'Sapling',h:1,c:'#78d654'},
13:{n:'Tree',h:3,c:'#348a3a'},
40:{n:'Gold Lock',h:8,s:1,p:1,c:'#ffc247'},
30:{n:'Seed',p:1,c:'#96dc5a'}};
const SHOP=[[8,10,15],[7,10,25],[6,20,10],[3,20,30],[9,10,40],[30,5,20],[40,1,100]];

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
A[10]=mk(x=>{F(x,3,1,10,15,'#8a93b8');F(x,4,2,8,13,'#f4f4fc');F(x,5,3,6,5,'#c9d4f2');F(x,5,9,6,5,'#c9d4f2');F(x,10,9,2,2,'#ffc247')});
A[12]=mk(x=>{F(x,7,9,2,7,'#4f8f2e');F(x,4,8,4,2,'#78d654');F(x,8,5,4,2,'#78d654');F(x,5,7,2,1,'#9be67a');F(x,9,4,2,1,'#9be67a')});
A[13]=mk(x=>{const r=mb(13);F(x,6,9,4,7,'#7a4f2a');F(x,6,9,1,7,'#5e3b1d');for(let yy=0;yy<12;yy++)for(let xx=0;xx<16;xx++){const d=(xx-7.5)**2+(yy-5.5)**2;if(d<=30)F(x,xx,yy,1,1,['#348a3a','#2a7430','#43a248'][r()*3|0])}F(x,5,3,2,1,'#6cc66e');F(x,9,2,2,1,'#6cc66e');F(x,10,6,2,2,'#d9402e')});
A[5]=[0,1].map(f=>mk(x=>{const r=mb(50+f);F(x,0,0,T,T,'#e8501a');sp(x,r,['#ff8a2a','#ffd24a','#c43a10','#ff9a3a'],70)}));
A[30]=mk(x=>{F(x,6,5,4,6,'#96dc5a');F(x,5,6,6,4,'#96dc5a');F(x,6,5,2,2,'#c6f08f');F(x,9,9,1,2,'#5f9a30')});
A[40]=mk(x=>{F(x,0,0,T,T,'#d9a62a');sp(x,mb(40),['#f2c94c','#b98a1c','#e8b83a'],40);F(x,6,2,1,6,'#c9d4f2');F(x,9,2,1,6,'#c9d4f2');F(x,6,2,4,1,'#c9d4f2');F(x,4,7,8,7,'#7a5410');F(x,5,8,6,5,'#ffc247');F(x,7,9,2,2,'#2b1d14');F(x,7,11,2,1,'#2b1d14');bevel(x)});
A.wall=mk(x=>{x.drawImage(A[2],0,0);F(x,0,0,T,T,'rgba(14,8,16,.68)')});
const CR=[1,2,3,4].map(s=>mk(x=>{const r=mb(99);for(let i=0;i<s*9;i++)F(x,r()*T|0,r()*T|0,1+(r()*2|0),1,'rgba(10,6,10,.75)')}));
const GEM=document.createElement('canvas');GEM.width=GEM.height=8;
(x=>{['..0000..','.001111.','01111112','11111122','.111122.','..1122..','...22...'].forEach((row,y)=>[...row].forEach((ch,xx)=>{if(ch!='.')F(x,xx,y,1,1,{0:'#c4f4ff',1:'#4fd8ff',2:'#1b8fc0'}[ch])}))})(GEM.getContext('2d'));
$('#gi').getContext('2d').drawImage(GEM,0,0);

// ---------- character kit (32x32 sprite): 20 hair, 20 shirts, 20 pants, 20 shoes, 6 skins ----------
const SKIN=['#ffddcc','#f1c9a0','#e0ac69','#c68642','#8d5524','#5c3317'],SKINN=['Pale','Light','Medium','Tan','Deep Tan','Dark'];
const HAIR=[['spiky','#d92f2f','Spiky Red'],['pomp','#2f6fe0','Blue Pompadour'],['mohawk','#3fc24d','Green Mohawk'],['wavy','#7a4a2b','Long Brown Wavy'],['bob','#9b4fd0','Purple Bob'],['afro','#1b1b22','Black Afro'],['messy','#2fae55','Green Messy'],['wavy','#c0392b','Long Red Wavy'],['slick','#d94a3a','Red Slick'],['spiky','#f2c94c','Spiky Blonde'],['pomp','#1f4fb0','Navy Pompadour'],['pomp','#3fc24d','Green Pompadour'],['mohawk','#2a9d44','Forest Mohawk'],['bob','#7a4a2b','Brown Bob'],['bob','#b06ae0','Lilac Bob'],['afro','#33261c','Dark Afro'],['afro','#7a4a2b','Brown Afro'],['spiky','#2f6fe0','Spiky Blue'],['messy','#f2c94c','Messy Blonde'],['wavy','#9b4fd0','Long Purple Wavy']];
const SHIRT=[['hoodie','#2f6fd0','#1d4a95','Blue Hoodie'],['tee','#3fa34d','#2a7a36','Green T-Shirt'],['armor','#a4adba','#6b7380','Armor Plate'],['vest','#c0392b','#f1f1f1','Red Vest'],['vest','#b3261e','#2b2b33','Dark Red Vest'],['sweater','#8a5a2b','#c98e63','Striped Hoodie'],['stripe','#3fa34d','#e6c229','Green Stripe'],['armor','#c3ccd8','#7b8696','Steel Plate'],['sweater','#2f7fd1','#e8e8ee','Blue Sweater'],['puffer','#c0392b','#f1f1f1','Red Puffer'],['hoodie','#5a3a2a','#3a2418','Brown Hoodie'],['tee','#e0642b','#a63f1b','Orange T-Shirt'],['armor','#8a93b8','#5e6785','Iron Plate'],['jacket','#2f6fd0','#f1f1f1','Blue Jacket'],['vest','#2f6fd0','#f1f1f1','Blue Vest'],['stripe','#2b3a67','#f1f1f1','Sailor Stripe'],['jacket','#f2c94c','#c9a227','Yellow Jacket'],['tee','#9b4fd0','#6e2fa0','Purple T-Shirt'],['jacket','#e8b82c','#2b2b33','Gold Jacket'],['stripe','#c0392b','#f1f1f1','Red Stripe']];
const PANTS=[['jeans','#3a5fa0','#2a4580','Denim Jeans'],['shorts','#a58d5a','#7d6a3f','Cargo Shorts'],['jeans','#26262e','#15151a','Black Trousers'],['jeans','#2f7a3a','#1f5a28','Green Slacks'],['skirt','#8a8f9c','#5e6370','Chainmail Skirt'],['track','#2f5fc0','#f1f1f1','Blue Trackpants'],['jeans','#2a3a6a','#1b2748','Dark Denim'],['track','#26262e','#3fb34d','Black Trackpants'],['shorts','#3a5fa0','#2a4580','Denim Shorts'],['skirt','#2f7a3a','#1f5a28','Green Skirt'],['jeans','#7a2a2a','#521b1b','Maroon Trousers'],['track','#3fa34d','#f1f1f1','Green Trackpants'],['jeans','#8a8f9c','#5e6370','Gray Slacks'],['shorts','#26262e','#15151a','Black Shorts'],['jeans','#c9b27a','#a38f57','Khaki Pants'],['track','#c0392b','#f1f1f1','Red Trackpants'],['skirt','#7a4a2b','#523119','Leather Skirt'],['jeans','#5a3a7a','#3b2552','Purple Slacks'],['shorts','#2f7a3a','#1f5a28','Green Shorts'],['track','#e8e8ee','#2f6fd0','White Trackpants']];
const SHOES=[['sneaker','#f1f1f1','#2f6fd0','Sneakers'],['boot','#8a5a2b','#5a3a1b','Combat Boots'],['sandal','#c9a06a','#7a5a2b','Sandals'],['formal','#1b1b22','#4a4a55','Formal Shoes'],['formal','#6b3f2f','#9a6a4a','Brown Formal'],['hiker','#b8873a','#6b4a1f','Hiker Boots'],['hightop','#d92f2f','#f1f1f1','Red High-tops'],['sandal','#8a5a2b','#4a2f18','Leather Sandals'],['sneaker','#f1f1f1','#2f6fd0','White Sneakers'],['boot','#26262e','#15151a','Black Boots'],['sneaker','#d92f2f','#f1f1f1','Red Sneakers'],['formal','#2b3a67','#4a5a8a','Navy Shoes'],['hiker','#7a8f5a','#4a5a33','Moss Hikers'],['hightop','#2f6fd0','#f1f1f1','Blue High-tops'],['sandal','#e8e8ee','#9a9aa8','White Sandals'],['boot','#7a4a2b','#4a2a18','Brown Boots'],['sneaker','#3fb34d','#f1f1f1','Green Sneakers'],['hightop','#1b1b22','#f1f1f1','Black High-tops'],['hiker','#c0392b','#7a2418','Red Hikers'],['formal','#e8e8ee','#9a9aa8','White Shoes']];
const look0=()=>({h:0,s:0,p:0,k:2,o:0});let look=look0();
const shade=(c,a)=>'#'+[16,8,0].map(b=>clamp(Math.round(((parseInt(c.slice(1),16)>>b)&255)*a),0,255).toString(16).padStart(2,'0')).join('');
// fx,fy = feet centre, u = canvas px per sprite px, f = facing (+1 right), an = gait, pt = punch timer (0.3 -> 0)
function drawChar(c,fx,fy,u,L,f,an,pt){
 const R=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(fx+(f>0?x:-x-w)*u,fy+y*u,w*u,h*u)};
 const O=(x,y,w,h,col)=>{R(x-1,y-1,w+2,h+2,'#2a1a22');R(x,y,w,h,col)};
 const sk=SKIN[(L.k|0)%6],skd=shade(sk,.84),Hr=HAIR[(L.h|0)%20],S=SHIRT[(L.s|0)%20],Pn=PANTS[(L.p|0)%20],Sh=SHOES[(L.o|0)%20];
 const hs=Hr[0],hc=Hr[1],hl=shade(hc,1.35),hd=shade(hc,.7),ty=S[0],c1=S[1],c2=S[2],tp=Pn[0],p1=Pn[1],p2=Pn[2];
 const ph=pt>0?Math.min(3,Math.floor((1-pt/.3)*4)):-1,g=an>0?1:an<0?-1:0,sl=({tee:3,vest:0,armor:2})[ty]??8;
 R(-9,-1,18,1,'rgba(0,0,0,.22)');
 if(hs==='afro'){const A=[[-9,-39,18,2],[-11,-37,22,11],[-10,-26,20,2]];A.forEach(([x,y,w,h])=>R(x-1,y-1,w+2,h+2,'#2a1a22'));A.forEach(([x,y,w,h])=>R(x,y,w,h,hc))}
 if(hs==='wavy')O(-8,-32,16,22,hc);
 if(hs==='bob')O(-8,-32,16,14,hc);
 O(-9,-18,3,9,sk);if(sl)R(-9,-18,3,sl,c1);                       // back arm
 [[-5,g>0?1:0],[1,g<0?1:0]].forEach(([x,l])=>{const h=6-l;O(x,-9,4,h,sk);
  if(tp==='jeans'||tp==='track')O(x,-9,4,h,p1);
  if(tp==='shorts')O(x,-9,4,3,p1);
  if(tp==='track')R(x<0?x:x+3,-9,1,h,p2)});
 if(tp==='skirt')O(-6,-10,12,5,p1);
 O(-6,-11,12,3,p1);R(-6,-9,12,1,p2);
 [[-6,g>0?1:0],[0,g<0?1:0]].forEach(([x,l])=>{const y=-l,t=Sh[0],a=Sh[1],b=Sh[2];
  if(t==='sneaker'){O(x,y-3,6,3,a);R(x,y-1,6,1,b)}
  else if(t==='boot'){O(x,y-6,6,6,a);R(x,y-6,6,1,b);R(x,y-1,6,1,shade(a,.6))}
  else if(t==='sandal'){O(x,y-2,6,2,sk);R(x+1,y-3,4,1,a);R(x,y-1,6,1,b)}
  else if(t==='formal'){O(x,y-3,6,3,a);R(x+1,y-3,2,1,b)}
  else if(t==='hiker'){O(x,y-5,6,5,a);R(x,y-1,6,1,b);R(x+2,y-5,1,2,'#f1f1f1')}
  else{O(x,y-6,6,6,a);R(x,y-2,3,2,b);R(x,y-6,6,1,b)}});
 O(-2,-21,4,3,sk);                                                 // neck
 O(-6,-19,12,9,c1);                                                // torso + shirt
 if(ty==='tee')R(-3,-19,6,1,shade(c1,.7));
 if(ty==='hoodie'){R(-5,-19,10,2,c2);R(-4,-13,8,3,c2);R(-2,-17,1,4,'#f1f1f1');R(1,-17,1,4,'#f1f1f1')}
 if(ty==='armor'){R(-5,-18,10,8,shade(c1,1.1));R(-1,-18,2,8,c2);R(-6,-12,12,1,'#4a3220');O(-9,-20,4,3,c2);O(5,-20,4,3,c2)}
 if(ty==='vest'){R(-6,-19,12,9,c2);R(-6,-19,5,9,c1);R(1,-19,5,9,c1)}
 if(ty==='sweater')for(let y=-17;y<-10;y+=3)R(-6,y,12,1,c2);
 if(ty==='stripe')for(let y=-19;y<-10;y+=2)R(-6,y,12,1,c2);
 if(ty==='puffer'){R(-6,-16,12,1,shade(c1,.7));R(-6,-13,12,1,shade(c1,.7));R(-5,-20,10,2,c2)}
 if(ty==='jacket'){R(-1,-19,2,9,c2);R(-5,-20,10,2,shade(c1,.8));R(-5,-14,3,1,shade(c1,.7));R(2,-14,3,1,shade(c1,.7))}
 // head + face
 O(-6,-31,12,11,sk);R(4,-30,2,9,skd);R(-5,-21,10,1,skd);O(-8,-27,2,3,sk);O(6,-27,2,3,sk);
 R(-4,-27,3,3,'#fff');R(1,-27,3,3,'#fff');R(-2,-26,2,2,'#4a5bd0');R(2,-26,2,2,'#4a5bd0');R(-1,-26,1,2,'#14123a');R(3,-26,1,2,'#14123a');
 R(-4,-29,3,1,'#2a1a22');R(1,-29,3,1,'#2a1a22');R(-1,-22,3,1,'#9a4a40');
 // front hair
 if(hs==='spiky'){O(-7,-33,14,4,hc);R(-6,-37,3,4,hc);R(-2,-39,4,6,hc);R(3,-37,3,4,hc);R(6,-35,2,3,hc);R(-2,-38,1,3,hl)}
 else if(hs==='pomp'){O(-7,-33,14,4,hc);O(-5,-38,13,6,hc);R(-3,-37,6,1,hl);R(-7,-30,2,4,hc);R(5,-30,2,4,hc)}
 else if(hs==='mohawk'){O(-6,-32,12,2,hd);O(-2,-39,5,8,hc);R(-1,-38,1,5,hl)}
 else if(hs==='wavy'){O(-7,-33,14,4,hc);R(-8,-30,2,10,hc);R(6,-30,2,10,hc);R(-8,-24,1,2,hd);R(-4,-32,5,1,hl)}
 else if(hs==='bob'){O(-7,-33,14,5,hc);R(-8,-30,2,8,hc);R(6,-30,2,8,hc);R(-4,-32,5,1,hl)}
 else if(hs==='afro'){R(-6,-32,12,2,hc);R(-4,-34,5,1,hl)}
 else if(hs==='messy'){O(-7,-33,14,4,hc);R(-9,-35,3,3,hc);R(-4,-37,4,4,hc);R(2,-36,4,3,hc);R(6,-34,4,3,hc);R(-7,-31,2,3,hc)}
 else{O(-7,-33,14,5,hc);R(0,-33,1,3,hd);R(-5,-32,5,1,hl);R(-7,-30,2,4,hc);R(5,-30,2,4,hc)}
 // front arm (punch: anticipation, strike, impact, recovery)
 if(ph<0){O(6,-18,3,9,sk);if(sl)R(6,-18,3,sl,c1)}
 else{const Ln=[3,9,12,6][ph];O(6,-17,Ln,3,sk);if(sl)R(6,-17,Math.min(sl,Ln),3,c1);O(5+Ln,-18,4,4,sk);
  if(ph===2){R(10+Ln,-19,6,1,'rgba(255,255,255,.85)');R(11+Ln,-16,7,1,'rgba(255,255,255,.85)');R(10+Ln,-13,5,1,'rgba(255,255,255,.85)')}}
 if(ty==='armor'){O(5,-20,4,3,c2)}
}

// ---------- world ----------
let M,SU,AVG,SAP={},DMG={},name='START',SPAWN={x:40.5,y:20};
const get=(x,y)=>x<0||x>=W||y>=H?4:y<0?0:M[x*H+y];
const set=(x,y,v)=>{M[x*H+y]=v};
const isS=(x,y)=>{const d=DEF[get(x,y)];return d&&d.s};

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
let dirty=false,WS={owner:null,ownerName:'',locked:false},me=null,lastProf='';const RP={};
const wdata=()=>JSON.stringify({m:enc(M),su:SU,s:Object.entries(SAP).map(([i,t])=>[+i,t])});
function canEdit(){if(me&&name==='START')return false;return !WS.locked||!!(me&&WS.owner===me.id)}
async function saveWorld(){if(!M)return;
 if(me){if(!dirty||!canEdit())return;dirty=false;try{await Net.saveWorld(name,wdata())}catch(e){dirty=true}}
 else try{localStorage.setItem('pr1w:'+name,wdata())}catch(e){}}
function saveAll(){saveWorld();
 if(me){const q=JSON.stringify({gems,inv,look});if(q!==lastProf){lastProf=q;Net.saveProfile({gems,inv,look}).catch(()=>{lastProf=''})}}
 else try{localStorage.setItem('pr1',JSON.stringify({g:gems,inv,look,w:name}))}catch(e){}}

const P={x:0,y:0,vx:0,vy:0,g:false,f:1,jb:0,co:0,jh:false,arm:0,at:0,pt:0};
function respawn(){Object.assign(P,{x:SPAWN.x,y:SPAWN.y,vx:0,vy:0});cam.x=P.x;cam.y=P.y-1}
const cam={x:0,y:0};

async function loadWorld(n){
 n=(n||'START').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,16)||'START';
 if(M)await saveWorld();
 name=n;SAP={};DMG={};PT.length=0;PO.length=0;dirty=false;WS={owner:null,ownerName:'',locked:false};
 let d=null,m=null;
 if(me){try{const r=await Net.getWorld(n);if(r){WS={owner:r.owner,ownerName:r.owner_name||'',locked:!!r.locked};d=JSON.parse(r.data)}}catch(e){toast('Could not load saved world, using a fresh map')}}
 else try{d=JSON.parse(localStorage.getItem('pr1w:'+n))}catch(e){}
 if(d&&d.m&&d.su)m=dec(d.m);
 if(m){M=m;SU=d.su;const now=Date.now();(d.s||[]).forEach(([i,t])=>{if(M[i]!=12)return;if(now-t>=GROW*1e3)M[i]=13;else SAP[i]=t})}
 else[M,SU]=gen(n);
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
function pop(t,g){PO.push({x:P.x+(Math.random()-.5)*.8,y:P.y-2.2,t:0,txt:t,g})}
let toastT;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),2200)}

// ---------- inventory / ui ----------
let sel=0,LIST=[0];
const HB=$('#hotbar');
const icon=id=>{const c=document.createElement('canvas');c.width=c.height=id==='gem'?8:T;c.getContext('2d').drawImage(id==='gem'?GEM:A[id],0,0);return c};
let hot=[],packOpen=false;
function refreshHotbar(){
 const ids=Object.keys(inv).map(Number).filter(i=>inv[i]>0&&DEF[i]&&DEF[i].p).sort((a,b)=>a-b);
 hot=hot.filter(i=>ids.includes(i));for(const i of ids)if(hot.length<8&&!hot.includes(i))hot.push(i);
 LIST=[0,...hot];if(!LIST.includes(sel))sel=0;HB.innerHTML='';
 LIST.forEach((id,i)=>{const d=document.createElement('button');d.className='slot'+(id===sel?' on':'');d.title=id?DEF[id].n:'Fist';
  d.insertAdjacentHTML('beforeend',`<i>${i+1}</i>`);
  if(id){d.append(icon(id));d.insertAdjacentHTML('beforeend',`<b>${inv[id]}</b>`)}else d.insertAdjacentHTML('beforeend','<span>Fist</span>');
  d.onclick=()=>{sel=id;refreshHotbar()};HB.append(d)});
 $('#gems').textContent=gems;if(packOpen)renderPack(ids);
}
function renderPack(ids){const g=$('#pgrid');g.innerHTML='';
 if(!ids.length){g.textContent='Your backpack is empty. Dig some blocks.';return}
 ids.forEach(id=>{const d=document.createElement('button');d.className='slot'+(id===sel?' on':'');d.title=DEF[id].n;d.append(icon(id));
  d.insertAdjacentHTML('beforeend',`<b>${inv[id]}</b><span class="nm">${DEF[id].n}</span>`);
  d.onclick=()=>{sel=id;if(!hot.includes(id)){if(hot.length>=8)hot[7]=id;else hot.push(id)}refreshHotbar();openPack(false)};g.append(d)})}
const pick=i=>{if(LIST[i]!==undefined){sel=LIST[i];refreshHotbar()}};
const add=(id,n,show)=>{inv[id]=(inv[id]||0)+n;if(show)pop('+'+n+' '+DEF[id].n)};
const gain=n=>{gems+=n;pop('+'+n,1)};

function drops(id,d){
 if(id==13){gain(rnd(4,10));add(30,rnd(1,2),1);if(Math.random()<.5)add(7,rnd(1,3));return}
 if(id==12){add(30,1,1);return}
 add(id,1);
 if(d.g&&Math.random()<d.g[0])gain(rnd(d.g[1],d.g[2]));
 if(d.sd&&Math.random()<d.sd)add(30,1,1);
}

const modal=id=>{closeModals();$(id).hidden=false;if(id==='#mW'){$('#wi').value='';listWorlds();setTimeout(()=>$('#wi').focus(),30)}};
const closeModals=()=>document.querySelectorAll('.modal').forEach(m=>m.hidden=true);
const anyModal=()=>[...document.querySelectorAll('.modal')].some(m=>!m.hidden);
function listWorlds(){
 const L=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('pr1l:'))L.push([k.slice(5),+localStorage.getItem(k)])}
 L.sort((a,b)=>b[1]-a[1]);const box=$('#wl');box.innerHTML='';
 L.slice(0,10).forEach(([n])=>{const b=document.createElement('button');b.textContent=n;b.onclick=()=>go(n);box.append(b)});
}
async function go(n){closeModals();await loadWorld(n);if(me)localStorage.setItem('pr1last',name);toast('Entered '+name);refreshHotbar();saveAll()}
$('#bS').onclick=()=>modal('#mS');
$('#bM').onclick=()=>{mute=!mute;$('#bM').classList.toggle('off',mute)};


document.querySelectorAll('[data-x]').forEach(b=>b.onclick=closeModals);
SHOP.forEach(([id,q,p])=>{const r=document.createElement('div');r.className='shoprow';r.append(icon(id));
 r.insertAdjacentHTML('beforeend',`<span>${DEF[id].n} x${q}</span>`);
 const b=document.createElement('button');b.className='btn go';b.append(String(p),icon('gem'));
 b.onclick=()=>{if(id===40&&!me){toast('Log in to buy a Gold Lock');return}if(gems<p){toast('Not enough gems');snd(120,.15,'sawtooth');return}gems-=p;add(id,q);refreshHotbar();snd(520,.1,'triangle',.05,780);saveAll()};
 r.append(b);$('#sl').append(r)});

// ---------- input ----------
const K={},tc={l:0,r:0,j:0};let playing=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;K[e.code]=1;
 if(/^Digit[1-9]$/.test(e.code))pick(+e.code[5]-1);
 if(e.code==='Escape')closeModals();
 if(e.code==='KeyF')punch();
 if(e.code==='Enter'&&playing&&!anyModal()){e.preventDefault();openChat()}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>{K[e.code]=0});addEventListener('blur',()=>{for(const k in K)K[k]=0;ptr.down=false});
[['#tL','l'],['#tR','r'],['#tJ','j']].forEach(([s,k])=>{const b=$(s);
 b.addEventListener('pointerdown',e=>{e.preventDefault();tc[k]=1;b.setPointerCapture(e.pointerId)});
 ['pointerup','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>tc[k]=0))});
const ptr={x:0,y:0,down:false,id:null,touch:false};
const upd=e=>{ptr.x=e.clientX*dpr;ptr.y=e.clientY*dpr};
cv.addEventListener('pointerdown',e=>{ptr.down=true;ptr.id=e.pointerId;ptr.touch=e.pointerType!=='mouse';upd(e);P.at=0;try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){ptr.touch=false;upd(e)}else if(e.pointerId===ptr.id)upd(e)});
['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,e=>{if(e.pointerId===ptr.id)ptr.down=false}));
cv.addEventListener('contextmenu',e=>e.preventDefault());
$('#play').onclick=start;
function start(){snd(440,.1,'triangle',.05,880);showHome()}

// ---------- view ----------
let dpr=1,Z=3,TS=48,OX=0,OY=0;
function resize(){dpr=Math.min(devicePixelRatio||1,3);cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr);
 Z=Math.max(2,Math.floor(Math.min(cv.height/(T*14),cv.width/(T*9))))}
addEventListener('resize',resize);resize();
function view(){TS=T*Z;OX=Math.round(-cam.x*TS+cv.width/2);OY=Math.round(-cam.y*TS+cv.height/2)}

// ---------- physics ----------
function box(){return[Math.floor(P.x-PW),Math.floor(P.x+PW),Math.floor(P.y-PH),Math.floor(P.y-.001)]}
function colX(){const[a,b,c,d]=box();for(let x=a;x<=b;x++)for(let y=c;y<=d;y++)if(isS(x,y)){if(P.vx>0)P.x=x-PW-.001;else if(P.vx<0)P.x=x+1+PW+.001;else continue;P.vx=0;return}}
function colY(){const[a,b,c,d]=box();for(let x=a;x<=b;x++)for(let y=c;y<=d;y++)if(isS(x,y)){if(P.vy>0){P.y=y-.001;P.g=true}else if(P.vy<0)P.y=y+1+PH+.001;else continue;P.vy=0;return}}
const overlap=(tx,ty)=>P.x+PW>tx&&P.x-PW<tx+1&&P.y>ty&&P.y-PH<ty+1;
function die(msg){$('#flash').classList.add('on');requestAnimationFrame(()=>requestAnimationFrame(()=>$('#flash').classList.remove('on')));
 burst(P.x,P.y-.9,'#ff6e1e',16);snd(90,.35,'sawtooth',.07,40);toast(msg||'Burned. Back to the door.');respawn()}

// ---------- actions ----------
let HV=null;
let lastDeny=0,claiming=false;
function deny(){const n=performance.now();if(n-lastDeny<1500)return;lastDeny=n;toast(me&&name==='START'?'START is protected. Pick another world to build.':'This world is locked by '+(WS.ownerName||'its owner'))}
function edit(x,y,v){dirty=true;if(me)Net.send('edit',{x,y,v,u:me.id})}
async function claim(tx,ty){
 if(!me)return toast('Log in to use a Gold Lock');
 if(name==='START')return toast('START cannot be locked');
 if(WS.locked)return toast('This world is already locked');
 if(overlap(tx,ty))return;
 claiming=true;set(tx,ty,40);
 try{await Net.saveProfile({gems,inv,look});await Net.claim(name,wdata())}
 catch(e){set(tx,ty,0);claiming=false;return toast(e.message)}
 if(--inv[40]<=0)delete inv[40];
 WS={owner:me.id,ownerName:me.username,locked:true};dirty=false;updWorldLabel();
 Net.send('lock',{owner:me.id,ownerName:me.username});
 toast('World locked. Only you can build here.');snd(300,.25,'triangle',.06,900);refreshHotbar();saveAll();claiming=false}
async function unlockWorld(tx,ty){
 try{await Net.unlock(name)}catch(e){set(tx,ty,40);return toast(e.message)}
 add(40,1);WS={owner:null,ownerName:'',locked:false};dirty=true;updWorldLabel();
 Net.send('lock',{owner:null});toast('World unlocked. Gold Lock returned.');refreshHotbar()}
function act(tx,ty){
 const id=get(tx,ty);
 if(!canEdit()){if(id||sel)deny();return}
 if(sel===0){
  const d=DEF[id];if(!d||!d.h)return;
  const k=tx*H+ty,now=performance.now();let c=DMG[k];
  if(!c||now-c.t>2000)c=DMG[k]={h:0,t:0};
  c.h++;c.t=now;snd(150+Math.random()*50,.04,'square',.04);burst(tx+.5,ty+.5,d.c,2);
  if(c.h<d.h)return;
  delete DMG[k];delete SAP[k];set(tx,ty,0);edit(tx,ty,0);
  const a=get(tx,ty-1);if(a==12||a==13){set(tx,ty-1,0);delete SAP[tx*H+ty-1];edit(tx,ty-1,0)}
  burst(tx+.5,ty+.5,d.c,12);snd(110,.12,'sawtooth',.06,50);
  if(id==40)unlockWorld(tx,ty);else drops(id,d);
  refreshHotbar();
 }else{
  if(id!==0||tx<1||tx>=W-1||ty<1||ty>=H-2||!(inv[sel]>0))return;
  const d=DEF[sel];
  if(sel===40){if(!claiming)claim(tx,ty);return}
  if(sel===30){const b=get(tx,ty+1);if(b!=1&&b!=2){toast('Plant seeds on grass or dirt');return}set(tx,ty,12);SAP[tx*H+ty]=Date.now();edit(tx,ty,12)}
  else{if(d.s&&overlap(tx,ty))return;set(tx,ty,sel);edit(tx,ty,sel)}
  if(--inv[sel]<=0)delete inv[sel];
  snd(240,.07,'triangle',.05,330);refreshHotbar();
 }
}
let gt=0;
function grow(){const now=Date.now();for(const k in SAP){const x=Math.floor(k/H),y=k%H;if(M[k]!=12){delete SAP[k];continue}
 if(now-SAP[k]>=GROW*1e3){set(x,y,13);delete SAP[k];burst(x+.5,y+.5,'#43a248',10);if(Math.abs(x-P.x)<12)snd(600,.15,'triangle',.04,900)}}}

// ---------- update ----------
function update(dt){
 const l=K.KeyA||K.ArrowLeft||tc.l,r=K.KeyD||K.ArrowRight||tc.r,j=K.Space||K.KeyW||K.ArrowUp||tc.j;
 const ok=playing&&!anyModal(),dir=ok?(r?1:0)-(l?1:0):0;
 if(dir)P.f=dir;
 P.vx+=(dir*7-P.vx)*Math.min(1,dt*(P.g?18:9));
 const jj=ok&&j;if(jj&&!P.jh)P.jb=.1;P.jh=jj;P.jb-=dt;P.co-=dt;if(P.g)P.co=.09;
 if(P.jb>0&&P.co>0){P.vy=-17;P.co=0;P.jb=0;P.g=false;snd(380,.09,'square',.04,620)}
 if(!jj&&P.vy<-5)P.vy+=90*dt;
 P.vy=Math.min(P.vy+60*dt,34);
 P.x+=P.vx*dt;colX();P.g=false;P.y+=P.vy*dt;colY();
 if(get(Math.floor(P.x),Math.floor(P.y-.5))==5||get(Math.floor(P.x),Math.floor(P.y-1.3))==5)die();
 // camera
 const hw=cv.width/(2*TS),hh=cv.height/(2*TS);
 let tx=P.x,ty=P.y-1;
 tx=hw*2>=W?W/2:clamp(tx,hw,W-hw);ty=clamp(ty,hh-8,Math.max(hh-8,H-hh));
 const a=1-Math.exp(-dt*9);cam.x+=(tx-cam.x)*a;cam.y+=(ty-cam.y)*a;
 view();
 // pointer
 HV=null;
 if(ok&&(!ptr.touch||ptr.down)){
  const tx2=Math.floor((ptr.x-OX)/TS),ty2=Math.floor((ptr.y-OY)/TS);
  if(tx2>=0&&tx2<W&&ty2>=0&&ty2<H)HV={x:tx2,y:ty2,ok:Math.hypot(tx2+.5-P.x,ty2+.5-(P.y-.9))<=REACH};
 }
 P.at-=dt;P.arm=Math.max(0,P.arm-dt);P.pt=Math.max(0,P.pt-dt);pcd-=dt;
 if(ok&&ptr.down&&HV&&HV.ok&&P.at<=0){P.at=.12;P.arm=.15;if(sel===0)P.pt=.3;act(HV.x,HV.y)}
 gt+=dt;if(gt>1){gt=0;grow()}
 netTick(dt);
 for(let i=PT.length-1;i>=0;i--){const p=PT[i];p.l-=dt;p.vy+=30*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.l<=0)PT.splice(i,1)}
 for(let i=PO.length-1;i>=0;i--){const p=PO[i];p.t+=dt;p.y-=1.4*dt;if(p.t>1.1)PO.splice(i,1)}
}

// ---------- draw ----------
function draw(t){
 const cw=cv.width,ch=cv.height,ts=TS;
 ctx.imageSmoothingEnabled=false;
 const hz=Math.round(AVG*ts+OY);
 const g=ctx.createLinearGradient(0,hz-ch,0,hz);g.addColorStop(0,'#4a97e6');g.addColorStop(1,'#d2ecfd');ctx.fillStyle=g;ctx.fillRect(0,0,cw,ch);
 ctx.fillStyle='#ffe27a';ctx.fillRect(Math.round(cw*.8),hz-Math.round(ch*.62),ts*1.2,ts*1.2);
 [[.12,'#a4c9e8',8,.05,2],[.28,'#86b0d3',5,.1,7]].forEach(([p,c,h,s,o])=>{ctx.fillStyle=c;const st=4*Z;
  for(let px=-st;px<cw+st;px+=st){const u=(px+cam.x*ts*p)/ts,hg=Math.round((vn(u*s*3,o,7)*h+1.5)*ts*.7/st)*st;ctx.fillRect(px,hz-hg,st+1,hg+ts*8)}});
 ctx.fillStyle='rgba(255,255,255,.92)';
 for(let i=0;i<6;i++){const x=((i*263+t*(5+i*2)-cam.x*ts*.06)%(cw+400)+cw+400)%(cw+400)-200,y=hz-Math.round((5+(i%3)*2.6)*ts),w=(7+(i%3)*3)*Z*2;
  ctx.fillRect(x,y,w,Z*4);ctx.fillRect(x+Z*4,y-Z*3,w-Z*10,Z*3)}
 const x0=Math.max(0,Math.floor(-OX/ts)),x1=Math.min(W-1,Math.ceil((cw-OX)/ts)),y0=Math.max(0,Math.floor(-OY/ts)),y1=Math.min(H-1,Math.ceil((ch-OY)/ts)),lf=Math.floor(t*3)%2;
 for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
  const id=M[x*H+y],px=x*ts+OX,py=y*ts+OY,under=y>SU[x];
  if(id===0){if(under)ctx.drawImage(A.wall,px,py,ts,ts);continue}
  if(under&&!DEF[id].s)ctx.drawImage(A.wall,px,py,ts,ts);
  ctx.drawImage(id===5?A[5][lf]:A[id],px,py,ts,ts)}
 for(const k in DMG){const c=DMG[k],id=M[k];if(!DEF[id]||!DEF[id].h||c.h<1)continue;
  ctx.drawImage(CR[clamp(Math.ceil(c.h/DEF[id].h*4),1,4)-1],Math.floor(k/H)*ts+OX,k%H*ts+OY,ts,ts)}
 if(HV){const px=HV.x*ts+OX,py=HV.y*ts+OY;
  if(sel&&HV.ok&&get(HV.x,HV.y)===0){ctx.globalAlpha=.45;ctx.drawImage(A[sel],px,py,ts,ts);ctx.globalAlpha=1}
  ctx.lineWidth=Z;ctx.strokeStyle=HV.ok?'#fff':'#ff5a5a';ctx.strokeRect(px+Z/2,py+Z/2,ts-Z,ts-Z)}
 // players
 {const plate=(x,y,nm,own,chat,ct)=>{const px=Math.round(x*ts+OX),py=Math.round(y*ts+OY)-42*Z;
   ctx.textAlign='center';ctx.font=`${Math.round(3.4*Z)}px "Press Start 2P",monospace`;
   ctx.fillStyle='#000';ctx.fillText(nm,px+Z/2,py+Z/2);ctx.fillStyle=isDev(nm)?'#ff6ec7':own?'#5fe05f':'#ffffff';ctx.fillText(nm,px,py);
   if(chat&&ct>0){const w=ctx.measureText(chat).width+Z*6,by=py-Z*8;ctx.globalAlpha=clamp(ct,0,1);ctx.fillStyle='#fff';ctx.fillRect(px-w/2,by-Z*4,w,Z*8);ctx.fillStyle='#2b1d14';ctx.fillText(chat,px,by);ctx.globalAlpha=1}
   ctx.textAlign='left'};
  for(const id in RP){const r=RP[id];if(r.first||!r.look)continue;
   drawChar(ctx,Math.round(r.x*ts+OX),Math.round(r.y*ts+OY),Z,r.look,r.f,r.w?Math.round(Math.sin(t*16)*1.5):0,r.pt||0);
   plate(r.x,r.y,r.name||'?',id===WS.owner,r.chat,r.chatT)}
  const walk=Math.abs(P.vx)>.8&&P.g;
  drawChar(ctx,Math.round(P.x*ts+OX),Math.round(P.y*ts+OY),Z,look,P.f,walk?Math.round(Math.sin(t*16)*1.5):0,P.pt);
  plate(P.x,P.y,me?me.username:'Guest',!!me&&WS.owner===me.id,myChat,myChatT)}

 for(const p of PT){ctx.globalAlpha=clamp(p.l*2.5,0,1);ctx.fillStyle=p.c;ctx.fillRect(Math.round(p.x*ts+OX),Math.round(p.y*ts+OY),Z*2,Z*2)}ctx.globalAlpha=1;
 ctx.font=`${Math.round(4.5*Z)}px "Press Start 2P",monospace`;ctx.textBaseline='middle';
 for(const p of PO){const px=Math.round(p.x*ts+OX),py=Math.round(p.y*ts+OY);ctx.globalAlpha=clamp(2-p.t*1.8,0,1);
  ctx.fillStyle='#000';ctx.fillText(p.txt,px+Z,py+Z);ctx.fillStyle=p.g?'#4fd8ff':'#f3e6c4';ctx.fillText(p.txt,px,py);
  if(p.g)ctx.drawImage(GEM,px+ctx.measureText(p.txt).width+Z*2,py-Z*4,Z*8,Z*8);ctx.globalAlpha=1}
 // cave light
 const dk=clamp((P.y-AVG-4)/26,0,.78);
 if(dk>0){const cx=P.x*ts+OX,cy=(P.y-.9)*ts+OY,gr=ctx.createRadialGradient(cx,cy,ts*3,cx,cy,ts*11);gr.addColorStop(0,'rgba(6,3,12,0)');gr.addColorStop(1,`rgba(6,3,12,${dk})`);ctx.fillStyle=gr;ctx.fillRect(0,0,cw,ch)}
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
  pos(p){const r=RP[p.id];if(!r||typeof p.x!=='number')return;r.tx=p.x;r.ty=p.y;r.f=p.f>0?1:-1;r.w=p.w;r.a=p.a;if(p.a&&!(r.pt>0))r.pt=.3;if(r.first){r.x=p.x;r.y=p.y;r.first=false}},
  edit(p){if(name==='START'||(WS.locked&&p.u!==WS.owner))return;const{x,y,v}=p;
   if(!Number.isInteger(x)||!Number.isInteger(y)||x<1||x>=W-1||y<1||y>=H-2||(v!==0&&!DEF[v]))return;
   set(x,y,v);const k=x*H+y;delete DMG[k];if(v==12)SAP[k]=Date.now();else delete SAP[k]},
  chat(p){if(typeof p.t!=='string')return;const t=p.t.slice(0,120);addLog(String(p.name).slice(0,16),t);const r=RP[p.id];if(r){r.chat=t;r.chatT=4}},
  cmd(p){onCmd(p)},
  lock(p){WS=p.owner?{owner:p.owner,ownerName:String(p.ownerName||'').slice(0,16),locked:true}:{owner:null,ownerName:'',locked:false};updWorldLabel()}
 });
}
function netTick(dt){
 myChatT-=dt;
 if(me){const now=performance.now(),mv=Math.abs(P.x-lx)+Math.abs(P.y-ly)>.01||P.pt>0;
  if(now-st>(mv?120:900)){st=now;lx=P.x;ly=P.y;Net.send('pos',{id:me.id,x:+P.x.toFixed(2),y:+P.y.toFixed(2),f:P.f,w:Math.abs(P.vx)>.8&&P.g?1:0,a:P.pt>0?1:0})}}
 for(const id in RP){const r=RP[id],a=1-Math.exp(-dt*14);r.x+=(r.tx-r.x)*a;r.y+=(r.ty-r.y)*a;if(r.chatT>0)r.chatT-=dt;if(r.pt>0)r.pt-=dt;
  if(voiceOn)Net.setVol(id,clamp(1-Math.hypot(r.x-P.x,r.y-P.y)/30,0,1))}
}
$('#bV').onclick=async()=>{
 if(!me){toast('Log in to use voice chat');return}
 try{voiceOn=await Net.voice(!voiceOn)}catch(e){voiceOn=false;toast('Microphone blocked. Allow it in your browser.')}
 $('#bV').classList.toggle('on',voiceOn)};

// ---------- style editor ----------
const ROWS=[['Hair','h',HAIR,2],['Shirt','s',SHIRT,3],['Pants','p',PANTS,3],['Shoes','o',SHOES,3],['Skin','k',SKINN,-1]];
function drawPrev(){const c=$('#stPrev'),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#a6d2f6';g.fillRect(0,0,c.width,c.height);g.fillStyle='#68b03e';g.fillRect(0,c.height-20,c.width,20);drawChar(g,c.width/2,c.height-20,4,look,1,0,0)}
function buildStyle(){const b=$('#stRows');b.innerHTML='';
 ROWS.forEach(([t,k,arr,ni])=>{const n=arr.length,r=document.createElement('div');r.className='strow';
  r.innerHTML=`<span>${t}</span><button class="btn">&lt;</button><em></em><button class="btn">&gt;</button>`;
  const[,pv,em,nx]=r.children,u=()=>{const it=arr[look[k]];em.textContent=(look[k]+1)+'/'+n+' '+(ni<0?it:it[ni]);drawPrev()};
  pv.onclick=()=>{look[k]=(look[k]+n-1)%n;u()};nx.onclick=()=>{look[k]=(look[k]+1)%n;u()};u();b.append(r)});
 $('#stOut').hidden=!me}
$('#bY').onclick=()=>{buildStyle();modal('#mY')};
$('#stDone').onclick=()=>{closeModals();saveAll();if(me)Net.track({look})};
$('#stOut').onclick=async()=>{await saveWorld();saveAll();await Net.signOut();location.reload()};

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
function addLog(who,txt,sys){const d=document.createElement('div');if(sys)d.className='sys';else{const b=document.createElement('b');b.textContent=who+': ';if(isDev(who))b.style.color='#ff6ec7';d.append(b)}
 d.append(document.createTextNode(txt));const bot=CL.scrollHeight-CL.scrollTop-CL.clientHeight<28;CL.append(d);while(CL.children.length>300)CL.firstChild.remove();if(bot)CL.scrollTop=CL.scrollHeight}
const sysMsg=t=>addLog('',t,1);
function openChat(){if(!me){toast('Log in to chat with other players');return}for(const k in K)K[k]=0;CI.focus()}
CI.addEventListener('keydown',e=>{
 if(e.key==='Enter'){const t=CI.value.trim().slice(0,120);CI.value='';CI.blur();if(!t)return;
  if(!me){toast('Log in to chat with other players');return}
  if(t[0]==='/'){runCmd(t);return}
  if(performance.now()-lastSay>800){lastSay=performance.now();addLog(me.username,t);myChat=t;myChatT=4;Net.send('chat',{id:me.id,name:me.username,t})}}
 else if(e.key==='Escape'){CI.value='';CI.blur()}});
const cg=$('#cgrip'),cp=$('#chat');let cr=null;
cg.addEventListener('pointerdown',e=>{cr={x:e.clientX,y:e.clientY,w:cp.offsetWidth,h:CL.offsetHeight};cg.setPointerCapture(e.pointerId);e.preventDefault()});
cg.addEventListener('pointermove',e=>{if(!cr)return;cp.style.width=clamp(cr.w+e.clientX-cr.x,200,innerWidth-90)+'px';CL.style.height=clamp(cr.h+e.clientY-cr.y,48,innerHeight*.6)+'px'});
['pointerup','pointercancel'].forEach(ev=>cg.addEventListener(ev,()=>cr=null));

// ---------- punch + owner/dev commands ----------
let pcd=0;
function punch(){
 if(!playing||pcd>0||anyModal())return;pcd=.32;P.pt=.3;P.arm=.15;snd(200,.08,'square',.05,90);
 const tx=Math.floor(P.x+P.f*(PW+.45)),ty=Math.floor(P.y-1.1),o=sel;sel=0;act(tx,ty);sel=o}
$('#bP').onclick=punch;$('#tP').addEventListener('pointerdown',e=>{e.preventDefault();punch()});
function runCmd(t){
 const[a,...r]=t.slice(1).trim().split(/\s+/),cmd=a.toLowerCase(),who=(r[0]||'').replace(/^@/,'').toLowerCase();
 if(cmd!=='pull'&&cmd!=='kick'){toast('Commands: /pull name, /kick name');return}
 if(!(WS.locked&&WS.owner===me.id)&&!isDev(me.username)){toast('Only the world owner can use /'+cmd);return}
 if(!who){toast('Usage: /'+cmd+' name');return}
 const id=Object.keys(RP).find(k=>(RP[k].name||'').toLowerCase()===who);
 if(!id){toast('That player is not in this world');return}
 if(isDev(RP[id].name)&&!isDev(me.username)){toast('You cannot target the developer');return}
 Net.send('cmd',{k:cmd,to:id,from:me.id,fn:me.username,x:+P.x.toFixed(2),y:+P.y.toFixed(2)});sysMsg('/'+cmd+' '+RP[id].name)}
function onCmd(p){
 if(!me||p.to!==me.id)return;
 const sd=RP[p.from],dev=!!sd&&isDev(sd.name);
 if(!(dev||(WS.locked&&p.from===WS.owner))||(isDev(me.username)&&!dev))return;
 if(p.k==='pull'&&typeof p.x==='number'&&typeof p.y==='number'){P.x=clamp(p.x,1.5,W-1.5);P.y=clamp(p.y,2,H-3);P.vx=P.vy=0;cam.x=P.x;cam.y=P.y-1;toast('Pulled by '+p.fn)}
 else if(p.k==='kick')die('Kicked by '+p.fn)}

// ---------- pixel icons ----------
const ICO={
 quit:['######..','#....#..','#..#.#..','#....#..','#....#..','#....#..','######..','........'],
 punch:['..####..','.######.','########','########','########','.######.','.######.','..####..'],
 shop:['..####..','..#..#..','.######.','########','########','########','########','.######.'],
 style:['.##..##.','########','########','#.####.#','..####..','..####..','..####..','........'],
 friends:['..####..','..####..','..####..','...##...','.######.','########','########','########'],
 dice:['########','#......#','#.#..#.#','#......#','#..##..#','#......#','#.#..#.#','########'],
 mic:['..####..','..####..','..####..','#.####.#','#.####.#','.######.','...##...','..####..'],
 sound:['....#...','...##.#.','####.#.#','####.#.#','####.#.#','...##.#.','....#...','........']};
function icon8(rows){const c=document.createElement('canvas');c.width=c.height=8;const g=c.getContext('2d');g.fillStyle='#f3e6c4';rows.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='#')g.fillRect(x,y,1,1)}));return c}
function buildIcons(){document.querySelectorAll('[data-ico]').forEach(b=>b.prepend(icon8(ICO[b.dataset.ico])))}

// ---------- backpack: drag the hotbar upward ----------
let dy0=null,py0=null;
function openPack(v){packOpen=v;$('#pack').classList.toggle('open',v);if(v)refreshHotbar()}
$('#dock').addEventListener('pointerdown',e=>{dy0=e.clientY});
$('#phead').addEventListener('pointerdown',e=>{py0=e.clientY});
addEventListener('pointermove',e=>{if(dy0!==null&&dy0-e.clientY>30){dy0=null;openPack(true)}if(py0!==null&&e.clientY-py0>30){py0=null;openPack(false)}});
['pointerup','pointercancel'].forEach(ev=>addEventListener(ev,()=>{dy0=null;py0=null}));
$('#grab').onclick=()=>openPack(!packOpen);$('#pclose').onclick=()=>openPack(false);

// ---------- friends ----------
let lobby={};
function lobbyInit(){if(!me||!Net.on)return;Net.lobby({id:me.id,name:me.username,world:inWorld?name:null},st=>{lobby={};for(const id in st){const m=st[id][0];if(m&&m.name)lobby[m.name.toLowerCase()]=m.world||null}})}
async function addFriend(u){try{toast(await Net.addFriend(u));renderFriends()}catch(e){toast(e.message)}}
async function respond(u,a){try{await Net.respondFriend(u,a);renderFriends()}catch(e){toast(e.message)}}
async function renderFriends(){
 const box=$('#fl');box.textContent='';
 if(!me){box.textContent='Log in to add friends.';return}
 let list=[];try{list=await Net.friends()}catch(e){box.textContent=e.message;return}
 const sec=t=>{const h=document.createElement('h3');h.textContent=t;box.append(h)};
 const row=(nm,sub,btns)=>{const r=document.createElement('div');r.className='frow';const a=document.createElement('span');a.textContent=nm;if(isDev(nm))a.style.color='#ff6ec7';
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
 await loadWorld(n);if(me){try{localStorage.setItem('pr1last',name)}catch(e){}Net.lobbyTrack({world:name});Net.visit(name).catch(()=>{})}
 pushHist(name);refreshHotbar();toast('Entered '+name);saveAll()}
async function quitWorld(){await saveWorld();saveAll();showHome()}
$('#hgo').onclick=()=>enterWorld($('#hi').value||'START');
$('#hi').addEventListener('keydown',e=>{if(e.key==='Enter')enterWorld($('#hi').value||'START')});
$('#hstart').onclick=()=>enterWorld('START');$('#bQ').onclick=quitWorld;
$('#hY').onclick=()=>{buildStyle();modal('#mY')};
$('#hOut').onclick=async()=>{await saveWorld();saveAll();await Net.signOut();location.reload()};

// ---------- accounts / title ----------
function applyLogin({user,profile}){me={id:user.id,username:profile.username};gems=profile.gems;inv=profile.inv||{};look=Object.assign(look0(),profile.look||{});lastProf=JSON.stringify({gems,inv,look});lobbyInit()}
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
 buildCasino();buildIcons();
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
setInterval(saveAll,5000);
addEventListener('beforeunload',saveAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveAll()});
})();
