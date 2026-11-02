/* ===== wildlife: snakes, rabbits, dingoes and kangaroos =====
   Sparse. They appear in the open country around you (ahead of you when you're driving) and fade out behind.
   Snakes and dingoes come at you if you get too close; rabbits and kangaroos run, but you can sneak up on them.
   Hit a kangaroo on the road and it hurts the car. Anything you kill can be butchered for meat. */
Object.assign(ITEMS,{
  snakemeat:{name:'Snake meat',kg:0.3,use:'eat',val:16,icon:'#9a8a5a'},
  rabbitmeat:{name:'Rabbit meat',kg:0.6,use:'eat',val:22,icon:'#b06a50'},
  dingomeat:{name:'Dingo meat',kg:0.9,use:'eat',val:24,icon:'#a0522d'},
  roomeat:{name:'Roo meat',kg:1.5,use:'eat',val:38,icon:'#7a2e22'}});
Object.assign(VALUE,{snakemeat:4,rabbitmeat:5,dingomeat:5,roomeat:9});
const SPECIES={
  snake:{name:'snake',r:9,hp:14,speed:34,meat:'snakemeat',meatN:1,bite:11,biteCd:1.4,reach:32,notice:70,leash:150},
  rabbit:{name:'rabbit',r:7,hp:6,speed:165,meat:'rabbitmeat',meatN:1,notice:170,sneak:60,carSpook:240},
  dingo:{name:'dingo',r:12,hp:46,speed:150,meat:'dingomeat',meatN:1,bite:13,biteCd:0.85,reach:30,notice:210,sneakNotice:120,giveUp:430},
  roo:{name:'kangaroo',r:15,hp:40,speed:175,meat:'roomeat',meatN:2,notice:210,sneak:85,carSpook:300,carDmg:true}};
// which animals each kind of country has, and how many
const WILD_MIX={mallee:{roo:5,rabbit:4,dingo:1,snake:1},coast:{roo:4,rabbit:4,snake:1},red:{snake:3,dingo:3,rabbit:2,roo:1},ranges:{roo:4,dingo:3,snake:2,rabbit:1},salt:{snake:1}};
const WILD_RATE={mallee:1,coast:0.9,red:0.75,ranges:0.9,salt:0.15};
const WILD_MAX=12;
function wildPick(mix,r){let tot=0;for(const k in mix)tot+=mix[k];let v=r*tot;for(const k in mix){v-=mix[k];if(v<=0)return k;}return Object.keys(mix)[0];}
function animalOK(x,y){return landValue(x,y)>0.03&&!blockedAt(x,y)&&!insideMesa(x,y,40)&&!nearLoc(x,y,500)&&!obstacleAt(x,y,16);}
function spawnAnimal(sp,x,y,extra){const S=SPECIES[sp];const a=Object.assign({kind:'animal',sp,S,x,y,vx:0,vy:0,a:Math.random()*TAU,r:S.r,hp:S.hp,maxHp:S.hp,state:'idle',t:rand(1,4),home:{x,y},cd:0,hop:Math.random()*TAU,flash:0},extra||{});G.animals.push(a);return a;}
function updateWildlife(dt){if(!G.animals)G.animals=[];const b=body(),car=heroCar();
  // spawning: now and then, out of sight, mostly ahead of you if you're moving fast
  G.wildT=(G.wildT??rand(3,6))-dt;
  if(G.wildT<=0){G.wildT=rand(7,13);const z=zoneAt(b.x,b.y).biome,hr=hourNow(),dusk=(hr>=4.5&&hr<8)||(hr>=17&&hr<20.5);
    if(G.animals.filter(a=>a.state!=='dead').length<WILD_MAX&&Math.random()<WILD_RATE[z]*0.6){
      const sp=dusk&&Math.random()<0.5&&WILD_MIX[z].roo?'roo':wildPick(WILD_MIX[z],Math.random()),fast=car&&car.speed>120,heading=fast?Math.atan2(car.vy,car.vx):Math.random()*TAU;
      for(let tries=0;tries<12;tries++){const ang=heading+(fast?rand(-0.9,0.9):rand(-Math.PI,Math.PI)),d=fast?rand(1100,1700):rand(650,1100);let x=b.x+Math.cos(ang)*d,y=b.y+Math.sin(ang)*d;
        // kangaroos like the road verges
        if(sp==='roo'&&car&&car.onRoad&&Math.random()<0.6){const ri=roadInfo(x,y);if(ri.r>=0&&ri.d<900){const nx=-ri.ty,ny=ri.tx,side=Math.random()<0.5?-1:1,off=ri.w/2+rand(60,240);
          const R=roads[ri.r];x=R.xs[ri.i]+nx*side*off;y=R.ys[ri.i]+ny*side*off;}}
        if(!animalOK(x,y))continue;
        if(sp==='roo'){const n=2+Math.floor(Math.random()*4),mob={};for(let k=0;k<n;k++){const px=x+rand(-70,70),py=y+rand(-70,70);if(animalOK(px,py))spawnAnimal('roo',px,py,{mob});}}
        else if(sp==='dingo'&&Math.random()<0.35){spawnAnimal('dingo',x,y);if(animalOK(x+40,y+20))spawnAnimal('dingo',x+40,y+20);}
        else spawnAnimal(sp,x,y);break;}}}
  // noises (gunshots, crashes) scare off the timid ones
  for(const a of G.animals){if(a.state==='dead'||!(a.S.notice&&a.S.carSpook))continue;for(const n of G.noises)if(n.r>200&&Math.hypot(n.x-a.x,n.y-a.y)<n.r*1.6)spook(a,n.x,n.y);}
  for(const a of G.animals)updateAnimal(a,dt,b,car);
  // fade out what's far behind, and carcasses after a while
  G.animals=G.animals.filter(a=>Math.hypot(a.x-b.x,a.y-b.y)<2800&&!(a.state==='dead'&&(a.rot+=dt)>600));}
// a frightened grazer bolts away; the rest of its mob goes with it
function spook(a,fx,fy){if(a.state==='flee'||a.state==='dead')return;const away=Math.atan2(a.y-fy,a.x-fx);a.state='flee';a.t=rand(2.5,4.5);a.fleeA=away+rand(-0.7,0.7);
  if(a.mob)for(const o of G.animals)if(o!==a&&o.mob===a.mob&&o.state!=='dead'&&Math.hypot(o.x-a.x,o.y-a.y)<320)spook(o,fx,fy);}
function updateAnimal(a,dt,b,car){a.flash=Math.max(0,a.flash-dt*4);if(a.state==='dead'){a.vx*=0.9;a.vy*=0.9;a.x+=a.vx*dt;a.y+=a.vy*dt;return;}
  const S=a.S,h=G.hero,onFoot=!h.inCar,dx=h.x-a.x,dy=h.y-a.y,d=Math.hypot(dx,dy);a.cd-=dt;a.t-=dt;let sp=0,dir=a.a;
  if(a.sp==='rabbit'||a.sp==='roo'){
    // how close you can get before they bolt: much closer if you crouch, closer still if you're barely moving
    const still=h.speed<12,notice=h.crouch?S.sneak*(still?0.7:1):S.notice;
    if(a.state!=='flee'){if(onFoot&&d<notice)spook(a,h.x,h.y);
      for(const c of G.cars)if(c.driver&&c.speed>60&&Math.hypot(c.x-a.x,c.y-a.y)<S.carSpook){
        // on the road a car's headlong rush sends them sideways, sometimes right across its path
        if(c.onRoad&&Math.random()<0.5){const ri=roadInfo(a.x,a.y);if(ri.r>=0){const side=(a.x-roads[ri.r].xs[ri.i])*-ri.ty+(a.y-roads[ri.r].ys[ri.i])*ri.tx;spook(a,a.x+ri.ty*Math.sign(side||1)*50,a.y-ri.tx*Math.sign(side||1)*50);break;}}
        spook(a,c.x,c.y);break;}}
    if(a.state==='flee'){sp=S.speed;dir=a.fleeA+(a.sp==='rabbit'?Math.sin(G.time*9+a.hop)*0.6:0);if(a.t<=0)a.state='idle';}
    else{if(a.t<=0){a.state=a.state==='idle'?'wander':'idle';a.t=a.state==='idle'?rand(2,6):rand(1,3);a.a=Math.random()*TAU;}if(a.state==='wander'){sp=a.sp==='roo'?40:30;dir=a.a;}}}
  else if(a.sp==='snake'){
    const fromHome=Math.hypot(a.x-a.home.x,a.y-a.home.y);
    if(onFoot&&d<S.notice&&fromHome<S.leash){a.state='attack';G.fightT=Math.max(G.fightT,3);}else if(a.state==='attack')a.state='return';
    if(a.state==='attack'){dir=Math.atan2(dy,dx);if(d>S.reach)sp=S.speed;else if(a.cd<=0){a.cd=S.biteCd;bite(a);}}
    else if(a.state==='return'){dir=Math.atan2(a.home.y-a.y,a.home.x-a.x);sp=S.speed*0.6;if(fromHome<10)a.state='idle';}}
  else if(a.sp==='dingo'){
    const notice=h.crouch?S.sneakNotice:S.notice;
    if(a.state!=='flee'&&a.state!=='chase'&&onFoot&&d<notice){a.state='chase';G.fightT=Math.max(G.fightT,5);}
    if(a.state==='chase'){if(!onFoot||d>S.giveUp){a.state='idle';a.t=rand(2,5);}
      else if(a.hp<a.maxHp*0.2){a.state='flee';a.t=rand(4,7);a.fleeA=Math.atan2(-dy,-dx);}
      else{dir=Math.atan2(dy,dx);G.fightT=Math.max(G.fightT,3);if(d>S.reach)sp=S.speed;else if(a.cd<=0){a.cd=S.biteCd;bite(a);}}}
    else if(a.state==='flee'){sp=S.speed;dir=a.fleeA;if(a.t<=0){a.state='idle';a.t=3;}}
    else if(a.t<=0){a.state=a.state==='idle'?'wander':'idle';a.t=rand(2,5);a.a=Math.random()*TAU;}else if(a.state==='wander'){sp=35;dir=a.a;}}
  sp*=slopeFactor(a.x,a.y,Math.cos(dir),Math.sin(dir),false);
  a.vx+=(Math.cos(dir)*sp-a.vx)*Math.min(1,dt*6);a.vy+=(Math.sin(dir)*sp-a.vy)*Math.min(1,dt*6);
  if(Math.hypot(a.vx,a.vy)>5)a.a=Math.atan2(a.vy,a.vx);a.x+=a.vx*dt;a.y+=a.vy*dt;a.hop+=Math.hypot(a.vx,a.vy)*dt*0.06;
  collideWorld(a);if(nearLoc(a.x,a.y,300)){a.fleeA=(a.fleeA||0)+Math.PI;}   // they don't go into towns
  // you on foot: they can't walk through you
  if(onFoot&&d<a.r+h.r&&d>0){const p=(a.r+h.r-d)/2;a.x-=dx/d*p;a.y-=dy/d*p;}
  // cars: hitting an animal
  for(const c of G.cars){if(c.wrecked)continue;const cd=Math.hypot(c.x-a.x,c.y-a.y);if(cd>c.r+a.r)continue;
    if(c.speed>45){killAnimal(a,c.vx*0.5,c.vy*0.5,'road');
      if(S.carDmg){const dmg=Math.min(18,c.speed*0.03)/c.def.armor/upMods(c).armor;c.cond=Math.max(0,c.cond-dmg);if(Math.random()<0.4)c.engine=Math.max(0,c.engine-dmg*0.6);c.flash=1;c.stagger=0.3;
        if(c===car){showMsg('Hit a kangaroo!',1.6);SFX.hit&&SFX.hit();}popText(a.x,a.y-24,'- '+Math.round(dmg)+'% body','#ff9a7a');}
      else if(a.sp==='dingo'&&c===car)c.cond=Math.max(0,c.cond-1.5);}
    else{const nx=(a.x-c.x)/(cd||1),ny=(a.y-c.y)/(cd||1);a.x=c.x+nx*(c.r+a.r);a.y=c.y+ny*(c.r+a.r);}
    break;}}
function bite(a){const h=G.hero;hurtHero(a.S.bite,a.sp);popText(h.x,h.y-28,'- '+a.S.bite,'#ff5a3a');sparks(h.x,h.y,2);SFX.punch&&SFX.punch();
  if(a.sp==='snake')showMsg('Snake bite!',1.2);}
function hitAnimal(a,dmg,kx,ky){if(a.state==='dead')return;a.hp-=dmg;a.flash=1;a.vx+=kx*90;a.vy+=ky*90;
  if(a.hp<=0)return killAnimal(a,kx*60,ky*60);
  if(a.sp==='rabbit'||a.sp==='roo')spook(a,a.x-kx*40,a.y-ky*40);else if(a.sp==='dingo'&&a.state!=='flee')a.state='chase';else if(a.sp==='snake')a.state='attack';}
function killAnimal(a,vx,vy,how){a.state='dead';a.hp=0;a.vx=vx||0;a.vy=vy||0;a.rot=0;a.how=how||'kill';a.butchered=false;
  if(a.mob)for(const o of G.animals)if(o!==a&&o.mob===a.mob)spook(o,a.x,a.y);}
function carcassNear(r){const h=G.hero;let best=null,bd=r;for(const a of G.animals||[]){if(a.state!=='dead'||a.butchered)continue;const d=Math.hypot(a.x-h.x,a.y-h.y);if(d<bd){bd=d;best=a;}}return best;}
function butcher(a){if(!a||a.butchered)return;a.butchered=true;G.clock+=a.sp==='roo'?20:10;giveItem(a.S.meat,a.S.meatN);SFX.pick();
  showMsg('Butchered the '+a.S.name+': '+(a.S.meatN>1?a.S.meatN+' × ':'')+ITEMS[a.S.meat].name.toLowerCase(),2.2);}
