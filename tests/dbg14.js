const L=require('./harness');L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;
let target=null;for(const l of L.LOCS){const p=L.routePath(L.START,l.id);if(p&&p.legs.length===3&&l.type!=='ruin'){target=l;break;}}
L.setDest(target.id);const c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);
console.log('dest',target.name,'leg',JSON.stringify(G.leg),'state',L.state);
let t=0;let ln=G.lastNode;while(t<1500&&G.dest!==null){const b=L.body(),Lg=G.leg;if(!Lg){console.log("no leg");break;}const R=L.roads[Lg.road],ri=L.roadInfo(b.x,b.y);let tx,ty;
  if(ri.r===Lg.road){const j=Math.max(0,Math.min(R.n-1,ri.i+Lg.dir*Math.round(5+b.speed/60)));tx=R.xs[j];ty=R.ys[j];}else{tx=L.LOCS[Lg.to].x;ty=L.LOCS[Lg.to].y;}
  L.aim(Math.atan2(ty-b.y,tx-b.x));L.update(1/60);t+=1/60;
  if(G.lastNode!==ln){ln=G.lastNode;console.log((t/60).toFixed(1)+' min reached',L.LOCS[ln].name,'dest',G.dest,'next leg',JSON.stringify(G.leg));}if(Math.round(t*60)%3600===0)console.log((t/60).toFixed(0)+' min: speed',(c.speed*.36).toFixed(0),'pos',c.x.toFixed(0),c.y.toFixed(0),'onLeg',G.onLeg,'state',L.state);}
