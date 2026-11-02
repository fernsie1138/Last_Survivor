const L=require('./harness');
function fight(weapon,n){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const A=L.flatSpot();const h=G.hero;h.x=A.x;h.y=A.y;L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.animals=[];G.wildT=1e9;G.clock=12*60;
  for(const c of L.chunks.values())c.rocks=[];h.hp=100;h.inv=weapon?{[weapon]:1,bullets:12}:{};h.weapon=weapon;
  const dogs=[];for(let i=0;i<n;i++)dogs.push(L.spawnAnimal('dingo',h.x+200+i*30,h.y+i*25));
  let t=0;while(t<40&&h.hp>0&&dogs.some(d=>d.state==='chase'||(d.state!=='dead'&&d.state!=='flee'))){const tg=dogs.filter(d=>d.state!=='dead').sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    if(tg&&h.atkCd<=0){h.a=Math.atan2(tg.y-h.y,tg.x-h.x);L.heroAttack();}L.update(1/60);t+=1/60;if(dogs.every(d=>d.state==='dead'||d.state==='flee'))break;}
  return {won:h.hp>0,hp:Math.max(0,h.hp),killed:dogs.filter(d=>d.state==='dead').length};}
for(const [w,name] of [[null,'fists'],['bat','cricket bat'],['revolver','revolver']])for(const n of [1,2]){let won=0,hp=0,k=0,runs=20;for(let i=0;i<runs;i++){const r=fight(w,n);if(r.won){won++;hp+=r.hp;}k+=r.killed;}
  console.log((name+' vs '+n+(n>1?' dingoes':' dingo')).padEnd(26),'survived '+won+'/'+runs,' avg health left '+(won?Math.round(hp/won):'-'),' dingoes killed '+(k/runs).toFixed(1)+' of '+n+' (the rest fled hurt)');}
