const L=require('./harness');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncCars();return L.G;}
// --- no free fuel anywhere
{const full=Object.keys(L.LOOT).filter(t=>L.LOOT[t].some(e=>e[0]==='jerrycan'&&false));let cans=0,fuelSeen=0;
 for(const t in L.LOOT)for(let i=0;i<400;i++){const inv=L.genLoot(t,i*31+7,3,null);if(inv.jerrycan)cans++;}
 const G=fresh();for(let i=0;i<400;i++){const inv=L.genLoot('raider',i,3,null);L.setFill(inv,0);fuelSeen+=L.canFill(inv);}
 L.check('loot can hold empty jerry cans but never any fuel',fuelSeen===0,cans+' empty cans found in 2,800 loot rolls');}
{const G=fresh(),c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);let picked=0;const R=L.roads[L.LOCS[L.START].links[0].road];
 L.step(240,()=>{const r2=L.roadInfo(c.x,c.y),j=Math.min(R.n-1,r2.i+10);L.aim(Math.atan2(R.ys[j]-c.y,R.xs[j]-c.x)+G.camRot,1);c.fuel=100;});L.clearInput();
 L.check('four minutes of driving: no jerry cans by the road',!G.pickups.some(p=>p.item==='jerrycan'));}
// --- every car out there has at most half a tank, most much less
{const fuels=[];for(const l of L.LOCS)for(const s of l.carSpawns)fuels.push(s.fuel);for(let cx=-60;cx<60;cx+=2)for(let cy=-40;cy<40;cy+=2){const ch=L.getChunk(cx*20,cy*20);for(const s of ch.carSpawns)fuels.push(s.fuel);}
 const max=Math.max(...fuels),under30=fuels.filter(f=>f<30).length;L.check('no parked or abandoned car holds more than half a tank, most far less',max<=50&&under30>fuels.length*0.6,fuels.length+' cars: max '+max.toFixed(0)+'%, '+Math.round(100*under30/fuels.length)+'% under 30%, average '+(fuels.reduce((a,b)=>a+b,0)/fuels.length).toFixed(0)+'%');
 let mx=0;for(let i=0;i<200;i++){const G=fresh();const e=L.makeRaider('buggy',G.hero.x+300,G.hero.y,0,0);G.cars.push(e);e.wipe=0.01;L.update(1/60);L.update(1/60);if(G.cars.includes(e)&&!e.driver)mx=Math.max(mx,e.fuel);}
 L.check('defeated raider cars hold at most 40%',mx<=40,'highest seen '+mx.toFixed(0)+'%');}
// --- siphoning: needs a can and a hose, fills gradually, takes hours, then pour it in
const away=()=>{const G=L.G,o=L.LOCS[L.START];const c=L.makeCar('kingsford',o.x+6000,o.y+6000,0,{id:'wtest',fuel:20,cond:60});G.cars.push(c);G.hero.x=c.x+c.r+12;G.hero.y=c.y;G.clock=12*60;return c;};
{const G=fresh(),h=G.hero,c=away();h.inv={};const t=L.salvageTarget();L.check('a car out in the open can be salvaged',t&&t.kind==='car');
 L.siphonPanel(t);L.check('no hose or can: you can’t siphon',/hose/.test(document.getElementById('sSub').textContent||'')||L.state==='paused');
 h.inv={jerrycan:1,hose:1};const c0=G.clock,res=L.doSiphon(L.salvageTarget(),99);
 L.check('siphoning drains the car into your can at about 6% an hour',Math.abs(res.got-20)<0.5&&Math.abs((G.clock-c0)/60-20/6)<0.3&&c.fuel<0.5,'got '+res.got.toFixed(1)+'% in '+((G.clock-c0)/60).toFixed(2)+' hours');
 L.check('the full jerry can weighs more than an empty one',L.invWeight(h.inv)>L.ITEMS.jerrycan.kg+L.ITEMS.hose.kg+5,L.invWeight(h.inv)+' kg');
 const mine=G.cars.find(x=>x.id==='hero0');mine.fuel=50;mine.x=h.x+40;mine.y=h.y;L.useItem('jerrycan',h.inv,mine);
 L.check('pour it into your car; the can stays with you, empty',Math.abs(mine.fuel-70)<0.5&&h.inv.jerrycan===1&&L.canFill(h.inv)<0.5);}
{const G=fresh(),h=G.hero,c=away();c.fuel=45;h.inv={jerrycan:1,hose:1};L.doSiphon(L.salvageTarget(),99);L.check('one can holds 30% of a tank; the rest stays in the car',Math.abs(L.canFill(h.inv)-30)<0.5&&Math.abs(c.fuel-15)<0.5);}
// --- stripping: needs a toolkit; quality follows the part's condition; parts come off the car
{const G=fresh(),h=G.hero,c=away();G.clock=5*60;   // start at dawn so an 8-hour job stays in daylight
 G.cars.find(x=>x.id==='hero0').items={};h.inv={};c.engine=80;c.susp=40;c.tw=[90,50,10,0];c.cond=60;
 const t=L.salvageTarget();L.stripPanel(t);L.check('no toolkit: nothing comes off',(document.getElementById('sSub').textContent||'').includes('toolkit'));
 h.inv={toolkit:1};const jobs=L.strippable(t.src);const names=jobs.map(j=>j.item);console.log('strippable from a mixed-condition car:',jobs.map(j=>j.name+' → '+j.item+' ('+j.h+' h)').join('; '));
 L.check('quality follows condition: good tyre, worn tyre, good engine parts, worn springs, scrap',names.includes('tyre')&&names.includes('tyre_worn')&&names.includes('parts')&&names.includes('springs_used')&&names.includes('scrap')&&!jobs.some(j=>j.id==='tyre2'||j.id==='tyre3'));
 const c0=G.clock,r=L.doStrip(t,jobs);L.check('stripping it all takes hours and leaves a bare shell',(G.clock-c0)/60>=6&&c.engine===0&&c.susp===0&&c.tw.every(x=>x===0||x<30)&&L.strippable(t.src).length===0,((G.clock-c0)/60).toFixed(1)+' hours: '+r.done.join(', '));
 const k=G.cars.find(x=>x.id==='hero0');k.tw=[0,100,100,100];h.inv.tyre_worn=1;L.useItem('tyre_worn',h.inv,k);L.check('a worn tyre fits at half tread',k.tw[0]===50);}
// --- burnt-out wrecks can be worked over too, and remember it
{const G=fresh(),h=G.hero;let w=null;for(let cx=-50;cx<50&&!w;cx++)for(let cy=-50;cy<50&&!w;cy++){const ch=L.getChunk(cx,cy);if(ch.wrecks.length){w=ch.wrecks[0];w.id='k'+ch.cx+'_'+ch.cy+'_0';}}
 h.x=w.x+40;h.y=w.y;G.cars=G.cars.filter(c=>Math.hypot(c.x-h.x,c.y-h.y)>200);const t=L.salvageTarget();L.check('a wreck by the road can be salvaged',t&&t.kind==='wreck',t&&t.name);
 h.inv={toolkit:1};const n0=L.strippable(t.src).length;L.doStrip(t,L.strippable(t.src).slice(0,1));const sv=JSON.parse(JSON.stringify(L.saveData()));L.newGame(sv);L.G.hero.x=w.x+40;L.G.hero.y=w.y;
 const t2=L.salvageTarget();L.check('what you took from a wreck stays taken after saving',t2&&L.strippable(t2.src).length===n0-1);}
// --- at night, raiders sometimes find you at it; never by day
{let dayHits=0,nightHits=0,runs=150;for(let i=0;i<runs;i++){for(const night of [false,true]){const G=fresh(),h=G.hero,c=away();c.fuel=24;G.clock=night?23*60:11*60;h.inv={jerrycan:1,hose:1};G.foes=[];const r=L.doSiphon(L.salvageTarget(),99);if(r.ambush){if(night)nightHits++;else dayHits++;}}}
 L.check('no raiders by day; at night, a fair chance during a 4-hour siphon',dayHits===0&&nightHits>runs*0.15&&nightHits<runs*0.5,'ambushed '+dayHits+'/'+runs+' by day, '+nightHits+'/'+runs+' at night');
 const G=fresh(),h=G.hero,c=away();c.fuel=40;G.clock=23*60;h.inv={jerrycan:1,hose:1};let r;let tries=0;do{c.fuel=40;L.setFill(h.inv,0);G.foes=[];r=L.doSiphon(L.salvageTarget(),99);}while(!r.ambush&&tries++<40);
 L.check('when they come, they come on foot and they mean it',G.foes.filter(f=>!f.dead&&f.state==='alert').length>=2,G.foes.length+' raiders');}
// --- the mechanic sells cans and hoses, and fills cans; moving a can moves its fuel
{const G=fresh(),h=G.hero;h.x=L.LOCS[L.START].x;h.y=L.LOCS[L.START].y;L.syncNPCs();const mech=G.npcs.find(n=>n.def.role==='mechanic');h.inv={jerrycan:2,watch:2};
 const svc=L.servicesFor(mech,null).find(s=>s.k==='svc_cans');L.check('the mechanic will fill your empty cans',!!svc,svc&&svc.name);L.openTrade(mech);
 L.tradeClick({target:{closest:()=>({dataset:{a:'svc',k:'svc_cans'}})},stopPropagation(){}});for(let i=0;i<2;i++)L.tradeClick({target:{closest:()=>({dataset:{a:'offer',k:'watch'}})},stopPropagation(){}});L.doDeal();L.closeTrade();
 L.check('two empty cans filled for a couple of watches',Math.abs(L.canFill(h.inv)-60)<0.5,L.canFill(h.inv).toFixed(0)+'%');
 const car=G.cars.find(c=>c.id==='hero0');car.items={};L.openInv({kind:'car',car});L.invClick({target:{closest:()=>({dataset:{a:'put',k:'jerrycan'}})},stopPropagation(){}});L.closeInv();
 L.check('put one can in the boot: half the fuel goes with it',Math.abs(L.canFill(h.inv)-30)<0.5&&Math.abs(L.canFill(car.items)-30)<0.5);
 car.touched=true;const sv=JSON.parse(JSON.stringify(L.saveData()));L.newGame(sv);const c2=L.G.cars.find(c=>c.id==='hero0');L.check('fuel in cans survives saving, in your pockets and the boot',Math.abs(L.canFill(L.G.hero.inv)-30)<0.5&&Math.abs(L.canFill(c2.items)-30)<0.5);}
L.done();
