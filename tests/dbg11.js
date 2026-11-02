const L=require('./harness');
L.newGame();L.arrive(L.LOCS[L.START],"intro");
const R=L.roads.find(r=>r.cls==='highway'&&L.LOCS[r.a].service&&L.LOCS[r.b].service&&r.len>130000),ri=L.roads.indexOf(R),from=L.LOCS[R.a];
const G=L.G;G.lastNode=from.id;L.setDest(R.b);L.depart();G.cars=[];const c=L.makeCar('kestrel',from.x,from.y,Math.atan2(R.ys[14]-from.y,R.xs[14]-from.x),{id:'test',touched:true});
G.cars.push(c);G.hero.x=c.x;G.hero.y=c.y;G.inside=from.id;L.enterCar(c);G.encT=5;
let t=0,last=100,log=[],offT=0;
while(L.state==='play'&&t<200){const car=L.heroCar();if(!car)break;const b=car,r2=L.roadInfo(b.x,b.y);let tx,ty;
  if(r2.r===ri){const j=Math.max(0,Math.min(R.n-1,r2.i+Math.round(5+b.speed/60)));tx=R.xs[j];ty=R.ys[j];}else{tx=L.LOCS[R.b].x;ty=L.LOCS[R.b].y;}
  L.aim(Math.atan2(ty-b.y,tx-b.x));L.update(1/60);t+=1/60;if(!car.onRoad)offT+=1/60;
  if(last-car.cond>0.3){const near=G.cars.filter(e=>e!==car&&Math.hypot(e.x-car.x,e.y-car.y)<car.r+e.r+8).map(e=>e.type+':'+(e.mode||'')+':stab'+Math.round(e.stab||0)+':spd'+Math.round(e.speed*.36));
    log.push(t.toFixed(1)+'s -'+(last-car.cond).toFixed(1)+' road='+(r2.r===ri)+' d='+r2.d.toFixed(0)+' near:'+near.join(','));}last=car.cond;}
console.log('no raiders: survived',L.state,'cond',L.heroCar()?L.heroCar().cond.toFixed(0):'wrecked','time',t.toFixed(0),'off-road s',offT.toFixed(1));
console.log(log.slice(0,15).join('\n'));
