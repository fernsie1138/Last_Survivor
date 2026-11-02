/* ===== main loop ===== */
// thirst, hunger and tiredness. Rates are per game hour; one game day lasts 45 real minutes.
function survival(dt,car){const h=G.hero,gm=dt*CLOCK_RATE/60;G.clock+=gm;
  const hour=(G.clock%DAY)/60,night=hour<6||hour>=20,b=car||h,bio=getChunk(Math.floor(b.x/CH),Math.floor(b.y/CH)).biome;
  const heat=(bio===BIOMES.red||bio===BIOMES.salt?1.3:1)*(night?0.6:1),exert=car?1:(h.speed>75?1.8:h.speed>12?1.1:0.9);
  h.water=Math.max(0,h.water-6/60*gm*heat*exert);
  h.food=Math.max(0,h.food-3/60*gm*(car?1:exert));
  h.rest=Math.max(0,h.rest-5.5/60*gm*(car?1:exert>1.5?1.3:1));
  if(h.water<=0)hurtHero(0.35*dt,'thirst');if(h.food<=0)hurtHero(0.12*dt,'hunger');if(h.rest<=0)hurtHero(0.05*dt,'exhaustion');
  const warn=(k,t,v)=>{if(v<25&&!G.warned[k]){G.warned[k]=true;showMsg(t,2.4);}if(v>40)G.warned[k]=false;};
  warn('water','You’re parched. Drink something.',h.water);warn('food','Your stomach is cramping. Eat.',h.food);warn('rest','You can barely keep your eyes open',h.rest);
  if(h.rest>30)G.warned.nod=false;
}
function driveHero(car,inp,dt){
  let thr=inp.thr,boost=inp.boost;car.braking=inp.brake;car.cruise=inp.cruise&&!inp.boost&&thr>0?thr:null;
  const dead=carDead(car);
  if(dead){if(thr>0||(thr<0&&car.vf<=5)){if(G.deadMsgT<=0){showMsg(dead==='engine'?'The engine’s dead. It won’t turn over':'The car’s too battered to run',2.2);G.deadMsgT=4;}}
    if(thr>0||car.vf<=5)thr=Math.min(0,thr)*(car.vf>5?1:0);boost=false;car.cruise=null;}   // you can still brake and coast, but there's no drive
  G.deadMsgT=(G.deadMsgT||0)-dt;if(inp.brake){thr=0;boost=false;}
  if(boost&&car.fuel>3)thr=1;else boost=false;
  if(car.fuel<=0&&thr>0){thr=0;if(!G.warnedDry){G.warnedDry=true;showMsg('Out of fuel. Get out and find some.',2.6);}}
  if(car.fuel>1)G.warnedDry=false;
  const um=upMods(car);if(!dead)car.fuel=Math.max(0,car.fuel-(0.02+Math.max(0,thr)*0.15+(boost?0.6:0))*car.def.burn*um.burn*dt);
  car.stagger-=dt;G.hero.atkCd-=dt;onRoadAt(car);
  driveCar(car,thr,inp.steer,dt,boost,inp.drift);
  // wear: off-road is hardest on the car, dirt and gravel less so, bitumen not at all
  const wear=car.onRoad?(car.surf?car.surf.wear:0):1;
  if(wear>0&&car.speed>120){const w=dt*(car.speed/500)*(1.3-car.def.off)*0.5*wear/car.def.armor;
    if(car.onRoad){wearTyres(car,w*1.2*um.tyreWear);car.susp=Math.max(0,car.susp-w*0.6*um.suspWear);}           // gravel and dirt chew tyres
    else{car.susp=Math.max(0,car.susp-w*1.1*um.suspWear);wearTyres(car,w*0.8*um.tyreWear);car.cond-=w*0.4/um.armor;}}   // open country breaks springs
  // a driver short on sleep nods off now and then
  if(G.hero.rest<20&&car.speed>80){G.nodT-=dt;if(G.nodT<=0){G.nodT=rand(4,9)*(0.3+G.hero.rest/20);car.a+=rand(-0.3,0.3);
    if(!G.warned.nod){G.warned.nod=true;showMsg('You nodded off at the wheel',2);}}}
  if(boost&&Math.random()<0.7){const fx=Math.cos(car.a),fy=Math.sin(car.a);
    part({kind:'fire',x:car.x-fx*car.r*1.15,y:car.y-fy*car.r*1.15,vx:-fx*160+rand(-30,30),vy:-fy*160+rand(-30,30),life:.25,max:.25,size:7,grow:-10,drag:2,col:'#ffb347'});}
  if(!car.onRoad&&car.speed>200)G.shake=Math.max(G.shake,2);
  G.dist+=car.speed*dt/M;
  return {thr,boost};
}
function update(dt){
  G.time+=dt;const h=G.hero;let car=heroCar();const inp=readInput(car);let eng={thr:0,boost:false};
  survival(dt,car);
  if(car)eng=driveHero(car,inp,dt);else updateHeroOnFoot(dt,inp);
  for(const c of G.cars){if(c===car||c.dead)continue;if(c.driver==='raider')updateRaider(c,dt);else idleCar(c,dt);c.flash=Math.max(0,c.flash-dt*5);}
  if(car)car.flash=Math.max(0,car.flash-dt*5);
  for(const c of G.cars)if(!c.dead&&(c.speed>1||c===car))collideWorld(c);
  const b0=body(),near=G.cars.filter(c=>!c.dead&&Math.abs(c.x-b0.x)<1500&&Math.abs(c.y-b0.y)<1500);
  for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++)carPair(near[i],near[j]);
  if(!heroCar())heroVsCars();
  navBudget=2;for(const n of G.npcs)updateNPC(n,dt);npcContacts();
  if(car&&car.speed>20)addNoise(car.x,car.y,150+car.speed*0.8);   // engines carry a long way out here
  updateWildlife(dt);for(const f of G.foes)updateFoe(f,dt);updateComp(dt);stepBullets(dt);G.fightT-=dt;
  if(compOnFoot()){const cp=G.comp;for(const c of G.cars){if(c.speed<110||c===car)continue;const d=Math.hypot(cp.x-c.x,cp.y-c.y);if(d<c.r+cp.r){hurtComp((c.speed-80)*0.3);const l=d||1;cp.x+=(cp.x-c.x)/l*12;cp.y+=(cp.y-c.y)/l*12;}}}
  if(!heroCar())for(const f of G.foes){if(f.dead)continue;const dx=f.x-h.x,dy=f.y-h.y,d=Math.hypot(dx,dy),m=f.r+h.r;if(d<m&&d>1e-4){f.x+=dx/d*(m-d)*0.5;f.y+=dy/d*(m-d)*0.5;h.x-=dx/d*(m-d)*0.5;h.y-=dy/d*(m-d)*0.5;}}
  for(const f of G.foes){if(f.dead)continue;for(const c of G.cars){if(c.speed<60)continue;const d=Math.hypot(f.x-c.x,f.y-c.y);   // cars hit people on foot
    if(d<c.r+f.r){const rel=Math.hypot(c.vx,c.vy);if(rel>110){const l=d||1;hitFoe(f,(rel-80)*0.35,(f.x-c.x)/l,(f.y-c.y)/l,rel*0.8);if(c===car){c.cond-=2;SFX.hit(0.4);}}}}}
  G.foes=G.foes.filter(f=>!(f.dead&&f.deadT<=0)&&!f.gone);G.noises=[];
  for(const c of G.cars){if(c.dead||c.wrecked)continue;
    if(c.driver==='raider'){if(c.wipe<=0&&(c.stab<=0||c.cond<=0))startWipe(c);}
    else if(c.cond<0)c.cond=0;   // a car at zero body is too battered to run, but it doesn't explode
    else if(c.cond<35&&Math.random()<0.15)smoke(c.x,c.y,6);}
  for(const c of G.cars)if(c.burn>0){c.burn-=dt;if(Math.random()<0.5)part({kind:'fire',x:c.x+rand(-10,10),y:c.y+rand(-6,6),vx:0,vy:rand(-20,0),life:.5,max:.5,size:9,grow:-8,drag:1,col:'#ff9a3a'});if(Math.random()<0.4)smoke(c.x,c.y,10);}
  G.cars=G.cars.filter(c=>!c.dead&&!c.gone&&Number.isFinite(c.x)&&Number.isFinite(c.y));   // never keep a car whose position has gone bad
  car=heroCar();const b=body();
  if(car&&b.ri.r>=0){const s=car.vx*b.ri.tx+car.vy*b.ri.ty;b.dir=car.speed>30?(s>=0?1:-1):((Math.cos(car.a)*b.ri.tx+Math.sin(car.a)*b.ri.ty)>=0?1:-1);}
  // raiders: only while you're out on the road driving (fewer on remote dirt tracks)
  const raiding=G.cars.some(c=>c.driver==='raider');
  // the angrier the Dust Devils are with you, the more often they come looking
  if(car&&car.speed>120&&!nearLoc(b.x,b.y,3000))G.encT-=dt*(car.surf&&car.surf===ROADCLS.dirt?0.6:1)*clamp(0.7-rep('raiders')/200,0.9,1.25);
  if(G.encT<=0){if(!raiding&&car){spawnEncounter();G.encT=rand(80,150);}else G.encT=12;}
  if(G.encActive&&!raiding){G.encActive=false;showMsg('Road’s clear',2);}
  // route guidance
  if(G.leg){const L=G.leg;G.onLeg=b.ri.r===L.road&&b.ri.d<300;
    G.nearT-=dt;if(!G.onLeg&&G.nearT<=0){G.nearT=0.4;const R=roads[L.road];let bd=1e18,bi=0;
      for(let i=0;i<R.n;i+=4){const q=(R.xs[i]-b.x)**2+(R.ys[i]-b.y)**2;if(q<bd){bd=q;bi=i;}}G.legNear={x:R.xs[bi],y:R.ys[bi]};}
    if(car&&G.onLeg&&car.speed>120&&b.dir!==L.dir){G.wrongT+=dt;if(G.wrongT>1.6){G.wrongT=-4;showMsg('Wrong way',1.6);}}else if(G.wrongT>0)G.wrongT=0;else G.wrongT=Math.min(0,G.wrongT+dt);
  }
  else G.onLeg=false;
  if(!car)collectPickups();
  for(const k of G.pickups){k.t+=dt;if(Math.hypot(k.x-b.x,k.y-b.y)>6000)k.dead=true;}
  G.pickups=G.pickups.filter(k=>!k.dead);
  for(const c of G.cars)if(c.speed>20&&Math.abs(c.x-b.x)<1500&&Math.abs(c.y-b.y)<1500)addTracks(c);
  stepEffects(dt);G.hurt=Math.max(0,G.hurt-dt*1.5);
  // camera: follow, zoom out with speed, and optionally turn the world so the car faces up
  const lead=car?0.5:0.25,cam=G.cam,tx=b.x+b.vx*lead,ty=b.y+b.vy*lead;cam.x+=(tx-cam.x)*Math.min(1,dt*4);cam.y+=(ty-cam.y)*Math.min(1,dt*4);
  const zt=(car?ZBASE*(1-0.22*Math.min(1,car.speed/520)):ZBASE*1.3)*SETTINGS.zoom;ZOOM+=(zt-ZOOM)*Math.min(1,dt*(pinch?8:1.5));   // follow a pinch quickly, drift with speed gently
  const rotT=SETTINGS.rotate?(car?-Math.PI/2-car.a:G.camRot):0;G.camRot+=angDiff(rotT,G.camRot)*Math.min(1,dt*3.5);
  G.syncT-=dt;if(G.syncT<=0){G.syncT=0.5;syncCars();}
  // roofs fade away while you're inside a building
  {const o=nearLoc(h.x,h.y,100);if(o)for(const bd of o.bld){if(bd.tank)continue;if(bd.roofA===undefined)bd.roofA=1;
    const tgt=!h.inCar&&bInside(bd,h.x,h.y,-2)?0:1;bd.roofA+=(tgt-bd.roofA)*Math.min(1,dt*7);}}
  G.pruneT-=dt;if(G.pruneT<=0){G.pruneT=1;pruneChunks(b.x,b.y);}
  // places: discover them as you approach, stop in at outposts and cities
  G.knowT-=dt;if(G.knowT<=0){G.knowT=1;for(const l of LOCS)if(!G.known.has(l.id)&&Math.hypot(l.x-b.x,l.y-b.y)<4000){G.known.add(l.id);if(l.type==='ruin')showMsg((l.camp&&!G.flags['camp_'+l.id]?'Raider camp: ':'Spotted: ')+l.name,2.4);}}
  G.facT=(G.facT||0)-dt;if(G.facT<=0){G.facT=1;compTick();for(const o of LOCS)if(o.service&&Math.hypot(o.x-b.x,o.y-b.y)<o.rad+700&&townHostile(o))hostileGuards(o);}
  G.zoneT-=dt;if(G.zoneT<=0){G.zoneT=1.5;const z=zoneAt(b.x,b.y).name;if(z!==G.zoneName){if(G.zoneName)showMsg(z,2.4);G.zoneName=z;}}
  for(const l of LOCS){const d=Math.hypot(b.x-l.x,b.y-l.y);
    if(G.inside===l.id){if(d>l.rad+400)G.inside=-1;}
    else if(d<l.arrive){if(l.service){arrive(l);if(state!=='play')return;}else{nodeReached(l.id);G.visited.add(l.id);showMsg(l.name,2.4);}}}
  // reaching a marker you're being guided to
  if(G.waypoint!=null){const wp=G.markers.find(m=>m.id===G.waypoint);if(!wp)G.waypoint=null;else if(Math.hypot(wp.x-b.x,wp.y-b.y)<260){showMsg('You’ve reached '+wp.text,2.4);G.waypoint=null;}}
  if(car&&car.fuel<20&&!G.warnedFuel){G.warnedFuel=true;showMsg('Fuel low',2);}
  if(car&&car.fuel>35)G.warnedFuel=false;
  SFX.engine(car?car.speed:0,eng.thr,eng.boost,!!car&&car.fuel>0&&!carDead(car),car?car.def.pitch:1);
  updateHud();updateCtx();
  if(h.hp<=0){h.hp=0;gameOver();}
}
let last=0,fpsS=60,dbgT=0;
function frame(t){requestAnimationFrame(frame);const raw=last?(t-last)/1000:0.016,dt=Math.min(0.033,raw);last=t;
  if(TEST_MODE&&G){fpsS+=(1/Math.max(raw,0.001)-fpsS)*0.05;dbgT-=raw;if(dbgT<=0){dbgT=0.5;$('dbg').textContent=Math.round(fpsS)+' fps, '+G.cars.length+' cars, '+G.npcs.length+' folk, '+G.foes.length+' raiders on foot, '+G.parts.length+' particles';}}
  // keep game time in step with real time even when frames come slowly: run several smaller steps rather than slowing the world down
  if(state==='play'){let left=Math.min(raw,0.1);while(left>1e-4&&state==='play'){const st=Math.min(left,1/30);update(st);left-=st;}}
  else if(state!=='paused'&&state!=='map'&&state!=='inv'&&state!=='talk'&&G)stepEffects(dt);
  renderView();}
window.__LT={V3,renderView,reset3D,roadTerrain,heightAt,terrainAt,insideMesa,get G(){return G;},get state(){return state;},update,render,newGame,arrive,setDest,depart:departPanel,openInv,closeInv,invClick,renderInv,useItem,quickUse,doSleep,sleepPanel,sleepUntilMorning,startTalk,chooseOpt,endTalk,setZoom,navPathTest:(o,a,b)=>navPath(o,a,b),navGridTest:o=>navGrid(o),shellAt,shellsNear,inShellWall,SHELL_CELL,layoutRefinery,SPECIES,spawnAnimal,updateWildlife,hitAnimal,killAnimal,carcassNear,butcher,spook,mesaAt,mesasNear,insideMesa,mesaR,MESA_CELL,exportSaveText,parseSaveText,importSaveText,saveFileName,downloadSave,buildOverlayTest:c=>buildOverlay(c),T,terrainAt,terrainRaw,blockedAt,heightAt,slopeFactor,buildTerrain,HERO_CAP,invMove,canFill,setFill,canSpace,salvageTarget,strippable,doSiphon,doStrip,siphonPanel,stripPanel,wreckState,nearestWreck,CAN_CAP,resumeSave,savePanel,loadPanel,canSaveNow,markerDialog,markerSave,markerAction,markerClose,get mapDrop(){return mapDrop;},get mapMarker(){return mapMarker;},combatTarget,heroDriveShoot,openTrade,closeTrade,tradeClick,renderTrade,doDeal,tradeTotals,traderStock,servicesFor,priceMods,buyPrice,sellPrice,VALUE,RECIPES,craft,canCraft,atWorkbench,UPGRADES,upMods,fitUpgrade,hasUp,get trade(){return trade;},bounceTest:(c,nx,ny)=>bounce(c,nx,ny),carPairTest:(a,b)=>carPair(a,b),darkness,rep,repTier,changeRep,townHostile,townRefuses,assault,hostileGuards,COMPANIONS,FACTIONS,recruit,compLeave,hurtComp,reviveComp,updateComp,compTick,amendsOptions,headlightsOn,TEST_MODE,toolsPanel,teleportPanel,panel:()=>panelCfg,heroAttack,heroWeapon,canSee,losClear,syncFoes,spawnLooseFoe,makeFoe,WEAPONS,hitFoe,get talk(){return talk;},nearestNPC,syncNPCs,QCOL,DLG,bInside,genLoot,ITEMS,LOOT,invWeight,boxItems,nearestBox,fmtClock,openMap,closeMap,mapTap,mapView,saveData,SETTINGS,
  roads,LOCS,START,ZONES,CARS,ROADCLS,roadInfo,routePath,zoneAt,landValue,waterAt,keys,touch,stick,makeCar,makeRaider,enterCar,exitCar,getActions,heroCar,body,nearestCar,syncCars,chunks,getChunk,w2s};
newGame();titleScreen();
if(!window.__TEST)requestAnimationFrame(frame);
