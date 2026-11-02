/* ===== world: continent, zones, locations, road network, terrain chunks =====
   Everything here is generated from fixed seeds, so the world is identical every time. */
const M=10;               // pixels per metre (1 km = 10,000 px)
const CELL=512;
// ---- noise ----
function vnoise(seed){const h=(ix,iy)=>hash2(ix*7+seed,iy*13-seed*3)/4294967296;
  return (x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
    const a=h(ix,iy),b=h(ix+1,iy),c=h(ix,iy+1),d=h(ix+1,iy+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};}
function fbm(n,x,y,oct){let s=0,a=0.5,f=1,t=0;for(let i=0;i<oct;i++){s+=a*n(x*f+i*17.3,y*f-i*9.1);t+=a;a*=0.5;f*=2;}return s/t;}
const nLand=vnoise(11),nDet=vnoise(23),nWarpX=vnoise(37),nWarpY=vnoise(41);
// Test range: a 1 km square island with every feature, chosen from the title screen or a #testrange link
const TEST_MODE=(function(){try{return location.hash==='#testrange'||localStorage.getItem('lastsurvivor.world')==='test';}catch(e){return false;}})();
const WX=TEST_MODE?5600:800000,WY=TEST_MODE?5600:550000;   // continent box: 160 x 110 km (test island: 1 x 1 km)
function landValue(x,y){if(TEST_MODE){const m=Math.max(Math.abs(x),Math.abs(y));return (4950-m)/3000+(fbm(nDet,x/900,y/900,2)-0.5)*0.03;}const e=(x/(WX*0.86))**2+(y/(WY*0.84))**2;
  return (fbm(nLand,x/240000,y/240000,5)-0.5)*1.1+0.42-e*0.62+(fbm(nDet,x/9000,y/9000,2)-0.5)*0.03;}
// ---- zones ----
const BIOMES={
  red:{ground:'#d39a5c',light:'rgba(238,182,120,.42)',dark:'rgba(158,88,44,.26)',rocks:1,off:1,decor:['spinifex','spinifex','mound','bone','tire']},
  salt:{ground:'#e3d8c6',light:'rgba(252,248,240,.55)',dark:'rgba(185,170,152,.3)',rocks:0.15,off:1.35,decor:['crack','crack','crack','bone']},
  mallee:{ground:'#bea06a',light:'rgba(214,190,130,.4)',dark:'rgba(120,110,60,.26)',rocks:0.5,off:0.85,decor:['bush','bush','bush','spinifex','tire']},
  ranges:{ground:'#a9673f',light:'rgba(196,128,84,.38)',dark:'rgba(100,50,25,.3)',rocks:2.1,off:0.85,decor:['spinifex','bone','mound']},
  coast:{ground:'#e0c38e',light:'rgba(244,222,170,.45)',dark:'rgba(170,140,90,.24)',rocks:0.35,off:0.95,decor:['grass','grass','grass','tire','bone']}};
const ZONE_NAMES={red:['The Red Heart','Burnt Sands','Dingo Desert','The Never Never'],salt:['Lake Despair','The Salt Pans','White Hell Flats'],
  mallee:['Mallee Scrub','The Mulga','Brigalow Country'],ranges:['Iron Ranges','The Broken Hills','Gibber Plateau'],coast:['Drowned Coast']};
const ZONES=[];
if(TEST_MODE)ZONES.push({x:-2500,y:-2500,biome:'red',name:'Test: Red Heart'},{x:2500,y:-2500,biome:'salt',name:'Test: Salt Pans'},
  {x:-2500,y:2500,biome:'mallee',name:'Test: Mallee'},{x:2500,y:2500,biome:'ranges',name:'Test: Ranges'},{x:0,y:0,biome:'coast',name:'Test: Coast',coast:true});
else (function(){const r=rng(4242),kinds=['red','ranges','salt','mallee','red','mallee','salt','ranges','red','mallee','red','ranges'],used={};
  for(let tries=0;ZONES.length<kinds.length&&tries<5000;tries++){const x=(r()*2-1)*WX,y=(r()*2-1)*WY;
    if(landValue(x,y)<0.12)continue;if(ZONES.some(z=>Math.hypot(z.x-x,z.y-y)<190000))continue;
    const b=kinds[ZONES.length];used[b]=(used[b]||0);const nm=ZONE_NAMES[b][used[b]%ZONE_NAMES[b].length];used[b]++;
    ZONES.push({x,y,biome:b,name:nm});}
  ZONES.push({x:0,y:0,biome:'coast',name:'Drowned Coast',coast:true});})();
function zoneAt(x,y){const lv=landValue(x,y);if(lv<0.045)return ZONES[ZONES.length-1];
  const ws=WX*0.11,wa=WX*0.16,wx=x+(fbm(nWarpX,x/ws,y/ws,3)-0.5)*wa,wy=y+(fbm(nWarpY,x/ws,y/ws,3)-0.5)*wa;
  let best=ZONES[0],bd=1e30;for(let i=0;i<ZONES.length-1;i++){const z=ZONES[i],d=(z.x-wx)**2+(z.y-wy)**2;if(d<bd){bd=d;best=z;}}return best;}
// ---- locations ----
const LOC_TYPES={city:{rad:TEST_MODE?900:2200,arrive:TEST_MODE?650:1800,service:true},   // the test range's island is too small for a full-size city
  outpost:{rad:480,arrive:360,service:true},ruin:{rad:380,arrive:420,service:false}};
const LOCS=[];
function buildTestLocs(){const add=(type,name,x,y,extra)=>LOCS.push(Object.assign({id:LOCS.length,type,name,x,y,links:[],...LOC_TYPES[type]},extra||{}));
  add('city','Test Town',-1600,-1200,{testYard:true});add('ruin','Test Ruins',2600,-2600);
  add('ruin','Test Raider Camp',2600,2400,{testCamp:true});add('outpost','Haven (test)',-2900,3000);}
if(TEST_MODE)buildTestLocs();else (function(){
  const r=rng(9001);
  const cityNames=['Gasworks City','Fort Brumby','Port Sorrow','Bulldust Bastion','Haven'];
  const outNames=['Saltpan','Bonefield','Gaspipe','Iron Mesa','Blackwater','Dingo Flat','Bitter Springs','Mulga Downs','Emu Crossing','Red Gum Well',
    'Dead Man’s Bore','Cockatoo Gate','Last Chance','Copper Creek','Sundown','Windmill Flat','Goanna Rock','Tin Can Bay','Ghost Gum','Hellfire Pass',
    'Quartz Hill','Rabbit Fence','Stockman’s Rest','Brumby Yards','Magpie Hollow','Lizard Lick','Shearer’s Hut','Dust Bowl','Black Stump','Tyre Town','Two Wells','Rust Hollow'];
  const ruinA=['Old','Burnt','Dead','Lost','Broken','Rusted','Empty','Silent','Hollow','Dry'];
  const ruinB=['Roadhouse','Mine','Siding','Homestead','Drive-In','Motel','Servo','Pub','Airstrip','Shearing Shed','Telegraph Station','Water Tower'];
  const ok=(x,y,minLand,minD,type)=>landValue(x,y)>=minLand&&LOCS.every(l=>Math.hypot(l.x-x,l.y-y)>=(type==='ruin'||l.type==='ruin'?Math.min(minD,60000):minD));
  const add=(type,name,x,y)=>LOCS.push({id:LOCS.length,type,name,x,y,links:[],...LOC_TYPES[type]});
  let ci=0;for(let t=0;t<20000&&ci<5;t++){const x=(r()*2-1)*WX,y=(r()*2-1)*WY;if(ok(x,y,0.14,330000,'city'))add('city',cityNames[ci++],x,y);}
  let oi=0;for(let t=0;t<40000&&oi<31;t++){const x=(r()*2-1)*WX,y=(r()*2-1)*WY;if(ok(x,y,0.08,118000,'outpost'))add('outpost',outNames[oi++],x,y);}
  let ri=0;for(let t=0;t<40000&&ri<48;t++){const x=(r()*2-1)*WX,y=(r()*2-1)*WY;if(ok(x,y,0.03,52000,'ruin')){
    let nm;for(let g=0;g<50;g++){nm=ruinA[Math.floor(r()*ruinA.length)]+' '+ruinB[Math.floor(r()*ruinB.length)];if(!LOCS.some(l=>l.name===nm))break;}
    add('ruin',nm,x,y);ri++;}}
})();
// ---- road network ----
const ROADCLS={highway:{w:130,max:1,acc:1,grip:1,drag:1,wear:0,label:'highway'},
  gravel:{w:108,max:0.86,acc:0.9,grip:0.85,drag:1.2,wear:0.12,label:'gravel road'},
  dirt:{w:80,max:0.74,acc:0.8,grip:0.8,drag:1.5,wear:0.3,label:'dirt track'}};
function landLine(a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/8000);
  for(let i=1;i<n;i++){const t=i/n;if(landValue(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)<0.02)return false;}return true;}
function genRoad(a,b,seed,cls,sc){sc=sc||1;
  const r=rng(seed),xs=[],ys=[],STEP=40;
  const P=cls==='highway'?{sMin:12000,sMax:30000,wMin:3000,wMax:8000,aMin:0.25,aMax:0.5,lMin:2400,lMax:4200,turn:0.06}
    :cls==='gravel'?{sMin:6000,sMax:20000,wMin:5000,wMax:14000,aMin:0.55,aMax:1.0,lMin:1600,lMax:3600,turn:0.085}
    :{sMin:2000,sMax:7000,wMin:5000,wMax:12000,aMin:0.8,aMax:1.25,lMin:1100,lMax:2400,turn:0.11};
  for(const k of ['sMin','sMax','wMin','wMax'])P[k]*=sc;const approach=6000*sc;
  let x=a.x,y=a.y,h=Math.atan2(b.y-y,b.x-x),mode='winding',left=0,phase=0,amp=0,wl=2000,off=0,guard=0;
  xs.push(x);ys.push(y);
  while(guard++<200000){
    const dx=b.x-x,dy=b.y-y,dist=Math.hypot(dx,dy);
    if(dist<STEP*1.5){xs.push(b.x);ys.push(b.y);break;}
    const bear=Math.atan2(dy,dx);
    if(left<=0){mode=mode==='straight'?'winding':'straight';
      if(mode==='straight'){left=P.sMin+r()*(P.sMax-P.sMin);off=(r()-0.5)*0.3;}
      else{left=P.wMin+r()*(P.wMax-P.wMin);amp=P.aMin+r()*(P.aMax-P.aMin);wl=P.lMin+r()*(P.lMax-P.lMin);phase=0;}}
    let want,maxTurn;
    if(dist<approach){want=bear;maxTurn=0.12;}
    else if(mode==='straight'){want=bear+off;maxTurn=0.02;}
    else{phase+=STEP/wl*TAU;want=bear+amp*Math.sin(phase);maxTurn=P.turn;}
    h+=clamp(angDiff(want,h),-maxTurn,maxTurn);
    x+=Math.cos(h)*STEP;y+=Math.sin(h)*STEP;xs.push(x);ys.push(y);left-=STEP;
  }
  const n=xs.length,X=new Float32Array(xs),Y=new Float32Array(ys),cum=new Float32Array(n);
  for(let i=1;i<n;i++)cum[i]=cum[i-1]+Math.hypot(X[i]-X[i-1],Y[i]-Y[i-1]);
  const sx=[],sy=[];for(let i=0;i<n;i+=20){sx.push(X[i]);sy.push(Y[i]);}sx.push(X[n-1]);sy.push(Y[n-1]);
  return {a:a.id,b:b.id,cls,w:ROADCLS[cls].w,xs:X,ys:Y,cum,n,len:cum[n-1],sx,sy};
}
const roads=[];
function buildTestRoads(){const link=(a,b,cls)=>{roads.push(genRoad(LOCS[a],LOCS[b],900+roads.length*77,cls,0.2));const ri=roads.length-1;
    LOCS[a].links.push({to:b,road:ri,dir:1});LOCS[b].links.push({to:a,road:ri,dir:-1});};
  link(0,3,'highway');link(0,2,'gravel');link(0,1,'dirt');link(1,2,'dirt');}
if(TEST_MODE)buildTestRoads();else (function(){
  const nodes=LOCS.filter(l=>l.type!=='ruin'),E=[];
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);
    if(d>260000)continue;
    if(nodes.some(k=>k!==a&&k!==b&&Math.max(Math.hypot(a.x-k.x,a.y-k.y),Math.hypot(b.x-k.x,b.y-k.y))<d))continue; // relative neighbourhood graph
    if(!landLine(a,b))continue;E.push({a,b,d});}
  E.sort((p,q)=>p.d-q.d);
  const par=new Map();const find=x=>{while(par.get(x)!==x){par.set(x,par.get(par.get(x)));x=par.get(x);}return x;};
  nodes.forEach(n=>par.set(n.id,n.id));
  const keep=[];for(const e of E){const ra=find(e.a.id),rb=find(e.b.id);if(ra!==rb){par.set(ra,rb);e.mst=true;}if(e.mst||e.d<=215000)keep.push(e);}
  // highways: the shortest routes between cities over the kept edges
  const adj=new Map();nodes.forEach(n=>adj.set(n.id,[]));keep.forEach((e,i)=>{adj.get(e.a.id).push([e.b.id,e.d,i]);adj.get(e.b.id).push([e.a.id,e.d,i]);});
  const cities=nodes.filter(n=>n.type==='city');
  const dij=(s)=>{const dist=new Map([[s,0]]),prev=new Map(),done=new Set();
    for(;;){let u=-1,bd=Infinity;for(const [k,v] of dist)if(!done.has(k)&&v<bd){bd=v;u=k;}if(u<0)break;done.add(u);
      for(const [v,w,ei] of adj.get(u)){const nd=bd+w;if(nd<(dist.has(v)?dist.get(v):Infinity)){dist.set(v,nd);prev.set(v,[u,ei]);}}}return prev;};
  for(let i=0;i<cities.length;i++){const prev=dij(cities[i].id);
    for(let j=i+1;j<cities.length;j++){let v=cities[j].id;while(prev.has(v)){const [u,ei]=prev.get(v);keep[ei].hw=true;v=u;}}}
  keep.forEach((e,i)=>roads.push(genRoad(e.a,e.b,1000+i*7919,e.hw?'highway':'gravel')));
  // ruins hang off the network on dirt tracks (some are off the map entirely)
  const rr2=rng(31337);
  for(const ru of LOCS.filter(l=>l.type==='ruin')){if(rr2()<0.25)continue;
    let best=null,bd=170000;for(const l of LOCS){if(l===ru)continue;const d=Math.hypot(l.x-ru.x,l.y-ru.y);if(d<bd&&landLine(ru,l)&&(l.type!=='ruin'||l.links.length)){bd=d;best=l;}}
    if(best){const R=genRoad(best,ru,50000+ru.id*131,'dirt');roads.push(R);best.links.push({to:ru.id,road:roads.length-1,dir:1});ru.links.push({to:best.id,road:roads.length-1,dir:-1});}}
  roads.forEach((R,ri)=>{if(R.cls==='dirt')return;LOCS[R.a].links.push({to:R.b,road:ri,dir:1});LOCS[R.b].links.push({to:R.a,road:ri,dir:-1});});
})();
const START=TEST_MODE?0:(function(){const outs=LOCS.filter(l=>l.type==='outpost'&&l.links.length>=2);let s=outs[0];for(const o of outs)if(o.x<s.x)s=o;
  const ri=LOCS.findIndex(l=>l.name==='Rust Hollow');if(ri>=0&&LOCS[ri]!==s)LOCS[ri].name=s.name;s.name='Rust Hollow';return s.id;})();
// Haven: the reachable city farthest from the start
if(TEST_MODE)LOCS[3].goal=true;else (function(){const dist=routeDistances(START);let best=null,bd=-1;
  for(const l of LOCS)if(l.type==='city'&&dist.has(l.id)&&dist.get(l.id)>bd){bd=dist.get(l.id);best=l;}
  const hv=LOCS.find(l=>l.name==='Haven');if(best&&hv&&best!==hv){hv.name=best.name;}if(best){best.name='Haven';best.goal=true;}})();
function routeDistances(s){const dist=new Map([[s,0]]),done=new Set();
  for(;;){let u=-1,bd=Infinity;for(const [k,v] of dist)if(!done.has(k)&&v<bd){bd=v;u=k;}if(u<0)break;done.add(u);
    for(const l of LOCS[u].links){const nd=bd+roads[l.road].len;if(nd<(dist.has(l.to)?dist.get(l.to):Infinity))dist.set(l.to,nd);}}return dist;}
function routePath(s,t){const dist=new Map([[s,0]]),prev=new Map(),done=new Set();
  for(;;){let u=-1,bd=Infinity;for(const [k,v] of dist)if(!done.has(k)&&v<bd){bd=v;u=k;}if(u<0||u===t)break;done.add(u);
    for(const l of LOCS[u].links){const nd=bd+roads[l.road].len;if(nd<(dist.has(l.to)?dist.get(l.to):Infinity)){dist.set(l.to,nd);prev.set(l.to,[u,l]);}}}
  if(s!==t&&!prev.has(t))return null;const legs=[];let v=t;while(v!==s){const [u,l]=prev.get(v);legs.unshift({from:u,to:v,road:l.road,dir:l.dir});v=u;}
  return {legs,len:dist.get(t)};}
// spatial grid of road segments
const grid=new Map();
const gkey=(cx,cy)=>(cx+4096)*8192+(cy+4096);
function gadd(k,ri,i){let a=grid.get(k);if(!a){a=[];grid.set(k,a);}a.push(ri,i);}
roads.forEach((R,ri)=>{for(let i=0;i<R.n-1;i++){const k1=gkey(Math.floor(R.xs[i]/CELL),Math.floor(R.ys[i]/CELL)),k2=gkey(Math.floor(R.xs[i+1]/CELL),Math.floor(R.ys[i+1]/CELL));
  gadd(k1,ri,i);if(k2!==k1)gadd(k2,ri,i);}});
const NOROAD={d:1e9,r:-1,i:0,t:0,tx:1,ty:0,px:0,py:0,w:0};
function roadInfo(x,y){
  const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL);let bd=1e18,br=-1,bi=0,bt=0;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const arr=grid.get(gkey(cx+i,cy+j));if(!arr)continue;
    for(let k=0;k<arr.length;k+=2){const R=roads[arr[k]],s=arr[k+1];
      const ax=R.xs[s],ay=R.ys[s],ex=R.xs[s+1]-ax,ey=R.ys[s+1]-ay,l2=ex*ex+ey*ey||1;
      const t=clamp(((x-ax)*ex+(y-ay)*ey)/l2,0,1),qx=ax+ex*t-x,qy=ay+ey*t-y,d2=qx*qx+qy*qy;
      // prefer the wider road where two overlap
      const score=d2-(R.w*R.w)*0.001;
      if(score<bd){bd=score;br=arr[k];bi=s;bt=t;}}}
  if(br<0)return NOROAD;
  const R=roads[br],ex=R.xs[bi+1]-R.xs[bi],ey=R.ys[bi+1]-R.ys[bi],l=Math.hypot(ex,ey)||1,px=R.xs[bi]+ex*bt,py=R.ys[bi]+ey*bt;
  return {d:Math.hypot(px-x,py-y),r:br,i:bi,t:bt,tx:ex/l,ty:ey/l,px,py,w:R.w};
}
function nearLoc(x,y,extra,filter){for(const l of LOCS){if(filter&&!filter(l))continue;if(Math.hypot(x-l.x,y-l.y)<l.rad+(extra||0))return l;}return null;}
function nearService(x,y){return nearLoc(x,y,-10,l=>l.service);}
// ---- location layouts: buildings on a ring, doors facing the square ----
const PARK_TYPES=['kingsford','kingsford','wagon','ute','ute','van','cruiser','bike'];
const BKINDS={house:{w:110,h:84,door:34},shed:{w:92,h:72,door:40},pub:{w:176,h:112,door:40},garage:{w:156,h:112,door:72},
  clinic:{w:140,h:100,door:36},servo:{w:150,h:92,door:44},store:{w:130,h:96,door:38},
  warehouse:{w:270,h:170,door:96},barn:{w:210,h:140,door:76},office:{w:120,h:90,door:34}};
// solid structures you can't go inside: tanks, towers, the refinery's columns and flare (size = diameter)
const STRUCTS={oiltank:130,column:44,flare:28,watertower:74,raintank:52,windmill:36};
function makeStruct(kind,x,y,rot,size){const d=size||STRUCTS[kind];return {kind,x,y,rot:rot||0,w:d,h:d,tank:true,struct:true,furn:[],roofA:1};}
const NPC_NAMES=['Bazza','Shazza','Kev','Davo','Mick','Trev','Dot','Merv','Gwen','Col','Nev','Robbo','Jacko','Bev','Faye','Darryl','Lorraine','Wal','Norm','Rhonda',
  'Gaz','Deb','Reg','Joyce','Stumpy','Lenny','Marj','Snow','Bluey','Tex','Ronnie','Glenys','Spud','Yvonne','Clarrie','Dulcie'];
function makeBuilding(o,kind,x,y,rot,r){const K=BKINDS[kind],b={kind,x,y,rot,w:K.w,h:K.h,door:K.door,ruined:o.type==='ruin',furn:[],tank:false,roofA:1};
  const hw=b.w/2,hh=b.h/2,f=b.furn;
  // furniture in local coordinates (+y is the front wall with the door)
  if(kind==='house'){f.push({k:'bed',x:-hw+22,y:-hh+30,w:26,h:44},{k:'table',x:hw-30,y:0,r:12},{k:'shelf',x:0,y:-hh+8,w:40,h:10});}
  else if(kind==='pub'){f.push({k:'bar',x:0,y:-hh+22,w:b.w-50,h:16});for(let i=0;i<3;i++)f.push({k:'table',x:-hw+36+i*52,y:16,r:13});f.push({k:'shelf',x:0,y:-hh+7,w:b.w-60,h:8});}
  else if(kind==='garage'){f.push({k:'hoist',x:-20,y:-6,w:36,h:64},{k:'bench',x:hw-22,y:-10,w:20,h:60},{k:'drum',x:-hw+18,y:-hh+18,r:9},{k:'drum',x:-hw+18,y:-hh+40,r:9});}
  else if(kind==='clinic'){f.push({k:'bed',x:-hw+24,y:-hh+30,w:26,h:44},{k:'bed',x:-hw+62,y:-hh+30,w:26,h:44},{k:'shelf',x:hw-20,y:-10,w:12,h:50});}
  else if(kind==='store'){for(let i=0;i<3;i++)f.push({k:'shelf',x:-hw+26+i*38,y:-10,w:12,h:52});f.push({k:'bar',x:hw-28,y:10,w:16,h:40});}
  else if(kind==='warehouse'){for(let i=0;i<4;i++)for(let j=0;j<2;j++)f.push({k:'crate',x:-hw+40+i*58,y:-hh+34+j*40,w:30,h:28});f.push({k:'drum',x:hw-26,y:hh-30,r:10},{k:'drum',x:hw-50,y:hh-30,r:10});}
  else if(kind==='barn'){for(let i=0;i<3;i++)f.push({k:'bale',x:-hw+34+i*36,y:-hh+30,w:30,h:22});f.push({k:'bench',x:hw-30,y:-10,w:20,h:50},{k:'drum',x:hw-26,y:hh-26,r:9});}
  else if(kind==='office'){f.push({k:'bench',x:-hw+30,y:-hh+20,w:40,h:18},{k:'shelf',x:hw-14,y:-6,w:10,h:44},{k:'table',x:10,y:8,r:12});}
  else{f.push({k:'drum',x:-hw+18,y:-hh+18,r:9},{k:'shelf',x:hw-14,y:-4,w:10,h:44},{k:'bench',x:0,y:-hh+14,w:44,h:14});}
  if(b.ruined)for(let i=0;i<5;i++)f.push({k:'rubble',x:(r()-0.5)*b.w*0.8,y:(r()-0.5)*b.h*0.8,r:5+r()*9});
  // world positions of the door, just outside and just inside, for people walking in and out
  const c=Math.cos(rot),s=Math.sin(rot),L=(lx,ly)=>({x:x+lx*c-ly*s,y:y+lx*s+ly*c});
  b.doorOut=L(0,hh+22);b.doorIn=L(0,hh-20);b.L=L;
  return b;}
// ---- a city: a grid of streets around a central square, blocks of houses, shops, warehouses and water storage,
// and an outer ring of farms (and, in Fuel Kings cities, an oil refinery) inside the wall ----
const BLOCK=420,STREET=60;
function layoutCity(o,r,fits){const th=o.exits.length?o.exits[0]:0,c=Math.cos(th),s=Math.sin(th),W2=(u,v)=>({x:o.x+u*c-v*s,y:o.y+u*s+v*c});
  const GR=Math.max(o.rad-700,o.rad*0.62),BK=Math.min(BLOCK,GR*0.55),n=Math.ceil(GR/BK),wallR=o.rad-40;
  o.grid={th,BK,GR};   // townsfolk use this to walk along the streets
  // door facing: local +y of a building points along world direction (dx,dy)
  const faceRot=(dx,dy)=>Math.atan2(-dx,dy),vDir=sg=>({x:-s*sg,y:c*sg}),uDir=sg=>({x:c*sg,y:s*sg});
  const put=(kind,u,v,dir)=>{const p=W2(u,v),K=BKINDS[kind];if(!fits(p.x,p.y,K))return null;const b=makeBuilding(o,kind,p.x,p.y,faceRot(dir.x,dir.y),r);o.bld.push(b);return b;};
  const putS=(kind,u,v,size)=>{const p=W2(u,v),d=size||STRUCTS[kind];if(!fits(p.x,p.y,{w:d,h:d}))return null;const b=makeStruct(kind,p.x,p.y,th,d);o.bld.push(b);return b;};
  for(let k=-n;k<=n;k++){const u=k*BK;if(Math.abs(u)>=GR)continue;const half=Math.sqrt(GR*GR-u*u);
    for(const [a,b] of [[W2(u,-half),W2(u,half)],[W2(-half,u),W2(half,u)]])o.streets.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y,w:STREET});}
  const blocks=[];for(let i=-n;i<n;i++)for(let j=-n;j<n;j++){const u=(i+0.5)*BK,v=(j+0.5)*BK,d=Math.hypot(u,v);if(d+BK*0.7<GR)blocks.push({u,v,d});}
  blocks.sort((p,q)=>p.d-q.d);
  const L=BK/2-STREET/2-6;   // usable half-width of a block
  // 1. the square, in the centre block
  const sq=blocks.shift();if(sq)o.square={x:W2(sq.u,sq.v).x,y:W2(sq.u,sq.v).y,rot:th,size:BK-STREET};
  // 2. services around the square: pub, garage, clinic, store (and a second store for the trader)
  const svc=['pub','garage','clinic','store'];
  for(const bk of blocks.splice(0,2)){for(const sg of [-1,1]){const k=svc.shift();if(k)put(k,bk.u,bk.v+sg*L*0.5,vDir(sg));}}
  // 3. the rest: mostly houses, with warehouse blocks and water storage blocks scattered through
  let wh=0,water=0;blocks.forEach((bk,idx)=>{const roll=r();
    if((water<2&&idx>2&&roll<0.1)||(water===0&&idx===6)){water++;putS('watertower',bk.u-L*0.45,bk.v);for(let t=0;t<3;t++)putS('raintank',bk.u+L*0.35,bk.v-L*0.6+t*L*0.6);return;}
    if(wh<5&&idx>1&&roll<0.32){wh++;const b=put('warehouse',bk.u,bk.v-L*0.2,vDir(1));if(b&&r()<0.5)put('office',bk.u+L*0.55,bk.v+L*0.62,vDir(1));return;}
    for(const [du,dv] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=r();if(x<0.12)continue;put(x<0.24?'shed':'house',bk.u+du*L*0.5,bk.v+dv*L*0.52,vDir(dv));}});
  // 4. the outer ring: farms, and a refinery in Fuel Kings country
  const ringR=(GR+wallR)/2,taken=[];const clearArc=(a,half)=>o.exits.every(e=>Math.abs(angDiff(e,a))>half+0.22)&&taken.every(t=>Math.abs(angDiff(t,a))>half+0.25);
  o.ringR=ringR;o.ringTaken=taken;o.clearArc=clearArc;
  const farms=2+Math.floor(r()*2);for(let f=0,t=0;f<farms&&t<60;t++){const a=r()*TAU;if(!clearArc(a,0.24))continue;taken.push(a);f++;layoutFarm(o,a,ringR,r,fits);}
  // never leave a town without its pub, garage, clinic or store: if a road took the planned spot, find room anywhere
  for(const k of ['pub','garage','clinic','store'])if(!o.bld.some(b=>b.kind===k))for(let t=0;t<400;t++){const a=r()*TAU,d=200+r()*(GR-150),x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d;
    if(fits(x,y,BKINDS[k])){o.bld.push(makeBuilding(o,k,x,y,a+Math.PI/2,r));break;}}}
function layoutFarm(o,a,R,r,fits){const cx=o.x+Math.cos(a)*R,cy=o.y+Math.sin(a)*R,rot=a+Math.PI/2,c=Math.cos(rot),s=Math.sin(rot),P=(u,v)=>({x:cx+u*c-v*s,y:cy+u*s+v*c});
  // a fenced paddock with crop rows (or bare, ploughed dirt), and the farm buildings beside it
  const pw=280+r()*120,ph=170+r()*60,pp=P(-60,10);if(!fits(pp.x,pp.y,{w:pw*0.8,h:ph*0.8}))return;
  o.paddocks.push({x:pp.x,y:pp.y,w:pw,h:ph,rot,crop:r()<0.6?'wheat':'ploughed'});
  const toward=(px,py)=>Math.atan2(-(o.x-px),(o.y-py));   // doors face the town
  const fh=P(pw/2+40,-ph/2+40);if(fits(fh.x,fh.y,BKINDS.house))o.bld.push(makeBuilding(o,'house',fh.x,fh.y,toward(fh.x,fh.y),r));
  const bn=P(pw/2+150,ph/2+10);if(fits(bn.x,bn.y,BKINDS.barn))o.bld.push(makeBuilding(o,'barn',bn.x,bn.y,toward(bn.x,bn.y),r));
  const wm=P(-pw/2-50,-ph/2+20);if(fits(wm.x,wm.y,{w:40,h:40}))o.bld.push(makeStruct('windmill',wm.x,wm.y,rot));
  const rt=P(-pw/2-50,-ph/2+80);if(fits(rt.x,rt.y,{w:56,h:56}))o.bld.push(makeStruct('raintank',rt.x,rt.y,rot));}
function layoutRefinery(o,a,R,r,fits){const cx=o.x+Math.cos(a)*R,cy=o.y+Math.sin(a)*R,rot=a+Math.PI/2,c=Math.cos(rot),s=Math.sin(rot),P=(u,v)=>({x:cx+u*c-v*s,y:cy+u*s+v*c});
  const parts=[];const add=b=>{if(b){o.bld.push(b);parts.push(b);}return b;};
  // storage tanks in two rows, distillation columns and a flare stack between them, a control office
  for(let i=0;i<3;i++)for(let j=0;j<2;j++){const p=P(-260+i*175,-90+j*180),d=110+r()*30;if(fits(p.x,p.y,{w:d,h:d}))add(makeStruct('oiltank',p.x,p.y,rot,d));}
  for(let i=0;i<2;i++){const p=P(310,-60+i*70);if(fits(p.x,p.y,{w:48,h:48}))add(makeStruct('column',p.x,p.y,rot));}
  const fl=P(390,120);if(fits(fl.x,fl.y,{w:30,h:30}))add(makeStruct('flare',fl.x,fl.y,rot));
  const of=P(380,-170);if(fits(of.x,of.y,BKINDS.office))add(makeBuilding(o,'office',of.x,of.y,rot+Math.PI,r));
  // pipework joining the tanks to the columns
  const cols=parts.filter(b=>b.kind==='column');for(const t of parts.filter(b=>b.kind==='oiltank')){const to=cols[0]||t;o.pipes.push([{x:t.x,y:t.y},P(230,0),{x:to.x,y:to.y}]);}
  if(cols.length&&o.bld.some(b=>b.kind==='flare')){const f=o.bld.find(b=>b.kind==='flare');o.pipes.push([{x:cols[0].x,y:cols[0].y},{x:f.x,y:f.y}]);}
  o.refinery={x:cx,y:cy};}
// local coordinates of a world point inside building b
function bLocal(b,x,y){const c=Math.cos(b.rot),s=Math.sin(b.rot),dx=x-b.x,dy=y-b.y;return [dx*c+dy*s,-dx*s+dy*c];}
function bInside(b,x,y,m){const [lx,ly]=bLocal(b,x,y);return Math.abs(lx)<b.w/2-(m||0)&&Math.abs(ly)<b.h/2-(m||0);}
LOCS.forEach(o=>{
  const wallR=o.rad-40;
  // where each road crosses the wall line: walk out along the road from the town's end until we reach it
  o.exits=o.links.map(l=>{const R=roads[l.road];let i=l.dir>0?0:R.n-1;
    while(i+l.dir>=0&&i+l.dir<R.n&&Math.hypot(R.xs[i]-o.x,R.ys[i]-o.y)<wallR)i+=l.dir;return Math.atan2(R.ys[i]-o.y,R.xs[i]-o.x);});
  const r=rng(hash2(o.id+77,o.id*13+5));o.bld=[];o.wall=[];o.carSpawns=[];o.boxes=[];o.npcs=[];
  // gates: one wherever a road comes in, plus extra gates so no stretch of wall is longer than about 100 degrees
  o.gates=o.exits.map(a=>({a,half:95/wallR}));
  if(o.type!=='ruin'){
    if(!o.gates.length)o.gates.push({a:r()*TAU,half:80/wallR});
    for(let guard=0;guard<12;guard++){const as=o.gates.map(g=>g.a).sort((p,q)=>angDiff(p,0)-angDiff(q,0)).map(a=>(a+TAU)%TAU).sort((p,q)=>p-q);
      let gap=0,at=0;for(let i=0;i<as.length;i++){const nx=i+1<as.length?as[i+1]:as[0]+TAU,g=nx-as[i];if(g>gap){gap=g;at=as[i]+g/2;}}
      if(gap<=1.75)break;o.gates.push({a:at,half:80/wallR,side:true});}
    const segs=Math.round(wallR*TAU/52);
    for(let k=0;k<segs;k++){const a=k/segs*TAU;if(o.gates.every(g=>Math.abs(angDiff(a,g.a))>g.half))o.wall.push({a,c:['#6b4a32','#7d5a3c','#4e3a2c','#5f4b3b'][Math.floor(r()*4)],j:r()*6-3});}}
  o.streets=[];o.paddocks=[];o.pipes=[];o.square=null;
  o.fits=null;
  const kinds=o.type==='city'?[]   // cities are laid out on a street grid instead (below)
    :o.type==='outpost'?['pub','garage','house','house','shed','house']:['servo','house','shed','house','store'].slice(0,3+Math.floor(r()*3));
  const inner=o.type==='city'?280:180,outer=o.type==='city'?720:330;
  const fits=(x,y,K)=>{const diag=Math.hypot(K.w,K.h)/2,ri=roadInfo(x,y);
    if(ri.r>=0&&ri.d<ri.w/2+diag+12)return false;
    return o.bld.every(q=>Math.hypot(q.x-x,q.y-y)>(diag+Math.hypot(q.w,q.h)/2)*0.92);};
  for(const kind of kinds){const K=BKINDS[kind];
    for(let t=0;t<120;t++){const a=r()*TAU,d=inner+r()*(outer-inner),x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d;
      if(fits(x,y,K)){const b=makeBuilding(o,kind,x,y,a+Math.PI/2,r);o.bld.push(b);break;}}}
  o.fits=fits;if(o.type==='city')layoutCity(o,r,fits);
  // every outpost has a water tower
  if(o.type==='outpost')for(let t=0;t<60;t++){const a=r()*TAU,d=inner+r()*(outer-inner)+40,x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d;if(fits(x,y,{w:90,h:90})){o.bld.push(makeStruct('watertower',x,y,a));break;}}
  // the garage's fuel tank sits beside it
  const gar=o.bld.find(b=>b.kind==='garage');if(gar){const p=gar.L(gar.w/2+36,0);o.bld.push({kind:'tank',x:p.x,y:p.y,rot:gar.rot,w:60,h:60,tank:true,furn:[]});}
  const rc=rng(hash2(o.id*31+9,o.id+101)),ncar=o.type==='city'?10:o.type==='outpost'?3:1;
  for(let k=0;k<300&&o.carSpawns.length<ncar;k++){
    const a=rc()*TAU,d=(o.type==='city'?240:120)+rc()*(o.type==='city'?1300:200),x=o.x+Math.cos(a)*d,y=o.y+Math.sin(a)*d,type=PARK_TYPES[Math.floor(rc()*PARK_TYPES.length)],
      fuel=o.type==='ruin'?rc()*10:10+rc()*40,   // nobody leaves more than half a tank in a parked car
      cond=o.type==='ruin'?15+rc()*30:50+rc()*40,ca=rc()*TAU;
    if(o.bld.some(b=>Math.hypot(b.x-x,b.y-y)<Math.hypot(b.w,b.h)/2+40)||o.carSpawns.some(s=>Math.hypot(s.x-x,s.y-y)<100)||o.paddocks.some(p=>Math.hypot(p.x-x,p.y-y)<Math.hypot(p.w,p.h)/2+30))continue;
    const ri=roadInfo(x,y);if(ri.r>=0&&ri.d<ri.w/2+30)continue;
    o.carSpawns.push({id:'o'+o.id+'_'+k,type,x,y,a:ca,fuel,cond});}
  if(o.type==='ruin'){const bio=zoneAt(o.x,o.y).biome;let k=0;
    // crates and lockers, mostly indoors
    for(const b of o.bld){if(b.tank)continue;const n=1+Math.floor(rc()*2);for(let i=0;i<n;i++){const p=b.L((rc()-0.5)*(b.w-40),(rc()-0.5)*(b.h-40)),kind=rc()<0.55?'crate':'locker';
      o.boxes.push({id:'b'+o.id+'_'+(k++),kind,x:p.x,y:p.y,table:'ruin',rolls:kind==='locker'?3:2,seed:o.id*100+k,biome:bio,persist:true});}}
    if(rc()<0.35)o.npcs.push({id:'n'+o.id+'_0',name:NPC_NAMES[Math.floor(rc()*NPC_NAMES.length)],role:'scavenger',home:o.bld.findIndex(b=>!b.tank),seed:o.id*7+1});}
  else{ // townsfolk
    const roles=o.type==='city'?['publican','mechanic','doctor','guard','guard','guard','guard','settler','settler','settler','settler','settler','settler','settler','settler','settler','settler','trader']:['publican','mechanic','guard','settler','settler','settler'];
    const used=new Set();const houses=o.bld.map((b,i)=>i).filter(i=>['house','shed'].includes(o.bld[i].kind));
    roles.forEach((role,k)=>{let nm;do{nm=NPC_NAMES[Math.floor(rc()*NPC_NAMES.length)];}while(used.has(nm)&&used.size<NPC_NAMES.length);used.add(nm);
      const workKind={publican:'pub',mechanic:'garage',doctor:'clinic',trader:'store'}[role];
      const work=workKind?o.bld.findIndex(b=>b.kind===workKind):-1,home=houses.length?houses[k%houses.length]:work;
      o.npcs.push({id:'n'+o.id+'_'+k,name:nm,role,work,home,seed:o.id*31+k*7});});
    if(o.id===START){const spare=NPC_NAMES.filter(n=>n!=='Dot'&&n!=='Col'&&!o.npcs.some(p=>p.name===n));let si=0;
      for(const p of o.npcs)if(p.name==='Dot'||p.name==='Col')p.name=spare[si++];
      const dot=o.npcs.find(n=>n.role==='settler');if(dot)dot.name='Dot';}}
});
// ---- test range extras: a car yard with every vehicle, supply crates with every item, a hidden stash ----
if(TEST_MODE){const town=LOCS[0],ruins=LOCS[1],camp=LOCS[2];camp.carSpawns=[];
  const types=['kestrel','kingsford','wagon','ute','van','cruiser','bike','buggy','brute'];
  // find a clear strip just outside the town wall for the car yard
  const clearAt=(x,y)=>{const ri=roadInfo(x,y);return landValue(x,y)>0.1&&!(ri.r>=0&&ri.d<ri.w/2+60);};
  let yard=null;for(const [dx,dy] of [[0,1],[0,-1],[-1,0],[1,0]]){const cx=town.x+dx*(town.rad+160),cy=town.y+dy*(town.rad+160),px=-dy,py=dx;
    const spots=types.map((t,i)=>({x:cx+px*(i-4)*95,y:cy+py*(i-4)*95}));if(spots.every(p=>clearAt(p.x,p.y))){yard={spots,a:Math.atan2(-dy,-dx)};break;}}
  if(yard){town.carSpawns=types.map((t,i)=>({id:'ty_'+t,type:t,x:yard.spots[i].x,y:yard.spots[i].y,a:yard.a+Math.PI,fuel:100,cond:100}));   // side by side, noses pointing away from the wall
    const s0=yard.spots[0],s8=yard.spots[8],ox=(s0.x-s8.x)/Math.hypot(s0.x-s8.x,s0.y-s8.y),oy=(s0.y-s8.y)/Math.hypot(s0.x-s8.x,s0.y-s8.y);
    const crate=(id,kind,k,items)=>town.boxes.push({id,kind,x:s0.x+ox*(90+k*55),y:s0.y+oy*(90+k*55),items,persist:false});
    crate('tb_arms','locker',0,{tyreiron:1,bat:1,machete:1,revolver:1,shotgun:1,rifle:1,bullets:30,shells:20,rounds:15});
    crate('tb_supplies','crate',1,{water:6,beans:4,jerky:4,bandage:4,medkit:2});
    crate('tb_spares','crate',2,{jerrycan:2,hose:1,scrap:6,tyre:2,tyre_worn:1,parts:2,parts_used:1,springs:2,springs_used:1,toolkit:1});
    crate('tb_trade','crate',3,{cloth:6,wire:6,powder:4,durries:6,watch:2,pipeclub:1,spikedbat:1,scrap:12,snakemeat:1,rabbitmeat:1,dingomeat:1,roomeat:1});
    crate('tb_kits','locker',4,{kit_roobar:1,kit_longtank:1,kit_offroad:1,kit_heavysusp:1,kit_blower:1,kit_armour:1,kit_spikes:1});}
  ruins.boxes.push({id:'ts_stash',kind:'esky',x:3900,y:-700,table:'stash',rolls:3,seed:99,biome:'salt',persist:true});
  if(!ruins.carSpawns.length)ruins.carSpawns.push({id:'o1_9',type:'ute',x:ruins.x+150,y:ruins.y+260,a:1,fuel:5,cond:30});}
// ---- raider camps: some ruins are held by raiders on foot ----
(function(){const s=LOCS[START];let safe=null,bd=1e18;
  for(const l of LOCS)if(l.type==='ruin'&&l.carSpawns.length){const d=Math.hypot(l.x-s.x,l.y-s.y);if(d<bd){bd=d;safe=l;}}
  const r=rng(777123);
  for(const l of LOCS){if(l.type!=='ruin'){r();continue;}const roll=r(),far=Math.hypot(l.x-s.x,l.y-s.y);
    if(TEST_MODE?!l.testCamp:(l===safe||far<90000||roll>0.32))continue;
    l.camp=true;l.npcs=[];const n=TEST_MODE?4:2+Math.floor(r()*3),tier=Math.min(1,far/700000);   // camps further from the start carry better guns
    const melee=['knife','knife','bat','tyreiron','machete'],guns=['revolver','revolver','shotgun','rifle'];
    l.foes=[];for(let k=0;k<n;k++){const gun=r()<0.15+tier*0.45,weapon=TEST_MODE?['knife','bat','revolver','shotgun'][k]:(gun?guns[Math.floor(r()*(tier>0.5?4:2))]:melee[Math.floor(r()*melee.length)]);
      const b=l.bld[Math.floor(r()*l.bld.length)],a=r()*TAU,post=b&&b.doorOut?{x:b.doorOut.x+Math.cos(a)*20,y:b.doorOut.y+Math.sin(a)*20}:{x:l.x+Math.cos(a)*120,y:l.y+Math.sin(a)*120};
      const pa=r()*TAU,patrol=[post,{x:l.x+Math.cos(pa)*(120+r()*150),y:l.y+Math.sin(pa)*(120+r()*150)}];
      l.foes.push({id:'f'+l.id+'_'+k,weapon,post,patrol,seed:l.id*17+k,brave:r()<0.35});}
    for(const bx of l.boxes){bx.table='camp';bx.rolls+=1;}
    // a campfire in the open, clear of the buildings and the track
    for(let t=0;t<40;t++){const a=r()*TAU,d=40+r()*140,x=l.x+Math.cos(a)*d,y=l.y+Math.sin(a)*d,ri=roadInfo(x,y);
      if(l.bld.every(b=>!bInside(b,x,y,-30))&&!(ri.r>=0&&ri.d<ri.w/2+30)){l.fire={x,y};break;}}}
})();
// ---- terrain chunks ----
const CH=640,WCELL=32,WN=CH/WCELL,chunks=new Map();
function getChunk(cx,cy){
  const k=cx+','+cy;let c=chunks.get(k);if(c)return c;
  const r=rng(hash2(cx,cy));const ox=cx*CH,oy=cy*CH;
  const lv=landValue(ox+CH/2,oy+CH/2),z=zoneAt(ox+CH/2,oy+CH/2),B=BIOMES[z.biome];
  c={cx,cy,zone:z,biome:B,cells:[],water:null,rocks:[],wrecks:[],decor:[],patches:[],ripples:[],drifts:[],carSpawns:[],boxes:[]};
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)c.cells.push(BIOMES[zoneAt(ox+(i+0.5)*160,oy+(j+0.5)*160).biome].ground);
  buildTerrain(c);
  // somewhere to put things: plain open ground (not rock, water, riverbed, cutting or bridge)
  const land=(x,y)=>x>=ox&&y>=oy&&x<ox+CH&&y<oy+CH&&cellType(c,x,y)===T.GROUND&&!insideMesa(x,y,50)&&!inShellWall(x,y,40);
  // the debris pile in an outback ruin, if it has one
  for(const s of shellsNear(ox+CH/2,oy+CH/2,CH))if(s.box&&s.box.x>=ox&&s.box.y>=oy&&s.box.x<ox+CH&&s.box.y<oy+CH)c.boxes.push(Object.assign({},s.box));
  // scree: boulders fallen from the cliffs lie round the foot of every mesa and butte
  for(const m of mesasNear(ox+CH/2,oy+CH/2,CH)){const n=m.butte?7:16;const rm=rng(m.seed);for(let k=0;k<n;k++){const a=rm()*TAU,d=mesaR(m,a)+16+rm()*60,x=m.x+Math.cos(a)*d,y=m.y+Math.sin(a)*d,rad=8+rm()*18;
    if(x<ox||y<oy||x>=ox+CH||y>=oy+CH)continue;const pts=[];for(let j=0;j<8;j++)pts.push(0.78+rm()*0.32);if(roadInfo(x,y).d>120)c.rocks.push({x,y,r:rad,pts,rot:rm()*TAU});}}
  for(let i=0;i<4;i++)c.patches.push({x:ox+r()*CH,y:oy+r()*CH,rx:80+r()*220,ry:40+r()*120,rot:r()*TAU,light:r()<0.5});
  for(let i=0;i<7;i++)c.ripples.push({x:ox+r()*CH,y:oy+r()*CH,len:60+r()*140,rot:-0.5+r()*0.4,bend:10+r()*18});
  const mkRock=(x,y,rad)=>{const pts=[];for(let j=0;j<8;j++)pts.push(0.78+r()*0.32);return {x,y,r:rad,pts,rot:r()*TAU};};
  const nearL=(x,y,m)=>nearLoc(x,y,m);
  for(let i=0;i<9;i++){const x=ox+r()*CH,y=oy+r()*CH,rad=16+r()*44,use=r()<0.27*B.rocks,rk=mkRock(x,y,rad);
    if(use&&land(x,y)&&roadInfo(x,y).d-60>rad+60&&!nearL(x,y,420))c.rocks.push(rk);}
  for(let i=0;i<5;i++){const x=ox+r()*CH,y=oy+r()*CH,rad=14+r()*28,rk=mkRock(x,y,rad),ri=roadInfo(x,y),edge=ri.d-ri.w/2,use=r()<Math.min(1,B.rocks);
    if(use&&land(x,y)&&edge>rad+28&&edge<rad+230&&!nearL(x,y,420))c.rocks.push(rk);}
  {const x=ox+60+r()*(CH-120),y=oy+60+r()*(CH-120),use=r()<0.15,rot=r()*TAU,burnt=r()<0.5;
    if(use&&land(x,y)&&roadInfo(x,y).d>150&&!nearL(x,y,420))c.wrecks.push({x,y,rot,w:70,h:34,burnt});}
  for(let i=0;i<8;i++){const x=ox+r()*CH,y=oy+r()*CH,rx=18+r()*50,ry=7+r()*14,rot=r()*0.6-0.3,ri=roadInfo(x,y);
    if(ri.d<ri.w/2+10&&roads[ri.r].cls==='highway')c.drifts.push({x,y,rx,ry,rot:Math.atan2(ri.ty,ri.tx)+rot});}
  for(let i=0;i<7;i++){const x=ox+r()*CH,y=oy+r()*CH,kind=B.decor[Math.floor(r()*B.decor.length)],rot=r()*TAU,s=0.7+r()*0.7;
    if(land(x,y)&&roadInfo(x,y).d>roadInfo(x,y).w/2+20&&!nearL(x,y,0))c.decor.push({x,y,kind,rot,s});}
  {const x=ox+r()*CH,y=oy+r()*CH,roll=r(),tr=r(),fuel=r()*15,cond=20+r()*50,ar=r();
    if(roll<0.035&&land(x,y)){const ri=roadInfo(x,y),edge=ri.d-ri.w/2;
      if(edge>14&&edge<170&&!nearL(x,y,800)&&!obstacleAt(x,y,30,c))
        c.carSpawns.push({id:'w'+cx+'_'+cy,type:PARK_TYPES[Math.floor(tr*PARK_TYPES.length)],x,y,a:Math.atan2(ri.ty,ri.tx)+(ar-0.5)*1.2,fuel,cond});}}
  // boulder fields: extremely rocky ground, slow and hard to pick a way through
  if(c.boulders)for(let i=0;i<26;i++){const x=ox+r()*CH,y=oy+r()*CH,rad=12+r()*30,rk=mkRock(x,y,rad);
    if(land(x,y)&&roadInfo(x,y).d-60>rad+40&&!nearL(x,y,500)&&!c.rocks.some(q=>Math.hypot(q.x-x,q.y-y)<q.r+rad+14))c.rocks.push(rk);}
  // river red gums line the banks of rivers and dry creek beds
  for(let j=0;j<TN;j++)for(let i=0;i<TN;i++){const t=c.terr[j*TN+i];if(t!==T.RIVER&&t!==T.DRY)continue;
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=TN||jj>=TN||c.terr[jj*TN+ii]!==T.GROUND)continue;
      if(r()<0.16){const x=ox+(ii+0.5)*32+(r()-0.5)*20,y=oy+(jj+0.5)*32+(r()-0.5)*20;if(roadInfo(x,y).d>70)c.decor.push({x,y,kind:'gum',rot:r()*TAU,s:0.8+r()*0.6});}}}
  // a rare stash hidden out in open country: worth leaving the road for
  {const x=ox+60+r()*(CH-120),y=oy+60+r()*(CH-120),roll=r();
    if(roll<0.012&&land(x,y)&&roadInfo(x,y).d>600&&!nearL(x,y,800)&&!obstacleAt(x,y,30,c))
      c.boxes.push({id:'s'+cx+'_'+cy,kind:'esky',x,y,table:'stash',rolls:3,seed:hash2(cx*3+1,cy*5+2),biome:z.biome,persist:true});}
  chunks.set(k,c);return c;
}
function chunksAround(x,y,fn){const cx=Math.floor(x/CH),cy=Math.floor(y/CH);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)fn(getChunk(cx+i,cy+j));}
function pruneChunks(x,y){const cx=Math.floor(x/CH),cy=Math.floor(y/CH);
  for(const [k,c] of chunks)if(Math.abs(c.cx-cx)>6||Math.abs(c.cy-cy)>6)chunks.delete(k);}
function obstacleAt(x,y,r,only){let hit=null;
  const test=c=>{if(hit)return;for(const k of c.rocks)if(Math.hypot(x-k.x,y-k.y)<k.r*0.85+r){hit=k;return;}
    for(const w of c.wrecks)if(Math.hypot(x-w.x,y-w.y)<34+r){hit=w;return;}};
  if(only)test(only);else chunksAround(x,y,test);return hit;}
function surfaceAt(x,y){const ri=roadInfo(x,y);if(nearService(x,y))return {cls:ROADCLS.highway,ri,on:true};
  if(ri.r>=0&&ri.d<ri.w/2+4)return {cls:ROADCLS[roads[ri.r].cls],ri,on:true};return {cls:null,ri,on:false};}
