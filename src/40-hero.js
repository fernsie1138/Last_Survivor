/* ===== hero: walking, getting in and out of cars, simple carried items ===== */
function carById(id){if(!id)return null;for(const c of G.cars)if(c.id===id)return c;return null;}
function heroCar(){return carById(G.hero.inCar);}
function body(){return heroCar()||G.hero;}
function nearestCar(extra){const h=G.hero;let best=null,bd=1e9;
  for(const c of G.cars){if(c.wrecked||c.driver==='raider'||c.dead)continue;const d=Math.hypot(c.x-h.x,c.y-h.y)-c.r;if(d<extra&&d<bd){bd=d;best=c;}}
  return best;}
// getting in or out is ignored for half a second after the last switch, so one tap can never put you in and straight back out
function swapLocked(){return G.time-(G.swapT??-9)<0.5;}
function enterCar(c){const h=G.hero;if(!c||c.wrecked||c.driver||swapLocked())return;G.swapT=G.time;
  if(c.speed>60){showMsg('It’s still rolling',1.2);return;}
  h.inCar=c.id;h.crouch=false;c.driver='hero';c.touched=true;c.sleep=0;G.lastCar=c.id;h.vx=h.vy=0;endStick();
  SFX.door();showMsg(c.def.name,1.6);document.body.classList.remove('onfoot');}
function exitCar(force){const c=heroCar(),h=G.hero;if(!c)return;if(!force&&swapLocked())return;
  if(!force&&c.speed>70){showMsg('Slow down to get out',1.2);return;}G.swapT=G.time;
  // driver's door is on the right: these are Australian cars
  const rx=-Math.sin(c.a),ry=Math.cos(c.a),off=c.def.wid/2+h.r+5;
  let placed=false;
  for(const s of [1,-1,0]){const x=s?c.x+rx*s*off:c.x-Math.cos(c.a)*(c.r+h.r+5),y=s?c.y+ry*s*off:c.y-Math.sin(c.a)*(c.r+h.r+5);
    c.driver=null;const blocked=obstacleAt(x,y,h.r);
    if(!blocked||s===0){h.x=x;h.y=y;placed=true;break;}}
  h.a=c.a;h.vx=c.vx*0.3;h.vy=c.vy*0.3;h.inCar=null;c.driver=null;c.sleep=0;endStick();
  SFX.door();document.body.classList.add('onfoot');
}
function hurtHero(n,src){if(n<=0||G.god)return;if(window.__dmg)window.__dmg[src||'?']=(window.__dmg[src||'?']||0)+n;
  const h=G.hero;h.hp-=n;h.flash=1;G.hurt=Math.min(1,G.hurt+n/25);G.shake=Math.max(G.shake,Math.min(16,3+n*0.5));}
function updateHeroOnFoot(dt,inp){
  // walking pace is deliberately unhurried
  const h=G.hero,sp=h.crouch?28:inp.sprint?100:58,k=Math.min(1,dt*10);h.atkCd-=dt;h.swing=Math.max(0,h.swing-dt);   // cooldowns run on foot; driveHero runs them in the car
  const sf=slopeFactor(h.x,h.y,inp.mx,inp.my,false)*(terrainAt(h.x,h.y)===T.DRY?0.85:1);   // climbing is slow going, and so is soft sand
  h.vx+=(inp.mx*sp*sf-h.vx)*k;h.vy+=(inp.my*sp*sf-h.vy)*k;
  h.x+=h.vx*dt;h.y+=h.vy*dt;h.speed=Math.hypot(h.vx,h.vy);
  if(h.speed>6)h.walk+=h.speed*dt*0.12;
  // in a fight, keep facing the nearest raider in reach while you move in any direction; otherwise face where you're going
  const lock=combatTarget();h.faceLock=Math.max(0,(h.faceLock||0)-dt);
  if(lock)h.a+=angDiff(Math.atan2(lock.y-h.y,lock.x-h.x),h.a)*Math.min(1,dt*14);
  else if(h.speed>6&&h.faceLock<=0)h.a=Math.atan2(h.vy,h.vx);
  collideWorld(h);h.ri=roadInfo(h.x,h.y);h.flash=Math.max(0,h.flash-dt*5);
  if(h.speed>12&&!h.crouch)addNoise(h.x,h.y,h.speed>75?230:70);   // sneaking is silent, running is loud
}
// cars against a person on foot: parked cars block you, moving cars run you down
function heroVsCars(){const h=G.hero;
  for(const c of G.cars){if(c.dead)continue;const dx=h.x-c.x,dy=h.y-c.y,d=Math.hypot(dx,dy),min=c.r+h.r;
    if(d>=min||d<1e-4)continue;const nx=dx/d,ny=dy/d;h.x=c.x+nx*min;h.y=c.y+ny*min;
    const rel=c.vx*nx+c.vy*ny;  // only the car's own motion toward you hurts
    if(rel>90){hurtHero((rel-70)*0.22,c.driver==='raider'?'runover':'car');h.vx=nx*rel*1.1;h.vy=ny*rel*1.1;
      c.vx*=0.85;c.vy*=0.85;sparks(h.x,h.y,4);SFX.hit(0.45);}}
}
// ---- survival ----
function hasTool(car){return !!(G.hero.inv.toolkit||(car&&car.items.toolkit));}
// use one of an item from an inventory; car is the vehicle it applies to (if any)
function useItem(k,inv,car){const it=ITEMS[k],h=G.hero;if(!it||!inv[k])return false;
  if(it.use==='drink'){if(h.water>=99)return say('You’re not thirsty');h.water=Math.min(100,h.water+it.val);SFX.slosh();}
  else if(it.use==='eat'){if(h.food>=99)return say('You’re not hungry');h.food=Math.min(100,h.food+it.val);SFX.pick();}
  else if(it.use==='heal'){if(h.hp>=99)return say('You’re not hurt');h.hp=Math.min(100,h.hp+it.val);SFX.pick();}
  else if(it.use==='fuel'){if(!car)return say('No car to pour it into');const f=canFill(inv);if(f<=0.05)return say('Your jerry cans are empty');if(car.fuel>=99)return say('The tank is full');
    const amt=Math.min(f,100-car.fuel);car.fuel+=amt;setFill(inv,f-amt);car.touched=true;SFX.slosh();popText(car.x,car.y-30,'+ '+Math.round(amt)+'% fuel','#f2a03d');return true;}   // the cans stay with you, emptier
  else if(it.use==='upgrade'){if(!car)return say('No car to fit it to');if(hasUp(car,it.up))return say('That’s already fitted');if(!hasTool(car))return say('You need a toolkit to fit it');
    const old=Object.keys(car.ups||{}).find(k=>UPGRADES[k].slot===UPGRADES[it.up].slot);fitUpgrade(car,it.up);SFX.clank();showMsg(UPGRADES[it.up].name+' fitted'+(old?', replacing the '+UPGRADES[old].name.toLowerCase():''),2.2);}
  else if(it.use==='repair'){if(!car)return say('No car to fix');
    if(it.part==='tyres'){if(Math.min(...car.tw)>=it.val-1)return say('Your tyres are better than that one');const which=fitSpare(car,it.val);car.touched=true;SFX.clank();showMsg('Spare fitted on the '+which,1.8);}
    else{if(car[it.part]>=99)return say(PARTS[it.part]+' already in good shape');
      if(it.needs&&!hasTool(car))return say('You need a toolkit for that');const was=car[it.part];car[it.part]=Math.min(100,car[it.part]+it.val);car.touched=true;SFX.clank();
      if(was<=0&&(it.part==='engine'||it.part==='cond'))showMsg(it.part==='engine'?'The engine coughs back to life':'Patched up enough to run again',2);}}
  else return false;
  invTake(inv,k,1);return true;}
function say(t){showMsg(t,1.4);return false;}
function bestOf(inv,use){let best=null;for(const k in inv)if(ITEMS[k].use===use&&(!best||ITEMS[k].val>ITEMS[best].val))best=k;return best;}
// eat or drink whatever is to hand: your pockets first, then the boot of the car you're in
function quickUse(use){const car=heroCar();for(const inv of [G.hero.inv,car&&car.items])if(inv){const k=bestOf(inv,use);if(k){useItem(k,inv,car);popText(body().x,body().y-30,'− '+ITEMS[k].name,'#efe2c4');return;}}}
function nearestBox(r){const h=G.hero;let best=null,bd=r;for(const b of G.boxes){const d=Math.hypot(b.x-h.x,b.y-h.y);if(d<bd){bd=d;best=b;}}return best;}
function pourFuel(c){useItem('jerrycan',G.hero.inv,c);}
function patchCar(c){if(useItem('scrap',G.hero.inv,c))popText(c.x,c.y-30,'+ repairs','#efe2c4');}
function anyFood(){const c=heroCar();return bestOf(G.hero.inv,'eat')||(c&&bestOf(c.items,'eat'));}
function anyDrink(){const c=heroCar();return bestOf(G.hero.inv,'drink')||(c&&bestOf(c.items,'drink'));}
// what the action buttons should offer right now
function getActions(){
  const car=heroCar(),h=G.hero,acts=[];
  if(car){acts.push({k:'E',label:'Get out',fn:()=>exitCar()});
    if(car.speed<15&&h.rest<80)acts.push({k:'Z',label:'Sleep',alt:true,fn:()=>sleepPanel(car)});}
  else{const c=nearestCar(40),b=nearestBox(48);
    if(c){acts.push({k:'E',label:'Get in',fn:()=>enterCar(c)});acts.push({k:'F',label:'Open boot',alt:true,fn:()=>openInv({kind:'car',car:c})});
      if(canFill(h.inv)>0.5&&c.fuel<99)acts.push({k:'R',label:'Pour fuel ('+Math.round(canFill(h.inv))+'%)',alt:true,fn:()=>pourFuel(c)});
      if(h.inv.scrap&&c.cond<99)acts.push({k:'T',label:'Patch up',alt:true,fn:()=>patchCar(c)});}
    else if(b)acts.push({k:'F',label:boxItems(b)&&invCount(b.items)?'Search':'Search (empty)',fn:()=>openInv({kind:'box',box:b})});
    const cc=carcassNear(36);if(cc)acts.push({k:'U',label:'Butcher the '+cc.S.name,fn:()=>butcher(cc)});
    const sv=salvageTarget();if(sv){acts.push({k:'J',label:'Siphon fuel',alt:true,fn:()=>siphonPanel(sv)});acts.push({k:'K',label:'Strip parts',alt:true,fn:()=>stripPanel(sv)});}
    const n=nearestNPC(46),cp=compActive()&&!G.comp.inCar?G.comp:null,cpd=cp?Math.hypot(cp.x-h.x,cp.y-h.y):1e9;
    if(cp&&cp.state==='down'&&cpd<50)acts.unshift({k:'H',label:(h.inv.medkit||h.inv.bandage)?'Help '+cp.def.name+' up':'Help '+cp.def.name+' up (needs a bandage)',fn:()=>{if(h.inv.medkit||h.inv.bandage)reviveComp();else say('You need a bandage or a first-aid kit');}});
    else if(cp&&cpd<46&&(!n||cpd<Math.hypot(n.x-h.x,n.y-h.y)))acts.push({k:'X',label:'Talk to '+cp.def.name,alt:!!c,fn:()=>startTalk(cp)});
    else if(n&&!c)acts.unshift({k:'X',label:'Talk to '+n.def.name,fn:()=>startTalk(n)});else if(n)acts.push({k:'X',label:'Talk to '+n.def.name,alt:true,fn:()=>startTalk(n)});}
  if(h.water<60&&anyDrink())acts.push({k:'Q',label:'Drink',alt:true,fn:()=>quickUse('drink')});
  if(h.food<60&&anyFood())acts.push({k:'C',label:'Eat',alt:true,fn:()=>quickUse('eat')});
  return acts;
}
// loose items on the ground: walk over them to pick them up, if you can carry them
function collectPickups(){const h=G.hero;
  for(const k of G.pickups){if(k.dead)continue;if(Math.hypot(k.x-h.x,k.y-h.y)>h.r+18)continue;
    const it=ITEMS[k.item];if(invWeight(h.inv)+it.kg>HERO_CAP+1e-6){if(!k.warned){k.warned=true;showMsg('Too heavy to carry: '+it.name,1.8);}continue;}
    invAdd(h.inv,k.item,1);popText(k.x,k.y,'+ '+it.name,'#f2a03d');k.dead=true;if(k.id)G.removed.add(k.id);SFX.pick();}
}
