/* ===== the barter economy, crafting recipes and car upgrades =====
   No money: every item has a value, measured against a bottle of water (worth 10). */
Object.assign(ITEMS,{
  cloth:{name:'Rags',kg:0.3,icon:'#c9b28a'},
  wire:{name:'Fencing wire',kg:0.5,icon:'#8d877c'},
  powder:{name:'Gunpowder',kg:0.2,icon:'#3b3026'},
  durries:{name:'Packet of durries',kg:0.1,icon:'#efe2c4'},
  watch:{name:'Pre-war watch',kg:0.1,icon:'#d6b25a'},
  pipeclub:{name:'Pipe club',kg:1.8,weapon:'pipeclub',icon:'#6d665d'},
  spikedbat:{name:'Spiked bat',kg:1.6,weapon:'spikedbat',icon:'#a8834a'},
  kit_roobar:{name:'Roo bar kit',kg:12,use:'upgrade',up:'roobar',icon:'#9c958a'},
  kit_longtank:{name:'Long-range tank kit',kg:14,use:'upgrade',up:'longtank',icon:'#5a3f2a'},
  kit_offroad:{name:'Off-road tyre kit',kg:16,use:'upgrade',up:'offroad',icon:'#2b2420'},
  kit_heavysusp:{name:'Heavy-duty suspension kit',kg:15,use:'upgrade',up:'heavysusp',icon:'#5a4636'},
  kit_blower:{name:'Blower kit',kg:10,use:'upgrade',up:'blower',icon:'#c9c2b5'},
  kit_armour:{name:'Armour plating kit',kg:20,use:'upgrade',up:'armour',icon:'#55504a'},
  kit_spikes:{name:'Spiked hubs kit',kg:8,use:'upgrade',up:'spikes',icon:'#d8cdb5'}});
Object.assign(WEAPONS,{
  pipeclub:{name:'Pipe club',melee:true,dmg:16,range:34,arc:1.3,cd:0.6,knock:120,noise:120},
  spikedbat:{name:'Spiked bat',melee:true,dmg:21,range:38,arc:1.6,cd:0.58,knock:170,noise:120}});
const VALUE={water:10,beans:8,jerky:6,bandage:6,medkit:30,jerrycan:18,scrap:4,tyre:35,parts:45,springs:40,toolkit:40,
  tyreiron:12,bat:18,machete:30,revolver:120,shotgun:160,rifle:220,bullets:3,shells:4,rounds:5,
  cloth:3,wire:5,powder:8,durries:15,watch:45,pipeclub:14,spikedbat:28,
  kit_roobar:120,kit_longtank:140,kit_offroad:110,kit_heavysusp:110,kit_blower:220,kit_armour:180,kit_spikes:90};
// trade goods and materials turn up in loot
LOOT.ruin.push(['cloth',6,1,3],['wire',4,1,2],['powder',1.5,1,2],['durries',4,1,2],['watch',1.2,1,1]);
LOOT.boot.push(['cloth',3,1,2],['wire',3,1,2],['durries',3,1,1]);
LOOT.raider.push(['durries',6,1,2],['watch',1,1,1],['powder',1.5,1,2],['wire',2,1,1]);
LOOT.camp.push(['durries',5,1,3],['watch',2,1,1],['powder',3,1,3],['kit_spikes',0.4,1,1],['kit_roobar',0.3,1,1]);
LOOT.stash.push(['durries',4,1,3],['watch',2,1,1]);
// ---- car upgrades ----
const UPGRADES={
  roobar:{name:'Roo bar',slot:'front',desc:'Rams hit harder; front-on crashes hurt the car less'},
  longtank:{name:'Long-range tank',slot:'tank',desc:'Burns 30% less fuel'},
  offroad:{name:'Off-road tyres',slot:'tyres',desc:'Faster in rough country, slower tyre wear, a little slower on bitumen'},
  heavysusp:{name:'Heavy-duty suspension',slot:'susp',desc:'Springs wear half as fast and cope better with rough ground'},
  blower:{name:'Blower',slot:'engine',desc:'12% more top speed and 20% more acceleration, but thirstier'},
  armour:{name:'Armour plating',slot:'body',desc:'Body takes 30% less damage and the car is heavier to shove, but a little slower'},
  spikes:{name:'Spiked hubs',slot:'hubs',desc:'Side-swipes rattle raiders 40% more'}};
function hasUp(c,u){return !!(c&&c.ups&&c.ups[u]);}
function fitUpgrade(c,u){c.ups=c.ups||{};for(const k in c.ups)if(UPGRADES[k].slot===UPGRADES[u].slot)delete c.ups[k];c.ups[u]=true;c.touched=true;}
// combined effect of a car's upgrades on its handling numbers
function upMods(c){const m={max:1,acc:1,burn:1,off:0,tyreWear:1,suspWear:1,armor:1,mass:0,ram:1,swipe:1,frontCrash:1,hwy:1};if(!c||!c.ups)return m;
  if(c.ups.roobar){m.ram=1.5;m.frontCrash=0.65;}
  if(c.ups.longtank)m.burn*=0.7;
  if(c.ups.offroad){m.off=0.15;m.tyreWear=0.6;m.hwy=0.95;}
  if(c.ups.heavysusp){m.suspWear=0.5;}
  if(c.ups.blower){m.max*=1.12;m.acc*=1.2;m.burn*=1.15;}
  if(c.ups.armour){m.armor=1.43;m.mass=0.4;m.max*=0.95;}
  if(c.ups.spikes)m.swipe=1.4;
  return m;}
// ---- crafting ----
const RECIPES=[
  {make:'bandage',qty:2,needs:{cloth:1},bench:false},
  {make:'pipeclub',qty:1,needs:{scrap:2,cloth:1},bench:false},
  {make:'spikedbat',qty:1,needs:{bat:1,scrap:1,wire:1},bench:true},
  {make:'shells',qty:4,needs:{scrap:1,powder:1},bench:true},
  {make:'bullets',qty:6,needs:{scrap:1,powder:1},bench:true},
  {make:'springs',qty:1,needs:{scrap:3,wire:1},bench:true},
  {make:'parts',qty:1,needs:{scrap:4,wire:2},bench:true},
  {make:'kit_roobar',qty:1,needs:{scrap:6,wire:1},bench:true},
  {make:'kit_spikes',qty:1,needs:{scrap:4,wire:2},bench:true},
  {make:'kit_armour',qty:1,needs:{scrap:10,wire:2},bench:true},
  {make:'kit_heavysusp',qty:1,needs:{springs:2,scrap:2},bench:true}];
// standing inside a garage, shed, servo or store, you can use its workbench
function atWorkbench(){const h=G.hero;if(h.inCar)return null;const o=nearLoc(h.x,h.y,0);if(!o)return null;
  return o.bld.find(b=>['garage','shed','servo','store'].includes(b.kind)&&bInside(b,h.x,h.y,0))||null;}
// your goods: your pockets plus the boot of your car if it's parked close by
function myStores(nearX,nearY){const out=[G.hero.inv];const c=heroCar()||carById(G.lastCar);
  if(c&&!c.wrecked&&Math.hypot(c.x-(nearX??G.hero.x),c.y-(nearY??G.hero.y))<700)out.push(c.items);return out;}
function countIn(stores,k){return stores.reduce((s,inv)=>s+(inv[k]||0),0);}
function takeFrom(stores,k,n){for(const inv of stores){while(n>0&&inv[k]){invTake(inv,k,1);n--;}}return n===0;}
function canCraft(r){const st=myStores();for(const k in r.needs)if(countIn(st,k)<r.needs[k])return false;return !r.bench||!!atWorkbench();}
function craft(r){if(!canCraft(r))return false;const st=myStores();for(const k in r.needs)takeFrom(st,k,r.needs[k]);giveItem(r.make,r.qty);SFX.clank();return true;}
// put items in your pockets, then the car boot, then on the ground at your feet
function giveItem(k,n){const h=G.hero,c=heroCar()||carById(G.lastCar);
  for(let i=0;i<n;i++){if(invWeight(h.inv)+ITEMS[k].kg<=HERO_CAP+1e-6)invAdd(h.inv,k,1);
    else if(c&&!c.wrecked&&Math.hypot(c.x-h.x,c.y-h.y)<700&&invWeight(c.items)+ITEMS[k].kg<=carCap(c)){invAdd(c.items,k,1);c.touched=true;}
    else addPickup(k,h.x+rand(-25,25),h.y+rand(-25,25));}}
// ---- prices: what a trader charges and pays depends on how their town sees you ----
function priceMods(o){const v=rep(o&&o.faction),t=repTier(v);
  const buy={Hated:2,Disliked:1.5,Neutral:1.25,Liked:1.12,Respected:1.0,Hero:0.9}[t],sell={Hated:0.3,Disliked:0.45,Neutral:0.6,Liked:0.7,Respected:0.8,Hero:0.9}[t];
  return {buy,sell,tier:t};}
function buyPrice(o,k,qtyVal){let p=(qtyVal??VALUE[k])*priceMods(o).buy;
  if(k==='svc_fuel'||k==='svc_cans'){if(o&&o.faction==='fuelkings')p*=rep('fuelkings')>=20?0.7:1.15;}   // the Kings sell fuel cheap to friends, dear to everyone else
  return Math.max(1,Math.round(p));}
function sellPrice(o,k){return Math.max(1,Math.floor(VALUE[k]*priceMods(o).sell));}
// ---- what each trader has today (restocked every morning) ----
const STOCK_LISTS={
  trader:[['hose',1],['jerrycan',1],['water',4],['beans',4],['jerky',4],['bandage',3],['cloth',4],['wire',3],['powder',2],['bullets',12],['shells',8],['tyreiron',1],['bat',1],['machete',1],['toolkit',1],['durries',3]],
  mechanic:[['jerrycan',2],['hose',2],['tyre',3],['parts',2],['springs',2],['scrap',6],['wire',3],['toolkit',1],['kit_roobar',1],['kit_longtank',1],['kit_offroad',1],['kit_heavysusp',1],['kit_spikes',1]],
  publican:[['water',6],['beans',4],['jerky',4],['durries',2]],
  doctor:[['bandage',6],['medkit',2],['cloth',3]],
  scavenger:[['scrap',3],['cloth',2],['wire',1],['durries',1],['powder',1]]};
function traderStock(n){const day=Math.floor(G.clock/DAY),id=n.def.id;G.stock=G.stock||{};
  if(!G.stock[id]||G.stock[id].day!==day){const r=rng(hash2(n.def.seed,day+11)),list=(STOCK_LISTS[n.def.role]||[]).slice(),inv={};
    if(n.def.role==='mechanic'&&n.loc.type==='city')list.push(['kit_blower',1],['kit_armour',1],['rifle',1]);
    if(n.def.role==='trader'&&n.loc.type==='city')list.push(['revolver',1],['shotgun',1],['rounds',8],['watch',1]);
    for(const [k,q] of list){const n2=Math.round(q*(0.5+r()*0.8));if(n2>0)inv[k]=n2;}
    G.stock[id]={day,inv};}
  return G.stock[id].inv;}
// services, sold like goods: their value depends on how much work is needed
function servicesFor(n,car){const role=n.def.role,out=[];
  if(role==='mechanic'&&car){if(car.fuel<99)out.push({k:'svc_fuel',name:'Fill the tank ('+Math.round(car.fuel)+'% → 100%)',val:Math.ceil((100-car.fuel)*0.45)});   // a full tank is worth about four and a half bottles of water
    if(car.cond<99)out.push({k:'svc_body',name:'Panel-beat the body ('+Math.round(car.cond)+'% → 100%)',val:Math.ceil((100-car.cond)*0.5)});
    if(car.engine<99)out.push({k:'svc_engine',name:'Overhaul the engine ('+Math.round(car.engine)+'% → 100%)',val:Math.ceil((100-car.engine)*1.2)});
    if(car.susp<99)out.push({k:'svc_susp',name:'Fix the suspension ('+Math.round(car.susp)+'% → 100%)',val:Math.ceil((100-car.susp)*0.8)});
    const worn=car.tw.filter(t=>t<60).length;if(worn)out.push({k:'svc_tyres',name:'Fit '+worn+(worn>1?' new tyres':' new tyre'),val:worn*30});}
  if(role==='mechanic'&&canSpace(G.hero.inv)>1)out.push({k:'svc_cans',name:'Fill your jerry cans (+'+Math.round(canSpace(G.hero.inv))+'%)',val:Math.ceil(canSpace(G.hero.inv)*0.45)});
  if(role==='publican'){if(G.hero.water<95||G.hero.food<95)out.push({k:'svc_meal',name:'A hot meal and a jug of water',val:8});out.push({k:'svc_bunk',name:'A bunk for the night',val:12});}
  if(role==='doctor'&&G.hero.hp<99)out.push({k:'svc_heal',name:'Patch you up ('+Math.round(G.hero.hp)+'% → 100%)',val:Math.max(5,Math.ceil((100-G.hero.hp)*0.25))});
  return out;}
function applyService(k,car){const h=G.hero;
  if(k==='svc_fuel')car.fuel=100;else if(k==='svc_body')car.cond=100;else if(k==='svc_engine')car.engine=100;else if(k==='svc_susp')car.susp=100;
  else if(k==='svc_tyres'){for(let i=0;i<4;i++)if(car.tw[i]<60)car.tw[i]=100;}
  else if(k==='svc_cans')setFill(G.hero.inv,(G.hero.inv.jerrycan||0)*CAN_CAP);
  else if(k==='svc_meal'){h.water=100;h.food=100;}else if(k==='svc_heal')h.hp=100;
  if(car)car.touched=true;}
