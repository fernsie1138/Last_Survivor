const L=require('./harness');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;return L.G;}
// --- clock: a day lasts 45 real minutes
{const G=fresh(),c0=G.clock;L.step(60);const perMin=G.clock-c0;
 L.check('one real minute = 32 game minutes (45 min days)',Math.abs(perMin-32)<0.5,perMin.toFixed(1)+' game min');}
// --- how long each need lasts while driving at midday in mild country (mallee) vs the red desert
function drain(biome,onFoot,running){const G=fresh();let spot=null;
  for(let t=0;t<20000&&!spot;t++){const x=(Math.random()*2-1)*800000,y=(Math.random()*2-1)*550000;if(L.landValue(x,y)>0.1&&L.zoneAt(x,y).biome===biome)spot={x,y};}
  const c=G.cars.find(c=>c.id==='hero0');c.x=spot.x;c.y=spot.y;G.hero.x=spot.x+60;G.hero.y=spot.y;G.clock=10*60;G.cars=[c];
  if(!onFoot)L.enterCar(c);const h=G.hero,w0=h.water,f0=h.food,r0=h.rest;
  if(running){L.keys.KeyD=true;L.keys.ShiftLeft=true;}
  L.step(60,()=>{h.x=spot.x;h.y=spot.y;});L.clearInput();
  return {water:(100/(w0-h.water)).toFixed(0),food:(100/(f0-h.food)).toFixed(0),rest:(100/(r0-h.rest)).toFixed(0)};}
const mild=drain('mallee',false),hot=drain('red',false),run=drain('mallee',true,true);
console.log('real minutes until empty (driving, mallee):',JSON.stringify(mild),' red desert:',JSON.stringify(hot),' running on foot:',JSON.stringify(run));
L.check('water lasts ~30 min in mild country, less in the desert, less again running',+mild.water>=28&&+mild.water<=34&&+hot.water<+mild.water&&+run.water<+mild.water);
L.check('food lasts ~an hour, rest ~35 min awake',+mild.food>=55&&+mild.food<=70&&+mild.rest>=30&&+mild.rest<=40);
// --- running dry hurts, drinking fixes it
{const G=fresh(),h=G.hero;h.water=0;const hp=h.hp;L.step(10);L.check('no water drains health',h.hp<hp-2,'lost '+(hp-h.hp).toFixed(1)+' hp in 10 s');
 h.inv={water:2};h.water=10;const a=L.getActions().find(x=>x.label==='Drink');L.check('Drink button offered when thirsty',!!a);a&&a.fn();
 L.check('drinking a bottle restores 35 water',Math.abs(h.water-45)<0.5&&h.inv.water===1,h.water.toFixed(1));}
// --- weight limit: a can full of fuel is heavy
{const G=fresh(),h=G.hero;h.inv={jerrycan:1};L.setFill(h.inv,30);const one=L.invWeight(h.inv);const car=G.cars.find(c=>c.id==='hero0');car.items={jerrycan:1};L.setFill(car.items,30);
 const moved=L.invMove(car.items,h.inv,'jerrycan',1,L.HERO_CAP||25);
 L.check('a full jerry can weighs about 15 kg; you can’t also carry a second full one',Math.abs(one-15)<0.5&&moved===0,one+' kg for one full can');}
// --- crates in ruins: search, take, and they stay taken
{const G=fresh(),h=G.hero;const ru=L.LOCS.find(l=>l.type==='ruin'&&l.boxes.length>=3);
 G.hero.x=ru.x;G.hero.y=ru.y;G.cars=[];L.syncCars();const bx=G.boxes.find(b=>b.id.startsWith('b'+ru.id+'_'));h.x=bx.x+20;h.y=bx.y;L.step(0.1);
 const act=L.getActions().find(a=>a.label.startsWith('Search'));L.check('Search offered next to a ruin crate',!!act,ru.name+', '+bx.kind);
 act.fn();L.check('search opens the gear screen',L.state==='inv');const before=JSON.stringify(bx.items);
 L.invClick({target:{closest:()=>({dataset:{a:'takeevery'}})},stopPropagation(){}});
 const got=Object.keys(h.inv).length;L.closeInv();
 L.check('take everything moves loot to you',got>0,'contents were '+before);
 // leave, regenerate the world, come back
 const saved=JSON.parse(JSON.stringify(L.saveData()));L.newGame(saved);const G2=L.G;G2.hero.x=ru.x;G2.hero.y=ru.y;L.syncCars();
 const again=G2.boxes.find(b=>b.id===bx.id);L.boxItems(again);
 L.check('emptied crate is still empty after saving and reloading',Object.keys(again.items).length<Object.keys(JSON.parse(before)).length,JSON.stringify(again.items));}
// --- loot tables: averages over many crates, and zones tilt them
{const sum={},n=2000;for(let i=0;i<n;i++){const inv=L.genLoot('ruin',i*7919+13,2,null);for(const k in inv)sum[k]=(sum[k]||0)+inv[k];}
 const per=Object.fromEntries(Object.entries(sum).map(([k,v])=>[k,(v/n).toFixed(2)]));console.log('average per ruin crate:',JSON.stringify(per));
 let parts=0,partsR=0,water=0,waterS=0;for(let i=0;i<n;i++){const a=L.genLoot('ruin',i*31+7,2,null),b=L.genLoot('ruin',i*31+7,2,'ranges'),c=L.genLoot('ruin',i*31+7,2,'salt');
   parts+=a.parts||0;partsR+=b.parts||0;water+=a.water||0;waterS+=c.water||0;}
 L.check('mining country has more engine parts, salt flats less water',partsR>parts*1.5&&waterS<water*0.7,'parts '+parts+' vs '+partsR+' (ranges), water '+water+' vs '+waterS+' (salt)');}
// --- car parts: flat tyres, sick engine, worn springs all cost speed; repairs need the right item and tools
{const G=fresh(),c=G.cars.find(c=>c.id==='hero0');const R=L.roads.find(r=>r.cls==='highway'&&r.len>100000);const i=200;
 function top(set){const g=fresh(),car=g.cars.find(c=>c.id==='hero0');Object.assign(car,set);car.x=R.xs[i];car.y=R.ys[i];car.a=Math.atan2(R.ys[i+1]-R.ys[i],R.xs[i+1]-R.xs[i]);
   g.hero.x=car.x;g.hero.y=car.y;L.enterCar(car);let t=0;L.step(6,()=>{const r2=L.roadInfo(car.x,car.y),j=Math.min(R.n-1,r2.i+8);L.aim(Math.atan2(R.ys[j]-car.y,R.xs[j]-car.x));t=Math.max(t,car.speed);});L.clearInput();return Math.round(t*0.36);}
 const ok=top({}),flat=top({tw:[0,0,100,100]}),eng=top({engine:10});
 L.check('flat tyres and a dying engine both slow the car',flat<ok*0.7&&eng<ok*0.8,'healthy '+ok+', two flats '+flat+', engine 10% '+eng+' km/h');
 const g=fresh(),h=g.hero,car=g.cars.find(c=>c.id==='hero0');car.engine=20;car.tw=[0,100,100,100];car.items={};h.inv={parts:1,tyre:1};
 L.useItem('parts',h.inv,car);L.check('engine parts need a toolkit',car.engine===20&&h.inv.parts===1);
 h.inv.toolkit=1;L.useItem('parts',h.inv,car);L.check('with a toolkit, engine parts restore 40%',car.engine===60);
 L.useItem('tyre',h.inv,car);L.check('a spare tyre needs no tools, and replaces the flat',car.tyres===100);}
// --- sleeping
{const G=fresh(),h=G.hero,c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);h.rest=10;h.water=80;const t0=G.clock;
 let ambushes=0,N=600;for(let i=0;i<N;i++){h.rest=10;G.cars=G.cars.filter(x=>x.driver!=='raider');c.onRoad=true;L.doSleep(7,c);if(G.cars.some(x=>x.driver==='raider'))ambushes++;}
 let off=0;for(let i=0;i<N;i++){h.rest=10;G.cars=G.cars.filter(x=>x.driver!=='raider');c.onRoad=false;L.doSleep(7,c);if(G.cars.some(x=>x.driver==='raider'))off++;}
 L.check('sleeping on the road is far riskier than off it',ambushes>off*2,'ambushed '+ambushes+'/'+N+' on the road, '+off+'/'+N+' off it');
 const g=fresh(),hh=g.hero,cc=g.cars.find(c=>c.id==='hero0');L.enterCar(cc);hh.rest=10;cc.onRoad=false;const c1=g.clock;
 let tries=0;do{hh.rest=10;g.cars=g.cars.filter(x=>x.driver!=='raider');g.clock=c1;L.doSleep(7,cc);tries++;}while(g.cars.some(x=>x.driver==='raider')&&tries<20);
 L.check('a full sleep restores rest and passes the hours',hh.rest>=99&&Math.abs(g.clock-c1-420)<1,'rest '+hh.rest.toFixed(0)+', '+((g.clock-c1)/60)+' hours');}
// --- outposts: the first feed is free, then everything is bought
{const G=fresh(),h=G.hero;h.water=20;h.food=20;G.clock=10*60;L.syncNPCs();
 const pub=G.npcs.find(n=>n.def.role==='publican'),mech=G.npcs.find(n=>n.def.role==='mechanic');
 L.check('arriving no longer refills you automatically',h.water===20);
 L.startTalk(pub);L.chooseOpt(L.talk.opts.findIndex(x=>x.t==='Get a feed and a drink'));L.check('the first feed in a town is on the house',h.water===100&&h.food===100);L.endTalk();
 G.clock=22*60;h.rest=30;h.inv={water:3};L.openTrade(pub);L.tradeClick({target:{closest:()=>({dataset:{a:'svc',k:'svc_bunk'}})},stopPropagation(){}});
 for(let i=0;i<3;i++)L.tradeClick({target:{closest:()=>({dataset:{a:'offer',k:'water'}})},stopPropagation(){}});L.doDeal();
 L.check('a bunk costs three bottles of water at neutral standing: wake at 06:00, rested',L.fmtClock(G.clock).endsWith('06:00')&&h.rest===100&&L.state==='play'&&!h.inv.water,L.fmtClock(G.clock));
 const car=G.cars.find(c=>c.id==='hero0');car.x=mech.x+60;car.y=mech.y;car.fuel=10;h.inv={watch:3};
 L.openTrade(mech);L.tradeClick({target:{closest:()=>({dataset:{a:'svc',k:'svc_fuel'}})},stopPropagation(){}});for(let i=0;i<3;i++)L.tradeClick({target:{closest:()=>({dataset:{a:'offer',k:'watch'}})},stopPropagation(){}});
 L.doDeal();L.closeTrade();L.check('the mechanic fills the tank for a few watches',car.fuel===100&&(h.inv.watch||0)<3);}
// --- the gear screen renders with a car and a box
{const G=fresh();let ok=true;try{const c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);L.openInv(null);L.renderInv();L.closeInv();L.render();}catch(e){ok=false;console.log(e);}
 L.check('gear screen opens with the car boot and parts',ok);}
L.done();
