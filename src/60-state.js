/* ===== game state, saving and loading =====
   Everything that matters lives in G. The world itself is rebuilt from fixed seeds,
   so a save only stores what the player changed. */
const SAVE_KEY=TEST_MODE?'lastsurvivor.testrange.save':'lastsurvivor.save.v5';   // the test range never touches your real save
const DAY=1440,CLOCK_RATE=32;   // game minutes per day; game seconds per real second
let G=null,state='title',prevState='play',panelCfg=null;
function newGame(save){
  chunks.clear();carSeq=0;raiderSeq=0;
  G={time:0,dist:0,wiped:0,shake:0,hurt:0,encT:45,canT:60,pruneT:0,syncT:0,nearT:0,wrongT:0,zoneT:0,knowT:0,warnedFuel:false,warnedDry:false,
    leg:null,dest:null,legNear:null,onLeg:false,inside:START,atOutpost:START,lastNode:START,legsDone:0,
    visited:new Set([START]),known:new Set(),zoneName:null,encActive:false,camRot:0,clock:8*60,nodT:8,warned:{},boxes:[],boxDelta:{},npcs:[],flags:{},foes:[],animals:[],bullets:[],noises:[],kills:0,rep:{},comp:null,npcGone:new Set(),fightT:0,markers:[],markerSeq:1,waypoint:null,stock:{},
    hero:{kind:'hero',x:0,y:0,a:0,vx:0,vy:0,speed:0,r:9,hp:100,water:100,food:100,rest:100,inv:{water:1,jerky:1,durries:3,watch:1},weapon:null,crouch:false,atkCd:0,swing:0,inCar:null,walk:0,flash:0,ri:NOROAD,dir:1,onRoad:true},
    cars:[],removed:new Set(),lastCar:null,pickups:[],parts:[],tracks:[],texts:[],cam:{x:0,y:0}};
  for(const l of LOCS)if(l.type==='city'||TEST_MODE)G.known.add(l.id);
  if(save){
    G.visited=new Set(save.visited);G.known=new Set(save.known||[]);G.wiped=save.wiped||0;G.dist=save.dist||0;G.time=save.time||0;G.legsDone=save.legs||0;
    G.atOutpost=save.at;G.lastNode=save.lastNode??save.at;G.markers=save.markers||[];G.markerSeq=save.markerSeq||G.markers.length+1;G.waypoint=save.waypoint??null;G.stock=save.stock||{};G.removed=new Set(save.removed||[]);G.lastCar=save.lastCar||null;
    G.dest=typeof save.dest==='number'?save.dest:null;
    G.clock=save.clock||8*60;G.boxDelta=save.boxDelta||{};G.flags=save.flags||{};G.rep=save.rep||{};
    for(const s of save.cars||[])if(CARS[s.type])G.cars.push(makeCar(s.type,s.x,s.y,s.a,{id:s.id,fuel:s.fuel,cond:s.cond,engine:s.engine??100,tyres:s.tyres??100,tw:s.tw,susp:s.susp??100,items:s.items||{},ups:s.ups||{},touched:true}));
    for(const s of save.cars||[]){const c=carById(s.id);if(c&&s.canFill)setFill(c.items,s.canFill);}
    G.wreckState=save.wreckState||{};
    const sh=save.hero;G.inside=-1;for(const l of LOCS)if(Math.hypot(sh.x-l.x,sh.y-l.y)<l.rad+400)G.inside=l.id;   // already inside a town: don't greet you again
    Object.assign(G.hero,{x:sh.x,y:sh.y,a:sh.a||0,hp:sh.hp,water:sh.water??100,food:sh.food??100,rest:sh.rest??100,inv:sh.inv||{},weapon:sh.weapon||null});setFill(G.hero.inv,sh.canFill||0);G.kills=save.kills||0;
    const c=carById(save.hero.inCar);if(c){c.driver='hero';G.hero.inCar=c.id;}
    if(save.comp&&COMPANIONS[save.comp.type]){const s=save.comp,p=makeComp(s.type,s.x,s.y);Object.assign(p,{hp:s.hp,state:s.state==='down'?'follow':s.state,ammo:s.ammo,missed:s.missed||0,fedDay:s.fedDay??p.fedDay,inCar:!!(s.inCar&&G.hero.inCar)});G.comp=p;}
  } else {
    // park the Kestrel on the road into the square, pointing out of town, with you beside the driver's door
    const o=LOCS[START],R=roads[o.links[0].road],dir=o.links[0].dir,i=dir>0?4:R.n-5,j=dir>0?8:R.n-9;
    const a=Math.atan2(R.ys[j]-R.ys[i],R.xs[j]-R.xs[i]),cx=R.xs[i],cy=R.ys[i];
    G.cars.push(makeCar('kestrel',cx,cy,a,{id:'hero0',touched:true,items:{water:2,beans:2,toolkit:1,bandage:1,scrap:1,tyreiron:1,jerrycan:1,hose:1}}));G.lastCar='hero0';
    G.hero.x=cx-Math.sin(a)*34;G.hero.y=cy+Math.cos(a)*34;G.hero.a=a;
  }
  learnAround(LOCS[G.atOutpost]);
  if(G.dest!==null){const p=routePath(G.lastNode,G.dest);G.leg=p&&p.legs.length?p.legs[0]:null;if(!G.leg)G.dest=null;}
  const b=body();G.cam.x=b.x;G.cam.y=b.y;
  syncCars();document.body.classList.toggle('onfoot',!G.hero.inCar);
}
// standing at a place, you hear about the places its roads lead to
function learnAround(o){G.known.add(o.id);for(const l of o.links)G.known.add(l.to);}
// bring generated cars and loot near the player into the world; drop untouched ones far away (they regenerate)
function syncCars(){
  const b=body(),cx=Math.floor(b.x/CH),cy=Math.floor(b.y/CH),have=new Set(G.cars.map(c=>c.id));
  const add=s=>{if(have.has(s.id)||G.removed.has(s.id))return;have.add(s.id);
    // parts wear roughly in line with the body; the boot holds whatever the last owner left
    const h=hash2(s.id.length*977,s.id.charCodeAt(1)*31+s.id.charCodeAt(s.id.length-1)),rr=rng(h^s.x|0);
    const near=v=>clamp(v+(rr()-0.5)*40,5,100);
    G.cars.push(makeCar(s.type,s.x,s.y,s.a,{id:s.id,fuel:s.fuel,cond:s.cond,engine:near(s.cond),tyres:near(s.cond),susp:near(s.cond),
      items:genLoot('boot',(h^(s.y|0))>>>0,s.id[0]==='o'?1:2,getChunk(Math.floor(s.x/CH),Math.floor(s.y/CH)).biome===BIOMES.salt?'salt':null)}));};
  for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)getChunk(cx+i,cy+j).carSpawns.forEach(add);
  const boxHave=new Set(G.boxes.map(x=>x.id));
  const addBox=bx=>{if(!boxHave.has(bx.id)){boxHave.add(bx.id);G.boxes.push(Object.assign({},bx));}};
  for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++)getChunk(cx+i,cy+j).boxes.forEach(addBox);
  for(const o of LOCS)if(Math.hypot(o.x-b.x,o.y-b.y)<3200){o.carSpawns.forEach(add);o.boxes.forEach(addBox);}
  G.boxes=G.boxes.filter(x=>Math.hypot(x.x-b.x,x.y-b.y)<4500);
  syncNPCs();syncFoes();
  G.cars=G.cars.filter(c=>{if(c.driver)return true;const far=Math.hypot(c.x-b.x,c.y-b.y)>4500;
    if(c.wrecked)return !far;return c.touched||!far;});
}
function saveData(){
  const cp=G.comp;
  return {v:5,wreckState:G.wreckState||{},lastNode:G.lastNode,markers:G.markers,markerSeq:G.markerSeq,waypoint:G.waypoint,stock:G.stock,clock:G.clock,boxDelta:G.boxDelta,flags:G.flags,rep:G.rep,comp:cp?{type:cp.type,x:Math.round(cp.x),y:Math.round(cp.y),hp:Math.round(cp.hp),state:cp.state,ammo:cp.ammo,missed:cp.missed,fedDay:cp.fedDay,inCar:cp.inCar}:null,at:G.atOutpost,visited:[...G.visited],known:[...G.known],wiped:G.wiped,dist:G.dist,time:G.time,legs:G.legsDone,dest:G.dest,
    removed:[...G.removed].slice(-800),lastCar:G.lastCar,
    kills:G.kills,hero:{x:G.hero.x,y:G.hero.y,a:G.hero.a,hp:G.hero.hp,water:G.hero.water,food:G.hero.food,rest:G.hero.rest,inv:G.hero.inv,weapon:G.hero.weapon,canFill:canFill(G.hero.inv),inCar:G.hero.inCar},
    cars:G.cars.filter(c=>c.touched&&!c.wrecked&&c.driver!=='raider').map(c=>({id:c.id,type:c.type,x:Math.round(c.x),y:Math.round(c.y),a:+c.a.toFixed(3),fuel:+c.fuel.toFixed(1),cond:+c.cond.toFixed(1),engine:+c.engine.toFixed(1),tyres:+c.tyres.toFixed(1),tw:c.tw.map(t=>Math.round(t)),ups:c.ups||{},susp:+c.susp.toFixed(1),items:c.items,canFill:canFill(c.items)}))};
}
// ---- saving is to files only (see the save-file code in the UI). Anything the old save slots left on a device is left alone, unused. ----
function placeLabel(){const b=body();let best=null,bd=250000;for(const l of LOCS){const d=Math.hypot(l.x-b.x,l.y-b.y);if(d<bd){bd=d;best=l;}}
  if(best&&bd<best.rad+400)return 'In '+best.name;if(best)return 'Near '+best.name;return zoneAt(b.x,b.y).name;}
// ---- settings (kept separately from the save) ----
const SETTINGS_KEY='lastsurvivor.settings';
const SETTINGS=Object.assign({rotate:false,zoom:1,view:'2d'},(function(){try{return JSON.parse(localStorage.getItem(SETTINGS_KEY))||{};}catch(e){return {};}})());
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(SETTINGS));}catch(e){}}
