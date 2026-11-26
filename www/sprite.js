// Sprite builder: base body traced from the character kit (25x44), recoloured per look. Pure pixel buffers, no canvas needed.
(()=>{
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SKINN=['Pale','Light','Medium','Tan','Deep Tan','Dark'];
const SKINT=['#f7cdb4','#ecab89','#d38f62','#b27244','#865030','#5a3322'];
const HAIR=[['spiky','#d92f2f','Spiky Red'],['pomp','#2f6fe0','Blue Pompadour'],['mohawk','#3fc24d','Green Mohawk'],['wavy','#7a4a2b','Long Brown Wavy'],['bob','#9b4fd0','Purple Bob'],['afro','#1b1b22','Black Afro'],['messy','#2fae55','Green Messy'],['wavy','#c0392b','Long Red Wavy'],['slick','#d94a3a','Red Slick'],['spiky','#f2c94c','Spiky Blonde'],['pomp','#1f4fb0','Navy Pompadour'],['pomp','#3fc24d','Green Pompadour'],['mohawk','#2a9d44','Forest Mohawk'],['bob','#7a4a2b','Brown Bob'],['bob','#b06ae0','Lilac Bob'],['afro','#33261c','Dark Afro'],['afro','#7a4a2b','Brown Afro'],['spiky','#2f6fe0','Spiky Blue'],['messy','#f2c94c','Messy Blonde'],['wavy','#9b4fd0','Long Purple Wavy']];
const SHIRT=[['hoodie','#2f6fd0','#1d4a95','Blue Hoodie'],['tee','#3fa34d','#2a7a36','Green T-Shirt'],['armor','#a4adba','#6b7380','Armor Plate'],['vest','#c0392b','#f1f1f1','Red Vest'],['vest','#b3261e','#2b2b33','Dark Red Vest'],['sweater','#8a5a2b','#c98e63','Striped Hoodie'],['stripe','#3fa34d','#e6c229','Green Stripe'],['armor','#c3ccd8','#7b8696','Steel Plate'],['sweater','#2f7fd1','#e8e8ee','Blue Sweater'],['puffer','#c0392b','#f1f1f1','Red Puffer'],['hoodie','#5a3a2a','#3a2418','Brown Hoodie'],['tee','#e0642b','#a63f1b','Orange T-Shirt'],['armor','#8a93b8','#5e6785','Iron Plate'],['jacket','#2f6fd0','#f1f1f1','Blue Jacket'],['vest','#2f6fd0','#f1f1f1','Blue Vest'],['stripe','#2b3a67','#f1f1f1','Sailor Stripe'],['jacket','#f2c94c','#c9a227','Yellow Jacket'],['tee','#9b4fd0','#6e2fa0','Purple T-Shirt'],['jacket','#e8b82c','#2b2b33','Gold Jacket'],['stripe','#c0392b','#f1f1f1','Red Stripe']];
const PANTS=[['jeans','#3a5fa0','#2a4580','Denim Jeans'],['shorts','#a58d5a','#7d6a3f','Cargo Shorts'],['jeans','#26262e','#15151a','Black Trousers'],['jeans','#2f7a3a','#1f5a28','Green Slacks'],['skirt','#8a8f9c','#5e6370','Chainmail Skirt'],['track','#2f5fc0','#f1f1f1','Blue Trackpants'],['jeans','#2a3a6a','#1b2748','Dark Denim'],['track','#26262e','#3fb34d','Black Trackpants'],['shorts','#3a5fa0','#2a4580','Denim Shorts'],['skirt','#2f7a3a','#1f5a28','Green Skirt'],['jeans','#7a2a2a','#521b1b','Maroon Trousers'],['track','#3fa34d','#f1f1f1','Green Trackpants'],['jeans','#8a8f9c','#5e6370','Gray Slacks'],['shorts','#26262e','#15151a','Black Shorts'],['jeans','#c9b27a','#a38f57','Khaki Pants'],['track','#c0392b','#f1f1f1','Red Trackpants'],['skirt','#7a4a2b','#523119','Leather Skirt'],['jeans','#5a3a7a','#3b2552','Purple Slacks'],['shorts','#2f7a3a','#1f5a28','Green Shorts'],['track','#e8e8ee','#2f6fd0','White Trackpants']];
const SHOES=[['sneaker','#f1f1f1','#2f6fd0','Sneakers'],['boot','#8a5a2b','#5a3a1b','Combat Boots'],['sandal','#c9a06a','#7a5a2b','Sandals'],['formal','#1b1b22','#4a4a55','Formal Shoes'],['formal','#6b3f2f','#9a6a4a','Brown Formal'],['hiker','#b8873a','#6b4a1f','Hiker Boots'],['hightop','#d92f2f','#f1f1f1','Red High-tops'],['sandal','#8a5a2b','#4a2f18','Leather Sandals'],['sneaker','#f1f1f1','#2f6fd0','White Sneakers'],['boot','#26262e','#15151a','Black Boots'],['sneaker','#d92f2f','#f1f1f1','Red Sneakers'],['formal','#2b3a67','#4a5a8a','Navy Shoes'],['hiker','#7a8f5a','#4a5a33','Moss Hikers'],['hightop','#2f6fd0','#f1f1f1','Blue High-tops'],['sandal','#e8e8ee','#9a9aa8','White Sandals'],['boot','#7a4a2b','#4a2a18','Brown Boots'],['sneaker','#3fb34d','#f1f1f1','Green Sneakers'],['hightop','#1b1b22','#f1f1f1','Black High-tops'],['hiker','#c0392b','#7a2418','Red Hikers'],['formal','#e8e8ee','#9a9aa8','White Shoes']];
const BASE=[".........KKKKKKKK........", ".......KKlmmmmmmDK.......", "......KlkmqqqqrrqmK......", ".....KlkrrrrrrqttroK.....", "....KjlrrrrrrrrrrqqlK....", "....KllrrrrrrrrrrrrrK....", "....KllrrrrrrrrrrrrrK....", "....KllrrrrrrrrrrrrrK....", "....KllrrrrrrrrrrrqrK....", "....KllrqKKKDprrqDKKK....", "...KmolqqWW.MDrqDKMMK....", "...KoelrrWWBBmqqtBBWK....", "...KocmrrWWBBqrqWBBWK....", "...KoimrrttiiqrrtjkpK....", "...DcMjorqrrrrmnrrroK....", "....KKDlrrrrrroorrrnK....", ".......KmqrrndddmrnD.....", ".......KDkorpjjjpoD......", ".......KKDbnnnnnnMK......", ".....DKMbbDcbbbbcDD......", ".....cconnkDDDDDDmlbD....", "....DqrrrrrmmmmmorprD....", "...KpqqmlrrrrrqrrrgosK...", "...DqqobioqrrrorrqDkqdD..", "..KprpjKjloopomppnKiprK..", "..DpnmcKjnmmmmmnnkKjnpK..", ".KknghKKkrrrrrrrrnKfhmiK.", ".KrrmK.KkrrrrrprrnKKkrqK.", ".KpojK.KkrrrrrorqmKKjopK.", ".DnmjK.KkqrrrrrrrkKKimoM.", "KrrrqD.KjlqqrrrrpfKKinqr.", "KqrrppKKhjnmqqpqknKKoeorK", "KqqrclKKpqrjhhifrqKKDfnnK", "KneppaKKrrqoKKKlrrKKdoodK", ".KKKKK.KrrrhK.KkrrK.KKKK.", ".......KrrqgK.KjpqK......", "......KapqlK..KjfqK......", "......KldjgK..KmfgK......", "......KlllK...KllkK......", "......KmllK...KlllK......", "......KmlmK...KlllK......", ".....KqqqkK...KkqqqD.....", "....KnnnnkK...KlllllK....", "....KKKKKKK...KKKKKKK...."];
const CW=56,CH=56,BX=8,BY=12;
const K=[10,4,6],DK=[65,38,30],MM=[93,61,53],WH=[215,207,210],BL=[44,48,96],WHITE=[255,255,255];
const hex=c=>{const n=parseInt(c.slice(1),16);return[n>>16&255,n>>8&255,n&255]};
const mul=(c,k)=>c.map(v=>clamp(Math.round(v*k),0,255));
const mkBuf=()=>new Uint8ClampedArray(CW*CH*4);
const has=(b,x,y)=>x>=0&&y>=0&&x<CW&&y<CH&&b[(y*CW+x)*4+3]>0;
function put(b,x,y,c){if(x<0||y<0||x>=CW||y>=CH)return;const i=(y*CW+x)*4;b[i]=c[0];b[i+1]=c[1];b[i+2]=c[2];b[i+3]=255}
function rect(b,x,y,w,h,c,atop){for(let j=0;j<h;j++)for(let i=0;i<w;i++){if(atop&&!has(b,x+i,y+j))continue;put(b,x+i,y+j,c)}}
function tri(b,cx,top,h,w,c){for(let i=0;i<h;i++){const ww=Math.max(1,Math.round((i+1)*w/h));rect(b,cx-(ww>>1),top+i,ww,1,c)}}
function disc(b,cx,cy,rx,ry,c){for(let y=-ry;y<=ry;y++){const w=Math.round(rx*Math.sqrt(1-y*y/(ry*ry)));rect(b,cx-w,cy+y,w*2+1,1,c)}}
function blit(dst,src,outline){
 if(outline)for(let y=0;y<CH;y++)for(let x=0;x<CW;x++)if(!has(src,x,y)&&(has(src,x-1,y)||has(src,x+1,y)||has(src,x,y-1)||has(src,x,y+1)))put(dst,x,y,K);
 for(let i=0;i<src.length;i+=4)if(src[i+3]){dst[i]=src[i];dst[i+1]=src[i+1];dst[i+2]=src[i+2];dst[i+3]=255}}
const span=r=>{const s=BASE[r];let a=s.search(/[^.]/),z=s.length-1;while(s[z]==='.')z--;return[a,z]};

function hairLayers(H,back,front){
 const hs=H[0],hc=hex(H[1]),hl=mul(hc,1.4),hd=mul(hc,.66);
 const B=(x,y,w,h,c)=>rect(back,x+BX,y+BY,w,h,c),F=(x,y,w,h,c)=>rect(front,x+BX,y+BY,w,h,c);
 const FT=(cx,top,h,w,c)=>tri(front,cx+BX,top+BY,h,w,c);
 const cap=n=>{for(let r=0;r<n;r++){const[a,z]=span(r);F(a,r,z-a+1,1,hc)}};
 const sides=(n)=>{F(4,5,3,n,hc);F(18,5,3,n,hc)};
 if(hs==='spiky'){cap(5);sides(4);FT(7,-8,9,6,hc);FT(12,-12,13,7,hc);FT(17,-9,10,6,hc);FT(4,-3,6,4,hc);FT(20,-4,7,4,hc);F(11,-9,1,6,hl);F(6,-5,1,3,hl);F(16,-6,1,4,hl);F(8,1,6,1,hl)}
 else if(hs==='pomp'){cap(4);sides(4);disc(front,13+BX,-2+BY,10,6,hc);F(15,-2,8,7,hc);F(7,-7,8,1,hl);F(6,-5,3,1,hl);F(17,-5,5,1,hl);F(8,1,8,1,hl);F(13,-4,1,6,hd)}
 else if(hs==='mohawk'){cap(2);F(9,2,7,3,hc);F(9,-9,7,11,hc);FT(12,-14,6,7,hc);F(11,-8,1,9,hl);F(14,-6,1,8,hd);F(8,3,1,3,hc);F(16,3,1,3,hc)}
 else if(hs==='wavy'){B(2,2,21,27,hc);B(1,12,23,14,hc);for(const x of[4,7,17,20])B(x,12,1,15,hd);B(3,27,4,3,hc);B(10,28,5,2,hc);B(18,27,4,3,hc);cap(6);F(4,5,3,13,hc);F(18,5,3,13,hc);F(10,2,4,4,hl);F(7,4,3,2,hc);F(15,4,3,2,hc)}
 else if(hs==='bob'){B(2,3,21,17,hc);B(2,18,5,3,hc);B(18,18,5,3,hc);cap(6);F(4,5,3,12,hc);F(18,5,3,12,hc);F(7,5,12,3,hc);F(9,1,6,1,hl);F(5,9,1,5,hd);F(19,9,1,5,hd)}
 else if(hs==='afro'){disc(back,12+BX,3+BY,14,13,hc);disc(back,12+BX,-3+BY,10,8,hc);cap(4);F(6,4,13,3,hc);F(4,5,3,5,hc);F(18,5,3,5,hc);F(7,-9,5,1,hl);F(14,-6,4,1,hl);F(3,-1,3,1,hl)}
 else if(hs==='messy'){cap(5);sides(4);FT(7,-5,7,6,hc);FT(12,-8,10,6,hc);FT(17,-6,8,6,hc);FT(3,0,5,4,hc);FT(21,-1,6,4,hc);F(8,5,3,3,hc);F(14,5,4,3,hc);F(11,-6,1,4,hl);F(6,-3,1,3,hl);F(9,0,5,1,hl)}
 else{cap(6);sides(4);F(5,-1,15,2,hc);F(8,-2,9,1,hc);F(9,1,7,1,hl);F(8,3,1,3,hd);F(5,5,14,2,hc)}
}

function build(L,frame){
 const b=mkBuf(),H=HAIR[(L.h|0)%20],S=SHIRT[(L.s|0)%20],Pn=PANTS[(L.p|0)%20],Sh=SHOES[(L.o|0)%20],sk=hex(SKINT[(L.k|0)%6]);
 const st=S[0],c1=hex(S[1]),c2=hex(S[2]),tp=Pn[0],p1=hex(Pn[1]),p2=hex(Pn[2]),sht=Sh[0],s1=hex(Sh[1]),s2=hex(Sh[2]);
 const punch=frame>=3,ph=frame-3;
 const sleeveEnd=({tee:25,vest:-1,armor:23})[st]??30;
 const shoeStart=({sneaker:41,formal:41,sandal:99,hiker:39,boot:38,hightop:37})[sht];
 const pantsEnd=(tp==='shorts'||tp==='skirt')?36:40;
 const back=mkBuf(),front=mkBuf(),ex=mkBuf(),wing=mkBuf();
 if(L.w){const w1=[244,248,255],w2=[188,208,238];for(let k=0;k<6;k++){const y=13+k*3,ln=12-k;rect(wing,5-ln+BX,y+BY,ln,2,k%2?w2:w1);rect(wing,19+BX,y+BY,ln,2,k%2?w2:w1)}rect(wing,3+BX,11+BY,3,3,w1);rect(wing,19+BX,11+BY,3,3,w1)}
 hairLayers(H,back,front);
 for(let r=0;r<44;r++)for(let c=0;c<25;c++){
  const ch=BASE[r][c];if(ch==='.')continue;
  if(punch&&c>=18&&r>=20&&r<=34)continue;
  let col;
  if(ch>='a'&&ch<='z'){
   const k=.4+.04*(ch.charCodeAt(0)-97);let base=sk;
   if((r>=20&&r<=31&&c>=7&&c<=17)||(r>=21&&r<=sleeveEnd&&(c<=6||c>=18)))base=c1;
   else if(r>=32&&r<=pantsEnd&&c>=6&&c<=20)base=p1;
   else if(r>=shoeStart&&r<=43)base=s1;
   col=mul(base,k);
  }else col={K,D:DK,M:MM,W:WH,B:BL}[ch];
  const lift=((frame===1&&c<=12)||(frame===2&&c>=13))&&r>=36?2:0;
  put(b,c+BX,r+BY-lift,col);
 }
 const A=(x,y,w,h,c)=>rect(b,x+BX,y+BY,w,h,c,true);
 A(7,32,11,1,mul(p1,.65));
 // shirts
 if(st==='tee')A(10,20,5,1,mul(c1,.65));
 else if(st==='hoodie'){A(7,19,11,3,c2);A(9,27,7,3,mul(c1,.72));A(10,22,1,5,[244,244,248]);A(14,22,1,5,[244,244,248])}
 else if(st==='armor'){A(8,21,9,10,mul(c1,1.1));A(12,21,1,10,c2);A(7,29,11,2,[74,50,32]);rect(ex,3+BX,19+BY,6,4,c2);rect(ex,16+BX,19+BY,6,4,c2)}
 else if(st==='vest'){A(11,21,3,10,c2);A(7,21,1,10,mul(c1,.7));A(17,21,1,10,mul(c1,.7))}
 else if(st==='sweater'){for(const y of[22,25,28]){A(7,y,11,1,c2);A(0,y,7,1,c2);A(18,y,7,1,c2)}}
 else if(st==='stripe'){for(let y=20;y<=30;y+=2){A(7,y,11,1,c2);A(0,y,7,1,c2);A(18,y,7,1,c2)}}
 else if(st==='puffer'){A(8,19,9,2,c2);for(const y of[24,27,30]){A(7,y,11,1,mul(c1,.62));A(0,y,7,1,mul(c1,.62));A(18,y,7,1,mul(c1,.62))}}
 else if(st==='jacket'){A(12,21,1,10,c2);A(9,19,7,2,mul(c1,.78));A(8,28,3,1,mul(c1,.65));A(14,28,3,1,mul(c1,.65))}
 // pants
 if(tp==='track'){A(7,33,1,8,p2);A(17,33,1,8,p2);A(6,33,1,8,p2);A(18,33,1,8,p2)}
 else if(tp==='jeans'){A(12,33,1,3,mul(p1,.7));A(7,36,5,1,mul(p1,.8));A(14,36,5,1,mul(p1,.8))}
 else if(tp==='shorts'){A(6,36,6,1,p2);A(14,36,6,1,p2)}
 else{for(let y=32;y<=37;y++)rect(ex,6+BX+(y>34?-1:0),y+BY,13+(y>34?2:0),1,(y%2?p1:mul(p1,1.15)));rect(ex,5+BX,37+BY,15,1,p2)}
 // shoes
 if(sht==='sneaker'){A(4,42,7,1,s2);A(14,42,7,1,s2);A(4,41,3,1,s2);A(18,41,3,1,s2)}
 else if(sht==='boot'){A(6,38,6,1,s2);A(14,38,6,1,s2);A(4,42,7,1,mul(s1,.6));A(14,42,7,1,mul(s1,.6))}
 else if(sht==='hiker'){A(8,39,1,2,[241,241,241]);A(17,39,1,2,[241,241,241]);A(4,42,7,1,s2);A(14,42,7,1,s2)}
 else if(sht==='hightop'){A(4,41,4,2,s2);A(17,41,4,2,s2);A(6,37,6,1,s2);A(14,37,6,1,s2)}
 else if(sht==='formal'){A(5,41,3,1,s2);A(17,41,3,1,s2)}
 else{A(5,41,6,1,s1);A(14,41,6,1,s1);A(4,42,7,1,s2);A(14,42,7,1,s2)}
 // punch arm
 if(punch){
  const Ln=[3,9,12,6][ph],y0=24,sl=({tee:4,vest:0,armor:3})[st]??Ln;
  for(let r=22;r<=33;r++)if(has(b,17+BX,r+BY)&&!has(b,18+BX,r+BY))put(b,18+BX,r+BY,K);
  for(let i=0;i<Ln;i++){const base=i<Math.min(sl,Ln)?c1:sk;put(b,18+i+BX,y0-1+BY,K);put(b,18+i+BX,y0+4+BY,K);[1.1,1,1,.82].forEach((k,j)=>put(b,18+i+BX,y0+j+BY,mul(base,k)))}
  const fx=18+Ln;rect(b,fx+BX,21+BY,6,9,K);rect(b,fx+1+BX,22+BY,4,7,sk);rect(b,fx+1+BX,27+BY,4,2,mul(sk,.8));rect(b,fx+3+BX,23+BY,1,3,mul(sk,.72));rect(b,fx+1+BX,22+BY,4,1,mul(sk,1.12));
  if(ph===2){rect(b,fx+8+BX,20+BY,6,1,WHITE);rect(b,fx+9+BX,25+BY,8,1,WHITE);rect(b,fx+8+BX,30+BY,5,1,WHITE)}
 }
 const out=mkBuf();blit(out,wing,true);blit(out,back,true);blit(out,b,false);blit(out,ex,true);blit(out,front,true);
 return{w:CW,h:CH,data:out};
}
window.PRSprite={SKINN,SKINT,HAIR,SHIRT,PANTS,SHOES,build,CW,CH,CX:BX+12};
})();
