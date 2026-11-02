/* ===== combat and stealth: raiders on foot, weapons, noise, vision ===== */
const FOE_SPEED={walk:23,run:105};   // a running raider is a shade faster than a running survivor: you can't just outrun them
function isNight(){const h=hourNow();return h<6||h>=20;}
function addNoise(x,y,r){if(r>0)G.noises.push({x,y,r});}
function heroWeapon(){const h=G.hero,k=h.weapon;return k&&h.inv[k]&&ITEMS[k].weapon?WEAPONS[ITEMS[k].weapon]:WEAPONS.fists;}
function foeLook(seed){const r=rng(seed);return {shirt:['#2b2420','#4a2a1c','#3b3026','#5a3f2a'][Math.floor(r()*4)],skin:['#d9b48c','#c49a6c','#8d5f3c','#e3c09a'][Math.floor(r()*4)],
  hair:r()<0.5?'mohawk':r()<0.5?'bandana':'bald'};}
// ---- spawning: camp raiders come from the world definition; dead ones stay dead ----
function syncFoes(){const b=body(),have=new Set(G.foes.map(f=>f.id));
  for(const o of LOCS){if(!o.foes||Math.hypot(o.x-b.x,o.y-b.y)>2300)continue;
    for(const d of o.foes)if(!have.has(d.id)&&!G.removed.has(d.id))G.foes.push(makeFoe(d,o,d.post.x,d.post.y));}
  G.foes=G.foes.filter(f=>{const ax=f.loc?f.loc.x:f.x,ay=f.loc?f.loc.y:f.y;return Math.hypot(ax-b.x,ay-b.y)<3400||(f.state==='alert'&&!f.dead);});}
function makeFoe(def,loc,x,y){return {kind:'foe',id:def.id,def,loc,x,y,vx:0,vy:0,a:Math.random()*TAU,r:9,hp:70,maxHp:70,weapon:def.weapon,
  state:'idle',detect:0,cd:rand(0.5,1.5),stun:0,wind:0,wait:rand(0,3),pi:0,target:null,lastSeen:null,searchT:0,walk:0,speed:0,dead:false,deadT:0,flash:0,
  brave:def.brave,look:foeLook(def.seed||(Math.random()*1e6)|0),stuck:0};}
function spawnLooseFoe(x,y,fight){const w=Math.random()<0.12?'revolver':['knife','knife','bat','tyreiron'][Math.floor(Math.random()*4)];
  const f=makeFoe({id:'lf'+(raiderSeq++),weapon:w,brave:false,seed:(Math.random()*1e6)|0,post:{x,y},patrol:[{x,y}]},null,x,y);
  f.hp=f.maxHp=38;f.loose=true;f.stun=1.2;if(fight){f.state='alert';f.detect=1;f.lastSeen={x:body().x,y:body().y};}else f.state='flee';G.foes.push(f);return f;}
// ---- perception ----
// a line is blocked by a building wall (doorways excepted) or a big boulder
function segDist(px,py,x1,y1,x2,y2){const ex=x2-x1,ey=y2-y1,l2=ex*ex+ey*ey||1,t=clamp(((px-x1)*ex+(py-y1)*ey)/l2,0,1);return Math.hypot(x1+ex*t-px,y1+ey*t-py);}
function losClear(x1,y1,x2,y2){const d=Math.hypot(x2-x1,y2-y1),o=nearLoc((x1+x2)/2,(y1+y2)/2,d/2+150);
  const bl=o?o.bld.filter(b=>segDist(b.x,b.y,x1,y1,x2,y2)<Math.hypot(b.w,b.h)/2+8):[];
  const n=Math.ceil(d/7);
  for(let i=1;i<n;i++){const t=i/n,x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;
    for(const b of bl){if(b.tank){if(bInside(b,x,y,0))return false;continue;}
      if(bInside(b,x,y,-4)&&!bInside(b,x,y,4)&&!nearDoor(b,x,y))return false;}   // sampled every 7px, walls are 8px thick
    if(i%2===0){const rk=obstacleAt(x,y,0);if(rk&&rk.r>26)return false;if(insideMesa(x,y)||inShellWall(x,y))return false;}}
  return true;}
function nearDoor(b,x,y){const [lx,ly]=bLocal(b,x,y);return Math.abs(lx)<b.door/2+2&&ly>b.h/2-14;}
function sightRange(t){const h=G.hero,car=t.kind==='car';return (isNight()?150:290)*(car?1.7:h.crouch?0.62:1);}
function canSee(f,t){const dx=t.x-f.x,dy=t.y-f.y,d=Math.hypot(dx,dy);if(d>sightRange(t))return false;
  if(d>15&&Math.abs(angDiff(Math.atan2(dy,dx),f.a))>0.95)return false;   // a cone of about 110 degrees; only bumping into them gives you away
  return losClear(f.x,f.y,t.x,t.y);}
function becomeAlert(f,t,shout){if(f.dead)return;const was=f.state==='alert';G.fightT=8;f.state='alert';f.detect=1;f.lastSeen={x:t.x,y:t.y};
  if(!was&&G.time-(f.shoutT||-99)>5){f.shoutT=G.time;popText(f.x,f.y-50,'!','#c2381f');if(shout!==false){for(const g of G.foes)if(g!==f&&!g.dead&&g.state!=='alert'&&Math.hypot(g.x-f.x,g.y-f.y)<340){g.state='investigate';g.target={x:t.x,y:t.y};g.detect=Math.max(g.detect,0.8);g.searchT=3;}}}}
// ---- movement ----
function foeMove(f,tx,ty,sp,dt){const dx=tx-f.x,dy=ty-f.y,d=Math.hypot(dx,dy);if(d<4){f.speed=0;return true;}
  sp*=slopeFactor(f.x,f.y,dx,dy,false);const ox=f.x,oy=f.y;f.vx=dx/d*sp;f.vy=dy/d*sp;f.x+=f.vx*dt;f.y+=f.vy*dt;f.a+=angDiff(Math.atan2(dy,dx),f.a)*Math.min(1,dt*8);f.walk+=sp*dt*0.13;f.speed=sp;
  collideBuildings(f);collideWorld(f);
  if(Math.hypot(f.x-ox,f.y-oy)<sp*dt*0.3){f.stuck+=dt;if(f.stuck>1.1){f.stuck=0;f.x+=-dy/d*16*(Math.random()<0.5?1:-1);f.y+=dx/d*16;collideBuildings(f);}}else f.stuck=Math.max(0,f.stuck-dt);
  return false;}
// ---- behaviour ----
function updateFoe(f,dt){
  if(f.dead){f.deadT-=dt;return;}
  f.cd-=dt;f.flash=Math.max(0,f.flash-dt*5);
  if(f.stun>0){f.stun-=dt;if(f.wind>0)f.wind-=dt*0.5;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vx*=Math.exp(-6*dt);f.vy*=Math.exp(-6*dt);collideBuildings(f);collideWorld(f);return;}
  const hb=body(),h=G.hero,cp=compOnFoot()?G.comp:null;let t=hb,sees=canSee(f,hb);
  if(cp&&canSee(f,cp)&&(!sees||Math.hypot(cp.x-f.x,cp.y-f.y)<Math.hypot(hb.x-f.x,hb.y-f.y))){t=cp;sees=true;}
  const dx=t.x-f.x,dy=t.y-f.y,d=Math.hypot(dx,dy),W=WEAPONS[f.weapon];
  if(sees){const rate=Math.max(0.25,1.5-d/sightRange(t))*(h.crouch&&!h.inCar?0.5:1)*(f.state==='investigate'||f.state==='search'?1.8:1)*(t.speed>75?1.4:1);
    f.detect=Math.min(1,f.detect+rate*dt*1.3);if(f.detect>=1&&f.state!=='flee')becomeAlert(f,t);if(f.state==='alert')f.lastSeen={x:t.x,y:t.y};}
  else if(f.state!=='alert')f.detect=Math.max(0,f.detect-0.18*dt);
  if(f.state!=='alert'&&f.state!=='flee')for(const n of G.noises){if(Math.hypot(n.x-f.x,n.y-f.y)<n.r){f.state='investigate';f.target={x:n.x,y:n.y};f.detect=Math.max(f.detect,0.45);f.searchT=4;
    if(n.r>600)f.detect=Math.max(f.detect,0.85);break;}}
  if(f.state==='alert'&&f.hp<f.maxHp*0.25&&!f.brave){f.state='flee';popText(f.x,f.y-24,'Bugger this!','#efe2c4');}
  switch(f.state){
    case 'idle':{if(f.wait>0){f.wait-=dt;f.speed=0;f.a+=Math.sin(G.time*0.7+f.x)*dt*0.6;break;}
      const p=f.def.patrol[f.pi%f.def.patrol.length];if(foeMove(f,p.x,p.y,FOE_SPEED.walk,dt)){f.pi++;f.wait=rand(3,8);}break;}
    case 'investigate':{if(foeMove(f,f.target.x,f.target.y,FOE_SPEED.walk*1.3,dt)){f.searchT-=dt;f.a+=dt*1.8;if(f.searchT<=0){f.state='idle';f.detect=Math.min(f.detect,0.5);}}break;}
    case 'search':{if(foeMove(f,f.lastSeen.x,f.lastSeen.y,FOE_SPEED.run*0.8,dt)){f.searchT-=dt;f.a+=dt*2.2;}else f.searchT-=dt*0.3;
      if(f.searchT<=0){f.state='idle';f.detect=0.5;}break;}
    case 'flee':{const ax=f.x-t.x,ay=f.y-t.y,l=Math.hypot(ax,ay)||1;foeMove(f,f.x+ax/l*100,f.y+ay/l*100,FOE_SPEED.run,dt);if(d>1000){f.gone=true;}break;}
    case 'alert':{
      if(!sees&&d>40){f.state='search';f.searchT=7;break;}
      if(t.kind==='car'){ // you're in a car: melee raiders get out of the way, gunners keep shooting
        const toward=(t.vx*-dx+t.vy*-dy)/(d||1);
        if(W.melee){if(toward>80&&d<260){const px=-dy/d,py=dx/d,s=(px*(f.x-t.x+t.vx)+py*(f.y-t.y+t.vy))>0?1:-1;foeMove(f,f.x+px*s*60,f.y+py*s*60,FOE_SPEED.run,dt);}
          else if(d>90)foeMove(f,t.x,t.y,FOE_SPEED.run*0.7,dt);else f.speed=0;break;}}
      if(W.melee){if(f.wind>0){f.wind-=dt;f.speed=0;f.a=Math.atan2(dy,dx);if(f.wind<=0){f.cd=W.cd*1.15;
            if(t.kind!=='car'&&d<W.range+t.r+6){const kx=dx/(d||1),ky=dy/(d||1);if(t.kind==='comp')hurtComp(W.dmg*1.35);else{hurtHero(W.dmg*1.35,'melee');h.vx+=kx*W.knock*0.8;h.vy+=ky*W.knock*0.8;}SFX.punch();sparks(t.x,t.y,4);}}}
        else if(d>W.range+h.r-2)foeMove(f,t.x,t.y,FOE_SPEED.run,dt);
        else{f.speed=0;f.a=Math.atan2(dy,dx);if(f.cd<=0)f.wind=0.3;}}   // a short wind-up you can react to
      else{const want=W.range*0.45;if(d<110)foeMove(f,f.x-dx/d*80,f.y-dy/d*80,FOE_SPEED.walk*1.4,dt);
        else if(d>want)foeMove(f,t.x,t.y,FOE_SPEED.walk*1.4,dt);else{f.speed=0;f.a=Math.atan2(dy,dx);}
        if(f.cd<=0&&d<W.range){f.a=Math.atan2(dy,dx);fireWeapon(f,W,f.a,0.08,d,t.r||20);f.cd=W.cd*1.7+rand(0,0.5);}}
      break;}}
}
// ---- attacks ----
function missChance(W,dist){return clamp(dist/W.range*0.9-0.08,0.03,0.85);}   // point blank: almost always hits; at the edge of range: mostly misses
function fireWeapon(src,W,a,extraSpread,dist,tr){const sx=src.x+Math.cos(a)*14,sy=src.y+Math.sin(a)*14;
  for(let i=0;i<W.pellets;i++){let aa=a+(Math.random()-0.5)*(W.spread+(extraSpread||0))*2;const sp=W.pellets>1?820:1100;
    // a single bullet at a known distance: decide hit or miss, and a miss goes clear of the target
    if(W.pellets===1&&dist>0){if(Math.random()<missChance(W,dist))aa=a+(Math.random()<0.5?-1:1)*(Math.asin(Math.min(1,((tr||10)+10)/dist))+Math.random()*0.08);
      else aa=a+(Math.random()-0.5)*Math.min(W.spread,Math.atan2((tr||10)*0.6,dist))*2;}
    G.bullets.push({x:sx,y:sy,vx:Math.cos(aa)*sp,vy:Math.sin(aa)*sp,life:W.range/sp,dmg:W.dmg,owner:src.kind==='foe'||src.driver==='raider'?'foe':'hero'});}
  part({kind:'fire',x:sx,y:sy,vx:0,vy:0,life:.07,max:.07,size:9,drag:0,col:'#ffe08a'});addNoise(src.x,src.y,W.noise);SFX.gun(W);}
function autoAim(range,arc){const h=G.hero;let best=null,bs=1e9;
  for(const f of G.foes){if(f.dead)continue;const dx=f.x-h.x,dy=f.y-h.y,d=Math.hypot(dx,dy);if(d>range)continue;
    const off=Math.abs(angDiff(Math.atan2(dy,dx),h.a));if(off>arc)continue;if(!losClear(h.x,h.y,f.x,f.y))continue;const s=d+off*200;if(s<bs){bs=s;best=f;}}
  for(const c of G.cars){if(c.driver!=='raider')continue;const dx=c.x-h.x,dy=c.y-h.y,d=Math.hypot(dx,dy);if(d>range)continue;const off=Math.abs(angDiff(Math.atan2(dy,dx),h.a));
    if(off>arc)continue;const s=d+off*200;if(s<bs){bs=s;best=c;}}
  // animals: anything alive (raiders still come first when they're as close)
  for(const a of G.animals){if(a.state==='dead')continue;const dx=a.x-h.x,dy=a.y-h.y,d=Math.hypot(dx,dy);if(d>range)continue;const off=Math.abs(angDiff(Math.atan2(dy,dx),h.a));
    if(off>arc||!losClear(h.x,h.y,a.x,a.y))continue;const s=d+off*200+40;if(s<bs){bs=s;best=a;}}
  return best;}
// the raider you're squaring up to: the nearest live one in reach, in any direction
function combatTarget(){const h=G.hero;if(h.inCar)return null;const W=heroWeapon(),reach=W.gun?Math.min(W.range,360):W.range+70;let best=null,bd=reach;
  if(!(G.fightT>0)&&!G.foes.some(f=>!f.dead&&f.state==='alert'&&Math.hypot(f.x-h.x,f.y-h.y)<reach))return null;
  for(const f of G.foes){if(f.dead||f.state==='flee')continue;const d=Math.hypot(f.x-h.x,f.y-h.y);if(d<bd&&losClear(h.x,h.y,f.x,f.y)){bd=d;best=f;}}
  for(const a of G.animals){if(a.state!=='attack'&&a.state!=='chase')continue;const d=Math.hypot(a.x-h.x,a.y-h.y);if(d<bd){bd=d;best=a;}}   // a snake or dingo coming at you
  return best;}
// shooting from the driver's seat: any raider in range, in any direction, but harder to hit from a moving car
function heroDriveShoot(){const h=G.hero,car=heroCar();if(!car||h.atkCd>0||state!=='play')return;const W=heroWeapon();if(!W.gun)return;
  if(!h.inv[W.ammo]){showMsg('Out of '+ITEMS[W.ammo].name.toLowerCase(),1.2);h.atkCd=0.4;SFX.click();return;}
  let tg=null,bd=W.range*0.85;for(const e of G.cars){if(e.driver!=='raider'||e.wipe>0)continue;const d=Math.hypot(e.x-car.x,e.y-car.y);if(d<bd){bd=d;tg=e;}}
  for(const f of G.foes){if(f.dead)continue;const d=Math.hypot(f.x-car.x,f.y-car.y);if(d<bd&&losClear(car.x,car.y,f.x,f.y)){bd=d;tg=f;}}
  if(!tg){showMsg('Nothing in range',0.9);h.atkCd=0.25;return;}
  const sway=Math.min(1,car.speed/400);invTake(h.inv,W.ammo,1);G.fightT=8;
  fireWeapon({kind:'hero',x:car.x,y:car.y},W,Math.atan2(tg.y-car.y,tg.x-car.x),0.04*sway,bd*(1+0.5*sway),tg.r);h.atkCd=W.cd*1.35;}
function heroAttack(){const h=G.hero;if(h.inCar||h.atkCd>0||state!=='play')return;const W=heroWeapon();G.fightT=8;
  if(W.gun){if(!h.inv[W.ammo]){showMsg('Out of '+ITEMS[W.ammo].name.toLowerCase(),1.2);h.atkCd=0.4;SFX.click();return;}
    const tg=autoAim(W.range,Math.PI);if(tg)h.a=Math.atan2(tg.y-h.y,tg.x-h.x);h.faceLock=0.4;invTake(h.inv,W.ammo,1);fireWeapon(h,W,h.a,0,tg?Math.hypot(tg.x-h.x,tg.y-h.y):undefined,tg?tg.r:0);h.atkCd=W.cd;return;}
  // melee: turn to face the nearest raider in reach, then swing
  const tg=autoAim(W.range+40,Math.PI);if(tg&&(tg.kind==='foe'||tg.kind==='animal'))h.a=Math.atan2(tg.y-h.y,tg.x-h.x);h.faceLock=0.35;
  h.swing=0.2;h.atkCd=W.cd;SFX.swing();let hit=false,quiet=false;
  for(const f of G.foes){if(f.dead)continue;const dx=f.x-h.x,dy=f.y-h.y,d=Math.hypot(dx,dy);
    if(d>W.range+f.r+h.r||Math.abs(angDiff(Math.atan2(dy,dx),h.a))>W.arc/2)continue;
    const unaware=f.state!=='alert'&&!canSee(f,h);
    if(unaware){hitFoe(f,f.hp+1,dx/d,dy/d,W.knock*0.3);popText(f.x,f.y-24,'Takedown','#f2a03d');quiet=true;}
    else hitFoe(f,W.dmg,dx/d,dy/d,W.knock);hit=true;}
  // hitting townsfolk is assault: the town remembers, and its guards come for you
  for(const n of G.npcs){const dx=n.x-h.x,dy=n.y-h.y,d=Math.hypot(dx,dy);if(d<W.range+n.r+h.r&&Math.abs(angDiff(Math.atan2(dy,dx),h.a))<W.arc/2){assault(n);hit=true;}}
  for(const a of G.animals){if(a.state==='dead')continue;const dx=a.x-h.x,dy=a.y-h.y,d=Math.hypot(dx,dy);
    if(d<W.range+a.r+h.r&&Math.abs(angDiff(Math.atan2(dy,dx),h.a))<W.arc/2){hitAnimal(a,W.dmg,dx/(d||1),dy/(d||1));hit=true;}}
  if(hit){SFX.punch();addNoise(h.x,h.y,quiet?40:W.noise);}}
function hitFoe(f,dmg,kx,ky,knock){if(f.dead)return;f.hp-=dmg;f.flash=1;f.stun=f.wind>0?0.05:0.1;f.vx=kx*knock*0.22;f.vy=ky*knock*0.22;sparks(f.x,f.y,3);   // half the shove now raiders move at half pace
  if(f.hp<=0){foeDie(f);return;}if(f.state!=='flee')becomeAlert(f,body());}
function foeDie(f){f.dead=true;f.deadT=40;G.kills++;if(!f.loose)G.removed.add(f.id);if(!f.townGuard)raiderDown();
  // they drop what they carried: their weapon sometimes, ammo, odds and ends
  const items=genLoot('raider',(Math.random()*1e9)|0,1);const wi=Object.keys(ITEMS).find(k=>ITEMS[k].weapon===f.weapon);
  if(wi&&Math.random()<0.6)invAdd(items,wi,1);const W=WEAPONS[f.weapon];if(W.gun)invAdd(items,W.ammo,2+Math.floor(Math.random()*5));
  G.boxes.push({id:'fb'+f.id,kind:'bag',x:f.x+rand(-12,12),y:f.y+rand(-12,12),items,persist:false,transient:true});
  const o=f.loc;if(o&&o.camp&&o.foes.every(d=>G.removed.has(d.id))&&!G.flags['camp_'+o.id]){G.flags['camp_'+o.id]='cleared';showMsg(o.name+': camp cleared',2.6);changeRep('settlers',8);changeRep('fuelkings',4);changeRep('raiders',-10);}}
// ---- bullets ----
function stepBullets(dt){const h=G.hero,hc=heroCar();
  for(const b of G.bullets){if(b.dead)continue;
    for(let s=0;s<2&&!b.dead;s++){b.x+=b.vx*dt/2;b.y+=b.vy*dt/2;b.life-=dt/2;if(b.life<=0){b.dead=true;break;}
      const o=nearLoc(b.x,b.y,50);if(o)for(const bd of o.bld)if(Math.abs(bd.x-b.x)<bd.w&&Math.abs(bd.y-b.y)<bd.w){const [lx,ly]=bLocal(bd,b.x,b.y);
        if(Math.abs(lx)<bd.w/2+3&&Math.abs(ly)<bd.h/2+3&&!(Math.abs(lx)<bd.w/2-4&&Math.abs(ly)<bd.h/2-4)&&!(Math.abs(lx)<bd.door/2&&ly>0)){b.dead=true;sparks(b.x,b.y,3);break;}}
      if(b.dead)break;const rk=obstacleAt(b.x,b.y,0);if(rk){b.dead=true;sparks(b.x,b.y,3);break;}
      if(b.owner==='hero'){for(const f of G.foes){if(f.dead||Math.hypot(f.x-b.x,f.y-b.y)>f.r+3)continue;const l=Math.hypot(b.vx,b.vy);hitFoe(f,b.dmg,b.vx/l,b.vy/l,60);b.dead=true;break;}
        if(!b.dead)for(const n of G.npcs){if(Math.hypot(n.x-b.x,n.y-b.y)<n.r+3){assault(n);b.dead=true;break;}}
        if(!b.dead)for(const a of G.animals){if(a.state==='dead'||Math.hypot(a.x-b.x,a.y-b.y)>a.r+3)continue;const l=Math.hypot(b.vx,b.vy);hitAnimal(a,b.dmg,b.vx/l,b.vy/l);b.dead=true;break;}
        if(!b.dead)for(const c of G.cars){if(c.driver!=='raider'||Math.hypot(c.x-b.x,c.y-b.y)>c.r+2)continue;b.dead=true;sparks(b.x,b.y,4);c.flash=1;
          c.stab-=b.dmg*0.9;if(Math.random()<0.25){c.stab-=40;popText(c.x,c.y-24,'Tyre shot out','#f2a03d');}break;}}
      else{const cp=compOnFoot()?G.comp:null;if(cp&&Math.hypot(cp.x-b.x,cp.y-b.y)<cp.r+3){hurtComp(b.dmg*0.55);b.dead=true;sparks(b.x,b.y,4);}
        else if(!hc&&Math.hypot(h.x-b.x,h.y-b.y)<h.r+3){hurtHero(b.dmg*0.55,'shot');b.dead=true;sparks(b.x,b.y,4);}
        else if(hc&&Math.hypot(hc.x-b.x,hc.y-b.y)<hc.r+2){b.dead=true;sparks(b.x,b.y,4);hc.flash=1;hc.cond-=b.dmg*0.12;SFX.hit(0.25);
          if(Math.random()<0.17)hitTyre(hc,rand(35,60));}}}}
  G.bullets=G.bullets.filter(b=>!b.dead);}
