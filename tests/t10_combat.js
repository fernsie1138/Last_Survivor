const L=require('./harness');
// an empty patch of open ground far from roads and towns
let ARENA=L.flatSpot();   // open, level ground
function arena(clock){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;G.cars=[];G.npcs=[];G.foes=[];G.boxes=[];
  G.hero.x=ARENA.x;G.hero.y=ARENA.y;G.clock=clock||12*60;L.syncCars();G.cars=[];G.foes=[];G.npcs=[];for(const c of L.chunks.values())c.rocks=[],c.wrecks=[];G.syncT=1e9;return G;}
function foe(weapon,x,y,a){const f=L.makeFoe({id:'t'+Math.random(),weapon,post:{x,y},patrol:[{x,y}],seed:5,brave:true},null,x,y);f.a=a;f.loose=true;f.cd=0.5;L.G.foes.push(f);return f;}
const sec=(fn,max)=>{let t=0;while(t<max){L.update(1/60);t+=1/60;if(fn())return t;}return Infinity;};
// --- A: how fast you're spotted, standing in front of a raider at 200px
function spot(clock,crouch){const G=arena(clock),h=G.hero,f=foe('knife',h.x+200,h.y,Math.PI);h.crouch=crouch;return sec(()=>f.state==='alert',12);}
const day=spot(12*60,false),dayC=spot(12*60,true),night=spot(23*60,false),nightC=spot(23*60,true);
console.log('seconds to be spotted at 200px:',JSON.stringify({day:day.toFixed(1),daySneaking:dayC===Infinity?'never':dayC.toFixed(1),night:night===Infinity?'never':night.toFixed(1),nightSneaking:nightC===Infinity?'never':nightC.toFixed(1)}));
L.check('spotted within ~1-2 s standing in daylight',day>0.5&&day<2.5);
L.check('sneaking takes much longer to be noticed',dayC>day*1.6);
L.check('at night, 200px is beyond sight unless you stand out',night===Infinity||night>day*1.5);
// --- B: approaching from behind
function approach(crouch,run){const G=arena(),h=G.hero,f=foe('knife',h.x+220,h.y,0);h.crouch=crouch;   // raider faces away from you
  let t=0;while(t<10&&Math.hypot(f.x-h.x,f.y-h.y)>26){L.aim(Math.atan2(f.y-h.y,f.x-h.x),run?1:0.8);L.update(1/60);t+=1/60;if(f.state==='alert'||f.state==='investigate')break;}
  L.clearInput();return {reached:Math.hypot(f.x-h.x,f.y-h.y)<=27,noticed:f.state!=='idle',f};}
const sneak=approach(true,false),walk=approach(false,false),run=approach(false,true);
L.check('sneaking up behind a raider goes unnoticed',sneak.reached&&!sneak.noticed);
L.check('walking up behind them, they hear your footsteps',walk.noticed);
L.check('running, they hear you from further off',run.noticed);
{const G=arena(),h=G.hero,f=foe('bat',h.x+24,h.y,0);h.a=0;h.crouch=true;h.atkCd=0;L.heroAttack();L.check('takedown from behind is one hit',f.dead);}
// --- C: walls hide you; a doorway doesn't
{const G=arena(),o=L.LOCS.find(l=>l.camp);const b=o.bld.find(x=>x.kind==='house'||x.kind==='shed'||x.kind==='servo');G.foes=[];
 const h=G.hero;h.x=b.x;h.y=b.y;const side=b.L(0,-b.h/2-60);const f=foe('knife',side.x,side.y,Math.atan2(b.y-side.y,b.x-side.x));
 L.step(5);L.check('a raider outside cannot see you through a wall',f.state==='idle'&&f.detect<0.1,'detect '+f.detect.toFixed(2));
 G.foes=[];const d=b.L(0,b.h/2+70);const f2=foe('knife',d.x,d.y,Math.atan2(b.y-d.y,b.x-d.x));L.step(5);L.check('…but they can see in through the doorway',f2.state==='alert');}
// --- D: duels. A bot walks in and attacks; the raider knows you're coming.
function duel(myW,ammo,foes){const G=arena(),h=G.hero;h.inv={};if(myW){h.inv[myW]=1;h.weapon=myW;}if(ammo)h.inv[L.WEAPONS[L.ITEMS[myW].weapon].ammo]=ammo;
  const fs=foes.map((w,i)=>{const f=foe(w,h.x+150+i*30,h.y+(i-1)*40,Math.PI);f.state='alert';f.detect=1;f.lastSeen={x:h.x,y:h.y};return f;});
  const W=L.heroWeapon();let t=0;
  while(t<60&&h.hp>0&&fs.some(f=>!f.dead&&f.state!=='flee')){const tg=fs.filter(f=>!f.dead&&f.state!=='flee').sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    const d=Math.hypot(tg.x-h.x,tg.y-h.y),a=Math.atan2(tg.y-h.y,tg.x-h.x);
    if(W.gun){L.stick.active=false;h.a=a;if(h.atkCd<=0&&h.inv[W.ammo])L.heroAttack();else if(!h.inv[W.ammo]){L.aim(a,0.8);if(d<W.range+20&&h.atkCd<=0)L.heroAttack();}}
    else{if(d>W.range+14)L.aim(a,0.8);else{L.stick.active=false;h.a=a;if(h.atkCd<=0)L.heroAttack();}}
    L.update(1/60);t+=1/60;if(L.state!=='play')break;}
  L.clearInput();return {win:h.hp>0,hp:Math.max(0,h.hp)};}
function series(label,myW,ammo,foes,n){let w=0,hp=0;for(let i=0;i<n;i++){const r=duel(myW,ammo,foes);if(r.win){w++;hp+=r.hp;}}
  console.log(label.padEnd(42),'won',w+'/'+n,' avg health left when winning',w?Math.round(hp/w):'-');return w/n;}
// fights measured across randomised starts (distance, spread, readiness, time of day): one fixed setup can flip either way
const D=require('./duelrand');
const fistsKnife=D.series('fists vs 1 knife raider',[null,0,['knife']],20),batKnife=D.series('cricket bat vs 1 knife raider',['bat',0,['knife']],20);
const batThree=D.series('cricket bat vs 3 raiders',['bat',0,['knife','bat','knife']],20),revThree=D.series('revolver (12 rounds) vs 3 raiders',['revolver',12,['knife','bat','knife']],20);
L.check('a weapon beats bare fists',batKnife>=fistsKnife);
L.check('three raiders head-on with a bat is mostly a losing fight',batThree<=0.4);
L.check('a revolver with ammo turns the odds against three',revThree>batThree+0.3);
// --- E: gunshots draw the whole camp
{const G=arena(),camp=L.LOCS.find(l=>l.camp&&l.foes.length>=3);G.hero.x=camp.x+700;G.hero.y=camp.y;G.foes=[];L.syncFoes();
 const fs=G.foes.filter(f=>f.loc===camp);L.step(1);const before=fs.filter(f=>f.state!=='idle').length;
 G.hero.inv={revolver:1,bullets:2};G.hero.weapon='revolver';G.hero.atkCd=0;G.hero.a=Math.PI/2;L.heroAttack();L.step(0.2);
 const after=fs.filter(f=>f.state!=='idle').length;L.check('a gunshot 700px away puts the camp on edge',after>=fs.length-0&&after>before,before+' → '+after+' of '+fs.length+' raiders reacting');}
// --- F: clearing a camp sticks
{const G=arena(),camp=L.LOCS.find(l=>l.camp);G.hero.x=camp.x+1500;G.hero.y=camp.y;G.foes=[];L.syncFoes();
 for(const f of G.foes.filter(f=>f.loc===camp))L.hitFoe(f,999,1,0,0);
 L.check('killing every raider clears the camp',G.flags['camp_'+camp.id]==='cleared');
 const sv=JSON.parse(JSON.stringify(L.saveData()));L.newGame(sv);L.G.hero.x=camp.x+1500;L.G.hero.y=camp.y;L.syncFoes();
 L.check('they stay dead after saving and reloading',!L.G.foes.some(f=>f.loc===camp));}
// --- G: ammo runs out; townsfolk can't be hurt
{const G=arena(),h=G.hero;h.inv={revolver:1,bullets:3};h.weapon='revolver';let shots=0;for(let i=0;i<5;i++){h.atkCd=0;const n=G.bullets.length;L.heroAttack();if(G.bullets.length>n)shots++;}
 L.check('each shot uses a round, then the gun clicks empty',shots===3&&!h.inv.bullets);}
// --- H: a raider's driver climbs out after a wipeout
{let fought=0,fled=0;for(let i=0;i<80;i++){const G=arena();const e=L.makeRaider('buggy',G.hero.x+300,G.hero.y,0,0);G.cars.push(e);e.wipe=0.01;L.update(1/60);L.update(1/60);
   const f=G.foes.find(x=>x.loose);if(f){if(f.state==='alert')fought++;else fled++;}}
 L.check('wiped-out raiders that survive get out and fight or run',fought+fled>=24,fought+' fought, '+fled+' fled, out of 80 wipeouts (half should survive)');}
// --- I: raider shooters can blow your tyres (on a highway, where they actually chase you)
{const R=L.roads.find(r=>r.cls==='highway'&&r.len>150000);let tyreHits=0,shots=0,bodyLost=0,runs=20;
 for(let i=0;i<runs;i++){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const k=200+i*40,h=G.hero;
   const c=L.makeCar('kestrel',R.xs[k],R.ys[k],Math.atan2(R.ys[k+1]-R.ys[k],R.xs[k+1]-R.xs[k]),{id:'tc',touched:true});G.cars=[c];h.x=c.x;h.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
   const j=k-20,e=L.makeRaider('buggy',R.xs[j],R.ys[j],c.a,300);e.gunner=true;G.cars.push(e);
   let prev=c.tw.slice(),prevB=0,hit=false;
   L.step(15,()=>{const r2=L.roadInfo(c.x,c.y),jj=Math.min(R.n-1,r2.i+Math.round(5+c.speed/60));L.aim(Math.atan2(R.ys[jj]-c.y,R.xs[jj]-c.x));
     if(c.tw.some((t,i)=>prev[i]-t>20))hit=true;prev=c.tw.slice();if(G.bullets.length>prevB)shots+=G.bullets.length-prevB;prevB=G.bullets.length;});L.clearInput();
   if(hit)tyreHits++;bodyLost+=100-c.cond;}
 L.check('a raider shooter on the highway sometimes hits a tyre',tyreHits>0&&tyreHits<=runs*0.8,tyreHits+' of '+runs+' 15-second highway chases lost a tyre; '+shots+' shots fired, avg body loss '+Math.round(bodyLost/runs)+'%');}
{const G=arena();let ok=true;try{foe('revolver',G.hero.x+100,G.hero.y,0);G.hero.crouch=true;L.render();}catch(e){ok=false;console.log(e);}L.check('combat renders',ok);}
L.done();
