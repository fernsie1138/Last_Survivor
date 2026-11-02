const L=require('./harness');
const R=L.roads.find(r=>r.cls==='highway'&&r.len>150000);L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const k=200,h=G.hero;
const c=L.makeCar('kestrel',R.xs[k],R.ys[k],Math.atan2(R.ys[k+1]-R.ys[k],R.xs[k+1]-R.xs[k]),{id:'tc',touched:true});G.cars=[c];h.x=c.x;h.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
const e=L.makeRaider('buggy',R.xs[k-20],R.ys[k-20],c.a,300);e.gunner=true;G.cars.push(e);
let seen=new Set(),log=0;
for(let f=0;f<600&&log<6;f++){const r2=L.roadInfo(c.x,c.y),jj=Math.min(R.n-1,r2.i+8);L.aim(Math.atan2(R.ys[jj]-c.y,R.xs[jj]-c.x));
  const before=new Set(G.bullets);L.update(1/60);
  for(const b of G.bullets)if(!before.has(b)&&!seen.has(b)){seen.add(b);b._t=0;b._min=1e9;console.log('new bullet: owner',b.owner,'dist to car',Math.round(Math.hypot(b.x-c.x,b.y-c.y)),'life',b.life.toFixed(2),'heading to car?',((b.vx*(c.x-b.x)+b.vy*(c.y-b.y))/Math.hypot(b.vx,b.vy)/Math.hypot(c.x-b.x,c.y-b.y)).toFixed(2));log++;}
  for(const b of seen){if(G.bullets.includes(b))b._min=Math.min(b._min,Math.hypot(b.x-c.x,b.y-c.y));}}
console.log('closest approach of each bullet to the car (needs <',(c.r+2).toFixed(0),'):',[...seen].map(b=>Math.round(b._min)).join(', '),' car cond',c.cond.toFixed(1));
