const L=require('./harness');
// 1) sleep ambush odds, larger sample
L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G,c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);
let on=0,off=0,N=600;for(const road of [true,false])for(let i=0;i<N;i++){G.hero.rest=10;G.hero.water=80;G.hero.hp=100;G.cars=G.cars.filter(x=>x.driver!=='raider');c.onRoad=road;L.doSleep(7,c);
  if(G.cars.some(x=>x.driver==='raider')){if(road)on++;else off++;}}
console.log('ambushed during a 7-hour sleep: on the road',(100*on/N).toFixed(0)+'%, off it',(100*off/N).toFixed(0)+'%  (expected about 40% and 13%)');
// 2) settlers getting home at night, with time to watch them
L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G2=L.G,o=L.LOCS[L.START],h=G2.hero;h.x=o.x+3000;h.y=o.y;G2.cars=[];L.syncNPCs();G2.clock=22*60;
for(const n of G2.npcs){n.path=[];n.wait=0.01;}
for(const secs of [60,120,240]){L.step(secs===60?60:secs/2,()=>{h.x=o.x+2000;h.y=o.y;});const s=G2.npcs.filter(n=>n.def.role==='settler');
  console.log('after',secs,'s:',s.map(n=>n.def.name+(L.bInside(o.bld[n.def.home],n.x,n.y,0)?' home':' out ('+Math.round(Math.hypot(n.x-o.bld[n.def.home].doorOut.x,n.y-o.bld[n.def.home].doorOut.y))+'px from door, '+(n.path.length?'walking':'waiting '+n.wait.toFixed(1))+')')).join('; '));}
