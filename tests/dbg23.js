const L=require('./harness');L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G,o=L.LOCS[L.START],c=G.cars.find(c=>c.id==='hero0');
console.log('car at',Math.round(Math.hypot(c.x-o.x,c.y-o.y)),'px from centre, facing',(c.a*57.3).toFixed(0),'deg; gates at',o.gates.map(g=>(g.a*57.3).toFixed(0)+(g.side?'s':'r')).join(','),'; exits',o.exits.map(e=>(e*57.3).toFixed(0)).join(','));
L.enterCar(c);L.keys.ArrowUp=true;for(let i=0;i<240;i++){const px=c.x,py=c.y;L.update(1/60);if(i%40===0){
  const near=[];for(const w of o.wall){const R=o.rad-40+w.j,wx=o.x+Math.cos(w.a)*R,wy=o.y+Math.sin(w.a)*R;if(Math.hypot(wx-c.x,wy-c.y)<60)near.push((w.a*57.3).toFixed(0));}
  const bld=o.bld.filter(b=>Math.hypot(b.x-c.x,b.y-c.y)<Math.hypot(b.w,b.h)/2+30).map(b=>b.kind);
  console.log((i/60).toFixed(1)+'s r='+Math.round(Math.hypot(c.x-o.x,c.y-o.y)),'speed',Math.round(c.speed*.36),'near walls at',near.join(',')||'-','near buildings',bld.join(',')||'-','cars near',G.cars.filter(k=>k!==c&&Math.hypot(k.x-c.x,k.y-c.y)<60).map(k=>k.id).join(',')||'-');}}
