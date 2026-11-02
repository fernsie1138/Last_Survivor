// raiders chasing a driver who heads cross-country through rocky ground
const L=require('./harness');
// rocky ranges country, with a clear run ahead (no mountain or canyon in the way) so the test measures how raiders handle boulders
function rocky(){for(let t=0;t<80000;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;
  if(!(L.landValue(x,y)>0.15&&L.zoneAt(x,y).biome==='ranges'&&L.roadInfo(x,y).d>4000&&!L.LOCS.some(l=>Math.hypot(l.x-x,l.y-y)<6000)))continue;
  const a=Math.random()*6.28;let clear=true;for(let d=-800;d<4000&&clear;d+=60)for(const off of [-260,0,260]){const px=x+Math.cos(a)*d-Math.sin(a)*off,py=y+Math.sin(a)*d+Math.cos(a)*off;if(L.terrainRaw(px,py)!==L.T.GROUND)clear=false;}
  if(clear)return {x,y,a};}}
function chase(secs){const A=rocky();L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;
  const c=G.cars.find(c=>c.id==='hero0');c.x=A.x;c.y=A.y;c.a=A.a;c.cond=1e6;c.tw=[1e6,1e6,1e6,1e6];c.susp=1e6;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
  for(let k=0;k<2;k++){const a=c.a+Math.PI+(k-0.5)*0.4;G.cars.push(L.makeRaider('buggy',c.x+Math.cos(a)*600,c.y+Math.sin(a)*600,c.a,200));}
  window.__stats={};let raiderSecs=0;const head=c.a;
  L.step(secs,i=>{L.aim(head+Math.sin(i/90)*0.6+G.camRot,0.8);for(const e of G.cars)if(e.driver==='raider'&&e.wipe<=0)raiderSecs+=1/60;});L.clearInput();
  return {s:window.__stats,mins:raiderSecs/60};}
const tot={mins:0};for(let k=0;k<16;k++){const r=chase(40);tot.mins+=r.mins;for(const q in r.s)tot[q]=(tot[q]||0)+r.s[q];}
console.log('off-road chase through the ranges:',JSON.stringify(tot),'→',((tot.contacts||0)/tot.mins).toFixed(2),'rock contacts and',(((tot.wipe_rock||0)+(tot.wipe_offroadrock||0))/tot.mins).toFixed(2),'rock wipeouts per raider-minute');
module.exports=tot;
