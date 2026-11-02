const L=require('./harness');
let A=L.flatSpot();   // open, level ground
function arena(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;G.hero.x=A.x;G.hero.y=A.y;L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.syncT=1e9;for(const c of L.chunks.values()){c.rocks=[];c.wrecks=[];}return G;}
function foe(w,x,y,o){const f=L.makeFoe({id:'t'+Math.random(),weapon:w,post:{x,y},patrol:[{x,y}],seed:3,brave:true},null,x,y);Object.assign(f,{loose:true},o||{});L.G.foes.push(f);return f;}
// --- a raider behind you while you walk away: you still turn and hit them
{const G=arena(),h=G.hero;h.inv={bat:1};h.weapon='bat';h.a=0;const f=foe('knife',h.x-40,h.y,{state:'alert',detect:1,lastSeen:{x:h.x,y:h.y},cd:99,hp:500,maxHp:500});
 let hits=0;const hp0=f.hp;L.step(3,i=>{L.aim(0,0.8);if(i%40===0){h.atkCd=0;L.heroAttack();}if(f.hp<hp0-hits*15-1)hits=Math.round((hp0-f.hp)/15);});L.clearInput();
 L.check('walking away from a raider behind you, you still turn and hit them',f.hp<hp0,Math.round((hp0-f.hp)/15)+' hits landed while moving away');}
{const G=arena(),h=G.hero;h.inv={bat:1};h.weapon='bat';const f=foe('knife',h.x+60,h.y,{state:'alert',detect:1,lastSeen:{x:h.x,y:h.y},cd:99,hp:500,maxHp:500});G.fightT=8;
 let worst=0;L.step(0.3,()=>L.aim(Math.PI/2,0.8));L.step(3,()=>{L.aim(Math.PI/2,0.8);const off=Math.abs(((Math.atan2(f.y-h.y,f.x-h.x)-h.a)+3*Math.PI)%(2*Math.PI)-Math.PI);worst=Math.max(worst,off);});L.clearInput();
 L.check('in a fight you keep facing the raider while you strafe',worst<0.6,'worst angle away from them '+(worst*57.3).toFixed(0)+'°');}
{const G=arena(),h=G.hero;const p0={x:h.x,y:h.y};h.inv={bat:1};h.weapon='bat';const f=foe('knife',h.x+30,h.y,{state:'alert',detect:1,lastSeen:{x:h.x,y:h.y},cd:99,hp:500,maxHp:500});
 L.step(0.3,()=>L.aim(Math.PI/2,1));h.atkCd=0;L.heroAttack();const hit=f.hp<500;L.step(1,()=>L.aim(Math.PI/2,1));L.clearInput();
 L.check('you can attack while running',hit&&Math.hypot(h.x-p0.x,h.y-p0.y)>60,'moved '+Math.round(Math.hypot(h.x-p0.x,h.y-p0.y))+' px');}
// --- distant shots miss more often
function accuracy(dist,shooter){const G=arena(),h=G.hero;let hits=0,shots=0;
  if(shooter==='hero'){h.inv={revolver:1,bullets:999};h.weapon='revolver';const f=foe('knife',h.x+dist,h.y,{hp:1e9,maxHp:1e9,state:'alert',detect:1,lastSeen:{x:h.x,y:h.y},cd:1e9});
    for(let i=0;i<80;i++){f.x=h.x+dist;f.y=h.y;f.vx=f.vy=0;f.stun=0;const hp=f.hp;h.atkCd=0;L.heroAttack();shots++;for(let k=0;k<40;k++)L.update(1/60);f.stun=0;if(f.hp<hp)hits++;G.foes=[f];}}
  else{G.god=false;const f=foe('revolver',h.x+dist,h.y,{state:'alert',detect:1,lastSeen:{x:h.x,y:h.y},a:Math.PI});
    for(let i=0;i<80;i++){h.hp=1e9;f.x=h.x+dist;f.y=h.y;f.cd=0;f.a=Math.PI;const hp=h.hp;f.state='alert';f.wind=0;L.update(1/60);shots++;for(let k=0;k<40;k++){h.vx=h.vy=0;L.update(1/60);}if(h.hp<hp)hits++;f.cd=99;}}
  return Math.round(100*hits/shots);}
const acc=[60,200,350,480].map(d=>[d,accuracy(d,'hero')]);console.log('your revolver, hit rate by distance:',acc.map(([d,a])=>d+' px '+a+'%').join(', '));
L.check('close shots almost always hit, distant ones mostly miss',acc[0][1]>=85&&acc[3][1]<=40&&acc.every((x,i)=>!i||x[1]<=acc[i-1][1]+8));
const racc=[80,250,450].map(d=>[d,accuracy(d,'raider')]);console.log('a raider’s revolver at you:',racc.map(([d,a])=>d+' px '+a+'%').join(', '));
L.check('raiders’ shots follow the same rule',racc[0][1]>racc[2][1]+30);
// --- raiders avoid rocks: cross-country chase and road chase
{const off=require('./raidercrash2.js');L.check('chasing you cross-country, raiders only rarely hit rocks',(off.contacts||0)/off.mins<4&&((off.wipe_rock||0)+(off.wipe_offroadrock||0))/off.mins<0.5,
  ((off.contacts||0)/off.mins).toFixed(1)+' light contacts and '+(((off.wipe_rock||0)+(off.wipe_offroadrock||0))/off.mins).toFixed(2)+' rock wipeouts per raider-minute');}
L.done();
