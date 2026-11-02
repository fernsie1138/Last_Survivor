/* ===== items, loot tables, inventories, containers ===== */
const ITEMS={
  water:{name:'Water bottle',kg:1,use:'drink',val:35,icon:'#7fb3c4'},
  beans:{name:'Tin of beans',kg:0.5,use:'eat',val:30,icon:'#c9c2b5'},
  jerky:{name:'Roo jerky',kg:0.2,use:'eat',val:18,icon:'#7a3b22'},
  bandage:{name:'Bandage',kg:0.2,use:'heal',val:15,icon:'#efe2c4'},
  medkit:{name:'First-aid kit',kg:1,use:'heal',val:45,icon:'#c2381f'},
  jerrycan:{name:'Jerrycan of fuel',kg:15,use:'fuel',val:30,icon:'#c2381f'},
  scrap:{name:'Scrap metal',kg:2,use:'repair',part:'cond',val:20,icon:'#8f8a80'},
  tyre:{name:'Spare tyre',kg:10,use:'repair',part:'tyres',val:100,icon:'#2b2420'},
  parts:{name:'Engine parts',kg:4,use:'repair',part:'engine',val:40,needs:'toolkit',icon:'#6b6258'},
  springs:{name:'Leaf springs',kg:6,use:'repair',part:'susp',val:50,needs:'toolkit',icon:'#5a4636'},
  toolkit:{name:'Toolkit',kg:3,tool:true,icon:'#b8862f'},
  tyreiron:{name:'Tyre iron',kg:2,weapon:'tyreiron',icon:'#55504a'},
  bat:{name:'Cricket bat',kg:1.2,weapon:'bat',icon:'#c9a35a'},
  machete:{name:'Machete',kg:1,weapon:'machete',icon:'#9c958a'},
  revolver:{name:'Revolver',kg:1.2,weapon:'revolver',icon:'#3b3026'},
  shotgun:{name:'Double-barrel shotgun',kg:3.5,weapon:'shotgun',icon:'#5a3f2a'},
  rifle:{name:'.303 rifle',kg:4,weapon:'rifle',icon:'#6b4a32'},
  bullets:{name:'Revolver rounds',kg:0.02,ammo:true,icon:'#b8862f'},
  shells:{name:'Shotgun shells',kg:0.05,ammo:true,icon:'#c2381f'},
  rounds:{name:'.303 rounds',kg:0.03,ammo:true,icon:'#8a6a48'}};
// melee weapons hit everything in an arc in front of you; guns fire projectiles and make a lot of noise
const WEAPONS={
  fists:{name:'Fists',melee:true,dmg:8,range:24,arc:1.4,cd:0.45,knock:70,noise:90},
  knife:{name:'Knife',melee:true,dmg:10,range:26,arc:1.1,cd:0.6,knock:40,noise:60},
  tyreiron:{name:'Tyre iron',melee:true,dmg:18,range:32,arc:1.2,cd:0.6,knock:110,noise:120},
  bat:{name:'Cricket bat',melee:true,dmg:15,range:38,arc:1.6,cd:0.55,knock:170,noise:120},
  machete:{name:'Machete',melee:true,dmg:26,range:32,arc:1.1,cd:0.5,knock:80,noise:100},
  revolver:{name:'Revolver',gun:true,dmg:34,range:520,cd:0.5,ammo:'bullets',spread:0.05,pellets:1,noise:950},
  shotgun:{name:'Shotgun',gun:true,dmg:13,range:260,cd:1.0,ammo:'shells',spread:0.32,pellets:6,noise:1100},
  rifle:{name:'.303 rifle',gun:true,dmg:75,range:950,cd:1.5,ammo:'rounds',spread:0.012,pellets:1,noise:1300}};
const PARTS={engine:'Engine',tyres:'Tyres',susp:'Suspension',cond:'Body'};
const HERO_CAP=25;
// loot tables: [item, weight, min, max]
const LOOT={
  ruin:[['tyreiron',3,1,1],['bat',2,1,1],['machete',1,1,1],['revolver',0.4,1,1],['bullets',1.5,3,8],['shells',1,2,5],['water',10,1,2],['beans',8,1,3],['jerky',6,1,3],['bandage',5,1,2],['medkit',2,1,1],['jerrycan',4,1,1],['scrap',8,1,3],['tyre',2,1,1],['parts',3,1,1],['springs',2,1,1],['toolkit',1,1,1]],
  boot:[['tyreiron',3,1,1],['rounds',0.4,3,6],['water',6,1,2],['beans',4,1,2],['jerky',3,1,2],['scrap',5,1,2],['tyre',4,1,1],['jerrycan',2,1,1],['parts',2,1,1],['toolkit',1,1,1],['bandage',2,1,1]],
  camp:[['bullets',4,4,10],['shells',3,3,8],['rounds',1.5,3,8],['revolver',1,1,1],['shotgun',0.6,1,1],['rifle',0.3,1,1],['machete',2,1,1],
    ['water',6,1,3],['beans',5,1,3],['jerrycan',4,1,1],['medkit',3,1,1],['parts',2,1,1]],
  stash:[['water',8,2,4],['beans',6,2,4],['jerrycan',5,1,2],['medkit',3,1,1],['parts',2,1,2],['jerky',4,2,4]],
  raider:[['bullets',1.5,2,6],['shells',0.8,2,4],['scrap',8,1,2],['jerky',5,1,2],['water',5,1,1],['jerrycan',3,1,1],['bandage',2,1,1],['parts',1,1,1]]};
// zones tilt the odds: mining country has parts, the salt is dry, the coast has food
const ZONE_LOOT={ranges:{parts:2.5,springs:2,toolkit:2,water:0.7},salt:{water:0.4,jerky:1.5},coast:{beans:1.8,water:1.3},mallee:{water:1.2},red:{water:0.8}};
function genLoot(table,seed,rolls,biome){const r=rng(seed),T=LOOT[table],mod=(biome&&ZONE_LOOT[biome])||{},inv={};
  const total=T.reduce((s,e)=>s+e[1]*(mod[e[0]]||1),0);
  for(let i=0;i<rolls;i++){let x=r()*total;for(const e of T){x-=e[1]*(mod[e[0]]||1);if(x<=0){const q=e[2]+Math.floor(r()*(e[3]-e[2]+1));inv[e[0]]=(inv[e[0]]||0)+q;break;}}}
  return inv;}
function invWeight(inv){let w=(inv&&inv._fill||0)*FUEL_KG;for(const k in inv)w+=ITEMS[k].kg*inv[k];return Math.round(w*10)/10;}   // fuel in jerry cans has weight too
function invAdd(inv,k,n){inv[k]=(inv[k]||0)+(n||1);}
function invTake(inv,k,n){n=n||1;if(!inv[k]||inv[k]<n)return false;inv[k]-=n;if(inv[k]<=0)delete inv[k];return true;}
function invCount(inv){let n=0;for(const k in inv)n+=inv[k];return n;}
function carCap(c){return c.def.boot;}
// move up to n of an item between inventories, respecting the destination's weight limit
function invMove(from,to,k,n,cap){let moved=0;n=n||1;const per=k==='jerrycan'&&from.jerrycan?canFill(from)/from.jerrycan:0;   // a jerry can takes its fuel with it
  while(moved<n&&from[k]){if(cap!==undefined&&invWeight(to)+ITEMS[k].kg+per*FUEL_KG>cap+1e-6)break;invTake(from,k,1);invAdd(to,k,1);moved++;
    if(per){setFill(from,canFill(from)-per);setFill(to,canFill(to)+per);}}
  return moved;}
// ---- world containers (crates, stashes, raider bags) ----
// items are generated the first time you open one; changes are remembered in G.boxDelta
function boxItems(b){if(b.items)return b.items;
  if(G.boxDelta[b.id])b.items=G.boxDelta[b.id];else b.items=genLoot(b.table,hash2(b.seed,b.seed*7+3),b.rolls,b.biome);
  return b.items;}
function boxChanged(b){if(b.persist)G.boxDelta[b.id]=b.items;}
