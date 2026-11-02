/* ===== fuel scavenging and salvage =====
   No full jerry cans lie around: you siphon fuel out of abandoned and defeated cars with a hose and an empty can,
   and strip what's left of their parts. Both take game time, and at night raiders may find you at it. */
Object.assign(ITEMS,{
  jerrycan:{name:'Jerry can',kg:3,use:'fuel',icon:'#c2381f'},
  hose:{name:'Siphon hose',kg:0.5,icon:'#5f6b45'},
  tyre_worn:{name:'Worn tyre',kg:9,use:'repair',part:'tyres',val:50,icon:'#4a4038'},
  parts_used:{name:'Used engine parts',kg:4,use:'repair',part:'engine',val:20,needs:'toolkit',icon:'#55504a'},
  springs_used:{name:'Worn leaf springs',kg:6,use:'repair',part:'susp',val:25,needs:'toolkit',icon:'#4e3a2c'}});
Object.assign(VALUE,{jerrycan:8,hose:8,tyre_worn:12,parts_used:15,springs_used:12});
// no more full cans in loot; empty cans and hoses turn up instead
for(const t in LOOT)LOOT[t]=LOOT[t].filter(e=>e[0]!=='jerrycan');
LOOT.ruin.push(['jerrycan',2,1,1],['hose',3,1,1]);LOOT.boot.push(['jerrycan',2,1,1],['hose',2,1,1]);LOOT.camp.push(['hose',2,1,1]);
const CAN_CAP=30;                 // one jerry can holds 30% of a tank
const FUEL_KG=0.4;                // weight per 1% of a tank
const SIPHON_RATE=6;              // % of a tank per game hour
// fuel carried in jerry cans: one pool per inventory, kept off the item list so it doesn't show up as an item
function canFill(inv){return inv&&inv._fill||0;}
function setFill(inv,v){if(!Object.prototype.hasOwnProperty.call(inv,'_fill'))Object.defineProperty(inv,'_fill',{value:0,writable:true,enumerable:false});inv._fill=clamp(v,0,(inv.jerrycan||0)*CAN_CAP);}
function canSpace(inv){return (inv.jerrycan||0)*CAN_CAP-canFill(inv);}
// lost cans take their share of the fuel with them
function trimFill(inv){if(canFill(inv)>(inv.jerrycan||0)*CAN_CAP)setFill(inv,(inv.jerrycan||0)*CAN_CAP);}
// ---- what can be salvaged: abandoned cars outside towns, defeated raider cars, and the burnt-out wrecks ----
function wreckState(w){G.wreckState=G.wreckState||{};const id=w.id;if(!G.wreckState[id]){const r=rng(hash2(Math.round(w.x),Math.round(w.y)));
    G.wreckState[id]={fuel:w.burnt?0:Math.floor(r()*13),engine:w.burnt?Math.floor(r()*20):Math.floor(r()*55),susp:Math.floor(r()*60),scrap:2+Math.floor(r()*4),tw:[0,0,0,0]};}
  return G.wreckState[id];}
function nearestWreck(r){const h=G.hero;let best=null,bd=r;chunksAround(h.x,h.y,ch=>{ch.wrecks.forEach((w,i)=>{w.id=w.id||('k'+ch.cx+'_'+ch.cy+'_'+i);const d=Math.hypot(w.x-h.x,w.y-h.y)-30;if(d<bd){bd=d;best=w;}});});return best;}
// the thing you'd salvage from where you're standing: {kind,name,src} where src has fuel, engine, susp, tw and scrap
function salvageTarget(){const h=G.hero;if(h.inCar)return null;
  const c=nearestCar(40);if(c&&c.speed<5&&!nearService(c.x,c.y))return {kind:'car',name:c.def.name,src:c};
  const w=nearestWreck(30);if(w)return {kind:'wreck',name:w.burnt?'burnt-out wreck':'rusted wreck',src:wreckState(w)};return null;}
function partQuality(v,good,worn){return v>=70?good:v>=25?worn:'scrap';}
// what you'd get from each part, and how long it takes (hours)
function strippable(src){const out=[],tw=src.tw||[0,0,0,0];
  tw.forEach((t,i)=>{if(t>=30)out.push({id:'tyre'+i,name:'the '+TYRE_NAMES[i]+' tyre',item:t>=75?'tyre':'tyre_worn',h:1,apply:()=>{src.tw[i]=0;}});});
  if(src.engine>0)out.push({id:'engine',name:'the engine parts',item:partQuality(src.engine,'parts','parts_used'),h:3,apply:()=>{src.engine=0;}});
  if(src.susp>0)out.push({id:'susp',name:'the springs',item:partQuality(src.susp,'springs','springs_used'),h:2,apply:()=>{src.susp=0;}});
  const scrap=src.scrap!==undefined?src.scrap:Math.floor((src.cond||0)/25);
  for(let i=0;i<Math.min(scrap,4);i++)out.push({id:'scrap'+i,name:'scrap from the body',item:'scrap',h:0.5,apply:()=>{if(src.scrap!==undefined)src.scrap--;else src.cond=Math.max(0,src.cond-25);}});
  return out;}
// ---- doing it: time passes in quarter-hours; at night each quarter-hour carries a small chance of raiders ----
const AMBUSH_PER_HOUR=0.09;
function passQuarterHour(){const h=G.hero;G.clock+=15;h.water=Math.max(0,h.water-1.5);h.food=Math.max(0,h.food-0.75);h.rest=Math.max(0,h.rest-1.4);
  if(h.water<=0)h.hp-=2;if(h.food<=0)h.hp-=0.8;
  return darkness()>0.3&&Math.random()<AMBUSH_PER_HOUR/4;}
function salvageAmbush(){const h=G.hero,n=2+(Math.random()<0.4?1:0);
  for(let k=0;k<n;k++){const a=Math.random()*TAU,d=rand(260,380),f=spawnLooseFoe(h.x+Math.cos(a)*d,h.y+Math.sin(a)*d,true);f.stun=0;f.hp=f.maxHp=60;}
  G.fightT=8;showMsg('Torches in the dark. Raiders!',3);}
function doSiphon(t,maxHours){const h=G.hero,inv=h.inv,src=t.src;let got=0,quarters=0,ambush=false;
  while(quarters<maxHours*4&&src.fuel>0.05&&canSpace(inv)>0.05){const amt=Math.min(SIPHON_RATE/4,src.fuel,canSpace(inv));src.fuel-=amt;setFill(inv,canFill(inv)+amt);got+=amt;quarters++;
    if(passQuarterHour()){ambush=true;break;}}
  if(t.kind==='car')src.touched=true;state='play';hidePanel();
  const time=fmtHours(quarters/4);if(ambush)salvageAmbush();else showMsg('Siphoned '+got.toFixed(0)+'% of a tank in '+time+'. Jerry cans: '+canFill(inv).toFixed(0)+'%',2.8);
  return {got,hours:quarters/4,ambush};}
function doStrip(t,jobs){const src=t.src;let quarters=0,done=[],ambush=false;
  for(const j of jobs){const need=Math.round(j.h*4);let q=0;while(q<need){q++;quarters++;if(passQuarterHour()){ambush=true;break;}}if(ambush)break;
    j.apply();giveItem(j.item,1);done.push(ITEMS[j.item].name.toLowerCase());}
  if(t.kind==='car')src.touched=true;state='play';hidePanel();SFX.clank();
  if(ambush)salvageAmbush();else showMsg(done.length?'After '+fmtHours(quarters/4)+': '+summarise(done):'Nothing worth taking',3);
  return {done,hours:quarters/4,ambush};}
function fmtHours(h){const m=Math.round(h*60);return m<60?m+' minutes':(m%60===0?m/60+(m===60?' hour':' hours'):Math.floor(m/60)+' h '+(m%60)+' min');}
function summarise(list){const c={};for(const x of list)c[x]=(c[x]||0)+1;return Object.keys(c).map(k=>c[k]>1?c[k]+' × '+k:k).join(', ');}
