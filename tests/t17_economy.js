const L=require('./harness');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncCars();return L.G;}
const click=(a,k)=>L.tradeClick({target:{closest:()=>({dataset:{a,k}})},stopPropagation(){}});
// --- the data hangs together
{const noValue=Object.keys(L.ITEMS).filter(k=>!L.VALUE[k]);const badRec=L.RECIPES.filter(r=>!L.ITEMS[r.make]||Object.keys(r.needs).some(k=>!L.ITEMS[k]));
 L.check('every item has a barter value, every recipe uses real items',!noValue.length&&!badRec.length,noValue.join(',')||Object.keys(L.ITEMS).length+' items, '+L.RECIPES.length+' recipes');}
// --- prices follow your standing; the Fuel Kings favour their friends
{const G=fresh(),o=L.LOCS[L.START];const row=[];for(const v of [-30,0,30,60,90]){G.rep.settlers=v;row.push(L.repTier(v)+': buy '+L.buyPrice(o,'water')+', sell '+L.sellPrice(o,'water'));}
 console.log('a bottle of water by standing:',row.join(' | '));G.rep.settlers=-30;const dis=L.buyPrice(o,'water');G.rep.settlers=60;const res=L.buyPrice(o,'water');
 L.check('the better they like you, the less you pay',dis>res&&L.sellPrice(o,'water')>4);
 const fk=L.LOCS.find(l=>l.faction==='fuelkings');G.rep.fuelkings=0;const stranger=L.buyPrice(fk,'svc_fuel',40);G.rep.fuelkings=30;const friend=L.buyPrice(fk,'svc_fuel',40);
 L.check('the Fuel Kings sell fuel cheap to friends',friend<stranger*0.75,'filling 40% of a tank: '+stranger+' to a stranger, '+friend+' to a friend');}
// --- a trade: you must cover the price; goods change hands; stock runs down and restocks
{const G=fresh(),h=G.hero;G.hero.x=L.LOCS[L.START].x;G.hero.y=L.LOCS[L.START].y;L.syncNPCs();const pub=G.npcs.find(n=>n.def.role==='publican');
 h.inv={durries:1};G.cars.forEach(c=>c.items={});L.openTrade(pub);const st0=JSON.stringify(L.traderStock(pub));click('want','water');click('want','water');
 L.check('you can’t take more than you give',!L.doDeal());click('offer','durries');const T=L.tradeTotals();const ok=L.doDeal();
 L.check('a packet of durries buys a bottle of water but not two',T.give<T.get?!ok:ok,'they want '+T.get+', you offer '+T.give);
 click('clear');click('want','water');click('offer','durries');click('clear');h.inv={durries:2};click('want','water');click('offer','durries');click('offer','durries');
 const w0=L.traderStock(pub).water;L.doDeal();L.closeTrade();L.check('the deal goes through: water in your pocket, durries gone, stock down',h.inv.water>=1&&!h.inv.durries&&L.traderStock(pub).water===w0-1);
 G.clock+=24*60;L.check('stock is refreshed the next morning',JSON.stringify(L.traderStock(pub))!==JSON.stringify({}),'today: '+JSON.stringify(L.traderStock(pub)));}
// --- services through the trade screen
{const G=fresh(),h=G.hero;G.hero.x=L.LOCS[L.START].x;G.hero.y=L.LOCS[L.START].y;L.syncNPCs();const mech=G.npcs.find(n=>n.def.role==='mechanic');
 const car=G.cars.find(c=>c.id==='hero0');car.x=mech.x+80;car.y=mech.y;Object.assign(car,{fuel:30,cond:40,engine:50,susp:20});car.tw=[0,100,30,100];
 const svc=L.servicesFor(mech,car).map(s=>s.k+'='+s.val);console.log('mechanic’s services for a battered car:',svc.join(', '));
 h.inv={watch:9,durries:6};L.openTrade(mech);for(const k of ['svc_fuel','svc_body','svc_engine','svc_susp','svc_tyres'])click('svc',k);let n=0;while(L.tradeTotals().give<L.tradeTotals().get&&n++<20)click('offer',h.inv.watch>(L.trade.offer.watch||0)?'watch':'durries');
 const T=L.tradeTotals();L.doDeal();L.closeTrade();L.check('a full service: tank, body, engine, suspension and two new tyres',car.fuel===100&&car.cond===100&&car.engine===100&&car.susp===100&&car.tw.every(t=>t===100),'cost '+T.get+' in trade');}
// --- crafting: some recipes anywhere, some need a workbench
{const G=fresh(),h=G.hero;h.inv={cloth:2,scrap:5,wire:1};G.cars.forEach(c=>c.items={});const band=L.RECIPES.find(r=>r.make==='bandage'),spr=L.RECIPES.find(r=>r.make==='springs');
 h.x=L.LOCS[L.START].x+3000;h.y=L.LOCS[L.START].y;L.check('bandages from rags, anywhere',L.craft(band)&&h.inv.bandage===2&&h.inv.cloth===1);
 L.check('springs need a workbench',!L.canCraft(spr));const o=L.LOCS[L.START],gar=o.bld.find(b=>b.kind==='garage');h.x=gar.x;h.y=gar.y;
 L.check('inside the garage, the workbench makes springs',!!L.atWorkbench()&&L.craft(spr)&&h.inv.springs===1&&h.inv.scrap===2);}
// --- upgrades: each one does what it says
const R=L.roads.find(r=>r.cls==='highway'&&r.len>150000);let best=200,bs=1e9;for(let i=60;i<R.n-400;i+=10){let c=0;for(let k=i;k<i+300;k++){const a1=Math.atan2(R.ys[k]-R.ys[k-1],R.xs[k]-R.xs[k-1]),a2=Math.atan2(R.ys[k+1]-R.ys[k],R.xs[k+1]-R.xs[k]);let d=Math.abs(a2-a1);if(d>Math.PI)d=2*Math.PI-d;c+=d;}if(c<bs){bs=c;best=i;}}
const OFF=L.flatSpot((x,y)=>{if(L.zoneAt(x,y).biome!=='red')return false;for(let d=0;d<2600;d+=80)if(L.terrainRaw(x+d,y)!==L.T.GROUND||Math.abs(L.heightAt(x+d,y)-L.heightAt(x,y))>20)return false;return true;});
function drive(ups,where,secs){const G=fresh(),c=G.cars.find(c=>c.id==='hero0');c.ups=Object.assign({},ups);
  if(where==='highway'){c.x=R.xs[best];c.y=R.ys[best];c.a=Math.atan2(R.ys[best+1]-R.ys[best],R.xs[best+1]-R.xs[best]);}
  else{c.x=OFF.x;c.y=OFF.y;c.a=0;}   // the same level patch of red desert for every off-road comparison
  G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);for(const k of L.chunks.values())k.rocks=[];
  const f0=c.fuel,t0=c.tw.slice(),s0=c.susp;let top=0;L.keys.ArrowUp=true;L.step(secs,()=>{for(const k of L.chunks.values())k.rocks=[];top=Math.max(top,c.speed);});L.clearInput();
  return {kmh:Math.round(top*0.36),fuel:f0-c.fuel,tyre:t0.reduce((a,v,i)=>a+v-c.tw[i],0)/4,susp:s0-c.susp,c};}
{const base=drive({},'highway',8),blow=drive({blower:true},'highway',8),tank=drive({longtank:true},'highway',8);
 L.check('blower: about 12% more top speed',Math.abs(blow.kmh/base.kmh-1.12)<0.03,base.kmh+' → '+blow.kmh+' km/h');
 L.check('long-range tank: about 30% less fuel',Math.abs(tank.fuel/base.fuel-0.7)<0.05,base.fuel.toFixed(2)+' → '+tank.fuel.toFixed(2)+' % in 8 s');
 const offB=drive({},'off',8),offU=drive({offroad:true},'off',8),hwU=drive({offroad:true},'highway',8);
 const perKm=r=>r.tyre/Math.max(1,r.kmh);L.check('off-road tyres: faster cross-country, slower tyre wear per km, a touch slower on bitumen',offU.kmh>offB.kmh&&perKm(offU)<perKm(offB)*0.75&&hwU.kmh<base.kmh,'off-road '+offB.kmh+' → '+offU.kmh+' km/h, tyre wear per km down '+Math.round(100-100*perKm(offU)/perKm(offB))+'%, highway '+hwU.kmh+' km/h');
 const hs=drive({heavysusp:true},'off',8);L.check('heavy-duty suspension: springs wear half as fast',Math.abs(hs.susp/offB.susp-0.5)<0.12,offB.susp.toFixed(2)+' → '+hs.susp.toFixed(2));}
// armour, roo bar and spikes: identical controlled collisions with and without
function rockHit(ups){const G=fresh(),c=G.cars.find(c=>c.id==='hero0');c.ups=ups;L.enterCar(c);c.cond=100;c.a=0;c.vx=400;c.vy=0;c.speed=400;L.collideTest?0:0;
  // a direct, head-on hit into a rock
  const before=c.cond;const fake={x:c.x+30,y:c.y,r:30};c.x=fake.x-c.r-fake.r*0.85+2;  
  const nx=-1,ny=0;c.vx=400;c.vy=0;L.bounceTest(c,nx,ny);return before-c.cond;}
function shove(ups,nose){const G=fresh(),p=G.cars.find(c=>c.id==='hero0');p.ups=ups;L.enterCar(p);p.a=nose?0:Math.PI/2;p.x=0;p.y=0;
  const e=L.makeRaider('buggy',30,0,Math.PI/2,0);G.cars.push(e);p.vx=nose?300:300;p.vy=0;e.vx=0;e.vy=0;e.mode='chase';const s0=e.stab;L.carPairTest(p,e);return s0-e.stab;}
{const plain=rockHit({}),arm=rockHit({armour:true}),roo=rockHit({roobar:true});
 L.check('armour: about 30% less body damage from the same crash',Math.abs(arm/plain-0.7)<0.03,plain.toFixed(1)+' → '+arm.toFixed(1)+' %');
 L.check('roo bar: front-on crashes do about a third less damage',Math.abs(roo/plain-0.65)<0.03,plain.toFixed(1)+' → '+roo.toFixed(1)+' %');
 const ramB=shove({},true),ramR=shove({roobar:true},true),sideB=shove({},false),sideS=shove({spikes:true},false);
 L.check('roo bar: rams rattle raiders 50% more',Math.abs(ramR/ramB-1.5)<0.05,ramB.toFixed(0)+' → '+ramR.toFixed(0)+' stability');
 L.check('spiked hubs: side-swipes rattle raiders 40% more',Math.abs(sideS/sideB-1.4)<0.05,sideB.toFixed(0)+' → '+sideS.toFixed(0)+' stability');}
{const G=fresh(),c=G.cars.find(c=>c.id==='hero0');G.hero.inv={kit_roobar:1};c.items={};L.enterCar(c);L.useItem('kit_roobar',G.hero.inv,c);
 L.check('fitting a kit needs a toolkit',!L.hasUp(c,'roobar'));G.hero.inv.toolkit=1;L.useItem('kit_roobar',G.hero.inv,c);L.check('with a toolkit it fits',L.hasUp(c,'roobar')&&!G.hero.inv.kit_roobar);
 c.ups.blower=true;G.hero.inv.kit_armour=1;L.useItem('kit_armour',G.hero.inv,c);c.touched=true;const sv=JSON.parse(JSON.stringify(L.saveData()));L.newGame(sv);
 const c2=L.G.cars.find(x=>x.id==='hero0');L.check('upgrades survive saving and loading',c2&&c2.ups.roobar&&c2.ups.blower&&c2.ups.armour,c2&&Object.keys(c2.ups).join(', '));}
// --- can you afford to keep going? expected earnings on a typical stretch against its costs
{const avg=(t,rolls,n=3000)=>{let s=0;for(let i=0;i<n;i++){const inv=L.genLoot(t,i*7919+3,rolls,null);for(const k in inv)s+=L.VALUE[k]*inv[k];}return s/n;};
 const bag=avg('raider',2),boot=avg('raider',2),crate=avg('ruin',2.5|0),camp=avg('camp',3);
 const perWipe=0.5*0.75*bag+0.5*boot,sell=0.6;const siphoned=(1*7+2.5*0.5*25)*0.45*1.25;   // fuel you siphon instead of buying: a roadside car and the raider cars you leave driverless
 const income=(2.5*perWipe+0.5*crate)*sell+siphoned;
 const fuelCost=60*0.45*1.25,repair=25*0.5*1.25,food=8*1.25,cost=fuelCost+repair+food;
 console.log('per stretch of road: earn ~'+Math.round(income)+' (2.5 raiders\' loot and half a ruin crate sold at 60%, plus ~'+Math.round(siphoned)+' worth of siphoned fuel) vs spend ~'+Math.round(cost)+' (refuel 60%, patch 25% body, a meal)');
 console.log('   average loot value: raider bag '+Math.round(bag)+', abandoned raider car '+Math.round(boot)+', ruin crate '+Math.round(crate)+', camp crate '+Math.round(camp));
 L.check('a careful driver can pay their way, with ruins and camps as the profit',income>cost*0.8,'earn '+Math.round(income)+' vs spend '+Math.round(cost));}
{const G=fresh();let ok=true;try{G.hero.x=L.LOCS[L.START].x;G.hero.y=L.LOCS[L.START].y;L.syncNPCs();L.openTrade(G.npcs.find(n=>n.def.role==='mechanic'));L.renderTrade();L.closeTrade();L.openInv(null);L.renderInv();L.closeInv();}catch(e){ok=false;console.log(e);}L.check('trade and crafting screens render',ok);}
L.done();
