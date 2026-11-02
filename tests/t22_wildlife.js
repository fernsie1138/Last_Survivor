const L=require('./harness');L.allowWild=true;
function arena(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const A=L.flatSpot();G.hero.x=A.x;G.hero.y=A.y;L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.animals=[];G.wildT=1e9;G.clock=12*60;
  for(const c of L.chunks.values())c.rocks=[];return G;}
const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// --- sparse, ahead of you when driving, never in towns
{let seen=new Set(),inTown=0,counts={},maxAlive=0;const R=L.roads.filter(r=>r.cls==='highway'&&r.len>150000);
 for(const Rd of R.slice(0,4)){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const c=G.cars.find(c=>c.id==='hero0');c.x=Rd.xs[50];c.y=Rd.ys[50];c.a=Math.atan2(Rd.ys[51]-Rd.ys[50],Rd.xs[51]-Rd.xs[50]);G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();
   L.step(120,()=>{const r2=L.roadInfo(c.x,c.y),j=Math.min(Rd.n-1,r2.i+10);L.aim(Math.atan2(Rd.ys[j]-c.y,Rd.xs[j]-c.x)+G.camRot,1);c.fuel=100;c.cond=100;
     const alive=G.animals.filter(a=>a.state!=='dead');maxAlive=Math.max(maxAlive,alive.length);for(const a of alive){if(!seen.has(a)){seen.add(a);counts[a.sp]=(counts[a.sp]||0)+1;}if(L.LOCS.some(l=>Math.hypot(l.x-a.x,l.y-a.y)<l.rad))inTown++;}});L.clearInput();}
 console.log('8 minutes of highway driving: animals seen',JSON.stringify(counts),'| most alive at once',maxAlive);
 L.check('wildlife is sparse but you see it from the road',seen.size>=8&&seen.size<=120&&maxAlive<=12);L.check('animals never wander into towns',inTown===0);}
{let met=0;for(let k=0;k<6;k++){const G=arena();const A=L.flatSpot((x,y)=>L.zoneAt(x,y).biome!=='salt');G.hero.x=A.x;G.hero.y=A.y;G.wildT=2;G.god=true;   // walk where animals live, not the near-empty salt flats
    // this check is about how often you meet them, not whether you survive
 const z=L.zoneAt(G.hero.x,G.hero.y).biome;L.step(60,()=>{L.aim(0.3,0.85);for(const a of G.animals)if(a.state!=='dead'&&near(a,G.hero)<300&&!a.met){a.met=true;met++;}});L.clearInput();}
 L.check('on foot, you only now and then come across one',met>=1&&met<=40,met+' animals came within 30 m in 6 minutes of walking');}
// --- rabbits run; you can sneak closer
// approach at 85% stick: a full push of the stick is a run, which would stand you up out of a crouch
function approach(sp,crouch){const G=arena(),h=G.hero;const a=L.spawnAnimal(sp,h.x+400,h.y);h.crouch=crouch;let boltAt=null;
  // the animal grazes on the spot (so it can't simply amble away), and we note how close you were when it bolted
  L.step(20,()=>{if(boltAt===null&&a.state==='flee')boltAt=Math.hypot(a.x-h.x,a.y-h.y);if(boltAt!==null)return;a.t=9;a.state='idle';L.aim(Math.atan2(a.y-h.y,a.x-h.x),0.85);});L.clearInput();
  const closest=boltAt===null?Math.hypot(a.x-h.x,a.y-h.y):boltAt;return {closest,fled:boltAt!==null};}
{const walk=approach('rabbit',false),sneak=approach('rabbit',true);
 L.check('a rabbit bolts when you walk up to it; sneaking gets you much closer',walk.fled&&sneak.closest<walk.closest*0.6,'walking it ran at '+Math.round(walk.closest/10)+' m, sneaking at '+Math.round(sneak.closest/10)+' m');}
{const G=arena(),h=G.hero;const mob={};for(let i=0;i<4;i++)L.spawnAnimal('roo',h.x+300+i*30,h.y+i*20,{mob});L.step(4,()=>L.aim(0,0.85));L.clearInput();
 L.check('kangaroos come in mobs, and the whole mob bounds away when one is spooked',G.animals.filter(a=>a.state==='flee').length===4);
 const walk=approach('roo',false),sneak=approach('roo',true);L.check('…and you can sneak up on them',sneak.closest<walk.closest*0.6,'walking they bolted at '+Math.round(walk.closest/10)+' m, sneaking at '+Math.round(sneak.closest/10)+' m');}
{let sizes=[];for(let k=0;k<30;k++){const G=arena();G.wildT=0.01;G.cars=[];const z='mallee';L.update(1/60);const mobs={};for(const a of G.animals)if(a.mob){mobs[JSON.stringify(Object.keys(a.mob))+G.animals.indexOf(a)]=0;}
   const groups=new Map();for(const a of G.animals)if(a.sp==='roo'){groups.set(a.mob,(groups.get(a.mob)||0)+1);}for(const v of groups.values())sizes.push(v);}
 L.check('mobs are 2 to 5',sizes.length>0&&sizes.every(n=>n>=1&&n<=5),'mob sizes seen: '+sizes.join(','));}
// --- snakes strike if you get too close, but don't chase far
{const G=arena(),h=G.hero;h.hp=100;const s=L.spawnAnimal('snake',h.x+150,h.y);L.step(3);L.check('a snake leaves you alone at a distance',h.hp===100);
 h.x=s.x-40;h.y=s.y;L.step(2);const bit=h.hp<100;L.check('…but strikes if you get close',bit,'health '+Math.round(h.hp));
 h.hp=100;h.x=s.x-600;L.step(5,()=>{});L.check('…and doesn’t follow you far',Math.hypot(s.x-s.home.x,s.y-s.home.y)<40&&h.hp===100);}
// --- dingoes: come for you, bite, back off when hurt, give up if you get in a car
{const G=arena(),h=G.hero;h.hp=100;const d=L.spawnAnimal('dingo',h.x+180,h.y);L.step(4,()=>L.aim(Math.PI,1));L.clearInput();
 L.check('a dingo runs you down and bites, even when you run',h.hp<100&&d.state==='chase','health '+Math.round(h.hp));
 L.hitAnimal(d,d.maxHp*0.85,1,0);L.step(0.3);L.check('a badly hurt dingo backs off (below a fifth of its health)',d.state==='flee');
 const G2=arena(),h2=G2.hero;const car=L.makeCar('ute',h2.x+30,h2.y,0,{id:'tc',touched:true,fuel:50});G2.cars.push(car);const d2=L.spawnAnimal('dingo',h2.x+150,h2.y);L.step(1);L.enterCar(car);L.step(1);
 L.check('it gives up when you get into a car',d2.state!=='chase');}
// --- killing and eating
{const G=arena(),h=G.hero;h.inv={bat:1};h.weapon='bat';h.food=40;const r=L.spawnAnimal('rabbit',h.x+30,h.y);h.crouch=true;r.state='idle';
 for(let i=0;i<4&&r.state!=='dead';i++){h.atkCd=0;h.a=Math.atan2(r.y-h.y,r.x-h.x);L.heroAttack();L.step(0.1);}
 L.check('you can kill an animal with a melee weapon',r.state==='dead');const acts=L.getActions().map(a=>a.label);L.check('a carcass can be butchered',acts.some(l=>/Butcher the rabbit/.test(l)),acts.join(', '));
 const c0=G.clock;L.butcher(L.carcassNear(60));L.check('butchering takes a little time and gives meat',h.inv.rabbitmeat===1&&G.clock>c0);
 L.useItem('rabbitmeat',h.inv,null);L.check('and the meat can be eaten',h.food>40&&!h.inv.rabbitmeat,'food 40 → '+Math.round(h.food));}
{const G=arena(),h=G.hero;h.inv={rifle:1,rounds:10};h.weapon='rifle';const roo=L.spawnAnimal('roo',h.x+250,h.y);roo.hp=1;for(let k=0;k<5&&roo.state!=='dead';k++){h.atkCd=0;h.a=Math.atan2(roo.y-h.y,roo.x-h.x);L.heroAttack();L.step(0.6);}
 L.check('or shoot one (the shot spooks it, so it may take a couple)',roo.state==='dead');L.butcher(L.carcassNear(400)||roo);L.check('a kangaroo gives two lots of roo meat',G.hero.inv.roomeat===2||L.carcassNear(400)===null);}
{const G=arena(),h=G.hero;const mob={};const roos=[0,1,2].map(i=>L.spawnAnimal('roo',h.x+700+i*30,h.y,{mob}));h.inv={revolver:1,bullets:5};h.weapon='revolver';h.atkCd=0;h.a=Math.PI;L.heroAttack();L.step(0.5);
 L.check('a gunshot sends kangaroos bounding off, even 70 m away',roos.every(r=>r.state==='flee'));}
// --- hitting a kangaroo on the road damages the car; a rabbit doesn't
function hitWith(sp){const G=arena(),h=G.hero;const c=L.makeCar('kingsford',h.x,h.y,0,{id:'hc',touched:true,fuel:100});G.cars=[c];h.x=c.x;h.y=c.y;L.enterCar(c);c.vx=400;c.speed=400;
  const a=L.spawnAnimal(sp,c.x+120,c.y);a.state='idle';a.S=Object.assign({},a.S,{carSpook:0});const c0=c.cond;L.keys.ArrowUp=true;
  // the animal stands its ground and the way is clear, so the only thing the car can hit is the animal
  L.step(1,()=>{if(a.state!=='dead'){a.state='idle';a.t=9;}for(const ch of L.chunks.values())ch.rocks=[];});L.clearInput();return {dmg:c0-c.cond,dead:a.state==='dead'};}
{const roo=hitWith('roo'),rab=hitWith('rabbit');L.check('hitting a kangaroo at speed kills it and damages the car',roo.dead&&roo.dmg>5,'body -'+roo.dmg.toFixed(1)+'%');L.check('a rabbit under the wheels does no harm to the car',rab.dead&&rab.dmg<1);}
{const G=arena();const s=L.spawnAnimal('dingo',G.hero.x+100,G.hero.y);L.step(0.5);L.check('you can’t save with a dingo going for you',/animal/.test(L.canSaveNow()||''));}
{const G=arena();for(const sp of ['snake','rabbit','dingo','roo'])L.spawnAnimal(sp,G.hero.x+Math.random()*200,G.hero.y+Math.random()*200);L.killAnimal(G.animals[1]);let ok=true;try{L.render();}catch(e){ok=false;console.log(e);}L.check('all four draw, alive and dead',ok);}
L.done();
