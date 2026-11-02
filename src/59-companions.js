/* ===== companions: one at a time, on foot or riding shotgun ===== */
function compActive(){return G.comp&&!G.comp.gone;}
function compOnFoot(){return compActive()&&!G.comp.inCar&&G.comp.state!=='down';}
function makeComp(k,x,y,o){const C=COMPANIONS[k];
  return {kind:'comp',type:k,def:{id:'comp_'+k,name:C.name,role:'companion',seed:900+Object.keys(COMPANIONS).indexOf(k)*13},C,home:C.home,
    x,y,vx:0,vy:0,a:0,r:8,hp:100,maxHp:100,state:'follow',inCar:false,cd:0,wind:0,walk:0,speed:0,stuck:0,flash:0,ammo:k==='gunhand'?24:0,
    abilityT:0,fedDay:Math.floor((G.clock-6*60)/DAY),missed:0,downT:0,look:npcLook(900+Object.keys(COMPANIONS).indexOf(k)*13),loc:LOCS[C.home]};}
function recruit(n){const k=n.def.comp;G.comp=makeComp(k,n.x,n.y);G.flags['recruited_'+n.def.id]=true;G.npcGone.add(n.def.id);G.npcs=G.npcs.filter(p=>p!==n);
  showMsg(COMPANIONS[k].name+' joins you',2.4);}
function compLeave(reason){const c=G.comp;if(!c)return;const nm=c.def.name;
  if(reason==='dead'){G.flags['dead_c_'+c.type]=true;showMsg(nm+' is dead',3);}
  else{delete G.flags['recruited_c_'+c.type];G.npcGone.delete('c_'+c.type);showMsg(reason==='hungry'?nm+' has had enough of going hungry and walks off':nm+' heads back to '+LOCS[c.home].name,3);}
  G.comp=null;}
function hurtComp(n){const c=G.comp;if(!c||c.state==='down'||n<=0)return;c.hp-=n;c.flash=1;
  if(c.hp<=0){c.hp=0;c.state='down';c.downT=60;c.inCar=false;showMsg(c.def.name+' is down! Help them up within a minute',2.6);}}
function reviveComp(){const c=G.comp,h=G.hero;const k=h.inv.medkit?'medkit':h.inv.bandage?'bandage':null;if(!c||c.state!=='down'||!k)return;
  invTake(h.inv,k,1);c.state='follow';c.hp=k==='medkit'?70:40;SFX.pick();showMsg(c.def.name+' is back on their feet',2);}
// the nearest raider worth fighting: one that's onto you, or any when you've started a fight
function compTarget(c){const h=G.hero;let best=null,bd=c.type==='gunhand'?420:320;
  for(const f of G.foes){if(f.dead)continue;const d=Math.hypot(f.x-c.x,f.y-c.y);if(d>bd)continue;
    if(f.state!=='alert'&&!(G.fightT>0)&&(h.crouch||d>140))continue;   // when you're sneaking, they hold back
    if(!losClear(c.x,c.y,f.x,f.y))continue;bd=d;best=f;}return best;}
function updateComp(dt){const c=G.comp;if(!c)return;const h=G.hero,car=heroCar();c.cd-=dt;c.abilityT-=dt;c.flash=Math.max(0,c.flash-dt*5);
  if(c.state==='down'){c.downT-=dt;c.speed=0;if(c.downT<=0)compLeave('dead');return;}
  // getting in and out of the car with you
  if(car&&!c.inCar&&c.state==='follow'){const d=Math.hypot(car.x-c.x,car.y-c.y);if(d<500&&car.speed<40){c.inCar=true;popText(car.x,car.y-30,c.def.name+' hops in','#efe2c4');}}
  if(c.inCar){if(!car){const lc=carById(G.lastCar)||{x:h.x,y:h.y,a:h.a};c.inCar=false;c.x=lc.x+Math.sin(lc.a)*(lc.def?lc.def.wid/2+16:24);c.y=lc.y-Math.cos(lc.a)*(lc.def?lc.def.wid/2+16:24);collideBuildings(c);return;}
    c.x=car.x;c.y=car.y;
    // Tex leans out of the window at raider cars alongside
    if(c.type==='gunhand'&&c.ammo>0&&c.cd<=0){let tg=null,bd=280;for(const e of G.cars){if(e.driver!=='raider'||e.wipe>0)continue;const d=Math.hypot(e.x-car.x,e.y-car.y);if(d<bd){bd=d;tg=e;}}
      if(tg){c.cd=rand(1.3,1.9);c.ammo--;fireWeapon({kind:'comp',x:car.x,y:car.y},WEAPONS.revolver,Math.atan2(tg.y-car.y,tg.x-car.x),0.12,bd,tg.r);}}
    return;}
  if(!car&&c.state==='follow'&&Math.hypot(h.x-c.x,h.y-c.y)>2500){c.x=h.x-30;c.y=h.y+30;}   // catch up if you got far ahead
  const tg=compTarget(c),W=c.type==='gunhand'&&c.ammo>0?WEAPONS.revolver:WEAPONS.bat;
  if(tg){const dx=tg.x-c.x,dy=tg.y-c.y,d=Math.hypot(dx,dy);
    if(W.gun){if(d>W.range*0.5)foeMove(c,tg.x,tg.y,FOE_SPEED.run,dt);else{c.speed=0;c.a=Math.atan2(dy,dx);}
      if(c.cd<=0&&d<W.range){c.a=Math.atan2(dy,dx);c.ammo--;fireWeapon(c,W,c.a,0.06,d,tg.r);c.cd=1.1+rand(0,0.4);}}
    else if(c.wind>0){c.wind-=dt;c.speed=0;c.a=Math.atan2(dy,dx);if(c.wind<=0){c.cd=0.9;if(d<W.range+tg.r+10){hitFoe(tg,13,dx/d,dy/d,90);SFX.punch();}}}
    else if(d>W.range+tg.r-2)foeMove(c,tg.x,tg.y,FOE_SPEED.run,dt);else{c.speed=0;if(c.cd<=0)c.wind=0.28;}
    return;}
  if(c.state==='wait'){c.speed=0;return;}
  const tgt=car||h,dd=Math.hypot(tgt.x-c.x,tgt.y-c.y);
  // keep close: break into a run early, and run a shade faster than you so they never fall behind
  if(dd>48){const bx=tgt.x-Math.cos(h.a)*30,by=tgt.y-Math.sin(h.a)*30;foeMove(c,bx,by,dd>85||car?FOE_SPEED.run*1.05:h.crouch?28:60,dt);}else c.speed=0;
  if(G.fightT<=0&&c.hp<c.maxHp)c.hp=Math.min(c.maxHp,c.hp+dt*0.2);
}
// skills, and the daily drink and meal
function compTick(){const c=G.comp;if(!c||c.state==='down')return;const h=G.hero,car=heroCar()||carById(G.lastCar);
  const day=Math.floor((G.clock-6*60)/DAY);
  if(day>c.fedDay){c.fedDay=day;const take=use=>{for(const inv of [h.inv,car&&car.items])if(inv){const k=bestOf(inv,use);if(k){invTake(inv,k,1);return true;}}return false;};
    const ok=take('drink')&take('eat');if(ok){c.missed=0;showMsg(c.def.name+' has a drink and a bite from your supplies',2.2);}
    else{c.missed++;if(c.missed>=2)return compLeave('hungry');showMsg(c.def.name+' goes without today. They won’t put up with that for long',2.6);}}
  if(c.abilityT>0||G.fightT>0)return;
  if(c.type==='medic'&&h.hp<55&&Math.hypot(h.x-c.x,h.y-c.y)<200){h.hp=Math.min(100,h.hp+25);c.abilityT=90;popText(h.x,h.y-30,c.def.name+' patches you up','#b9d27a');}
  if(c.type==='mechanic'&&car&&car.speed<5&&Math.hypot(car.x-c.x,car.y-c.y)<300){const parts=['cond','engine','tyres','susp'].sort((a,b)=>car[a]-car[b]),p=parts[0];
    if(car[p]<80){addPart(car,p,15);car.touched=true;c.abilityT=180;popText(car.x,car.y-30,c.def.name+' fixes the '+PARTS[p].toLowerCase(),'#efe2c4');}}
  if(c.type==='scrounger'&&Math.random()<0.004){const k=Math.random()<0.5?'water':'jerky';if(invWeight(h.inv)+ITEMS[k].kg<=HERO_CAP){invAdd(h.inv,k,1);c.abilityT=240;popText(h.x,h.y-30,c.def.name+' found '+ITEMS[k].name.toLowerCase(),'#f2a03d');}}
}
