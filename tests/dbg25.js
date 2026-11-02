// replicate the town test's day, then watch who fails to get home and why
const L=require('./harness');
for(let run=0;run<8;run++){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G,o=L.LOCS[L.START],h=G.hero;h.x=o.x+3000;h.y=o.y;G.cars=[];L.syncNPCs();G.clock=7*60;
 L.step(6*60,()=>{h.x=o.x+2000;h.y=o.y;});G.clock=22*60;for(const n of G.npcs){n.path=[];n.wait=0.01;}L.step(150,()=>{h.x=o.x+2000;h.y=o.y;});
 for(const n of G.npcs.filter(n=>n.def.role==='settler')){const hb=o.bld[n.def.home];if(L.bInside(hb,n.x,n.y,0))continue;
   const dc=Math.hypot(n.x-o.x,n.y-o.y);console.log('run',run,n.def.name,'not home:',Math.round(dc),'px from centre (wall at',o.rad-40+'), path',n.path.length,'wait',n.wait.toFixed(1),'stuck',n.stuck.toFixed(1),'fleeT',n.fleeT||0);}}
console.log('done');
