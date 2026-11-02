const L=require('./harness');
const R=L.roads.find(r=>r.cls==='highway'&&r.len>150000);L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const k=200,h=G.hero;
const c=L.makeCar('kestrel',R.xs[k],R.ys[k],Math.atan2(R.ys[k+1]-R.ys[k],R.xs[k+1]-R.xs[k]),{id:'tc',touched:true});G.cars=[c];h.x=c.x;h.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
const e=L.makeRaider('buggy',R.xs[k-20],R.ys[k-20],c.a,300);e.gunner=true;G.cars.push(e);
for(let f=0;f<200;f++){L.update(1/60);const nb=G.bullets.find(b=>isNaN(b.x));if(nb||f%50===0){console.log('frame',f,'car',c.x.toFixed(0),c.y.toFixed(0),'raider',e.x.toFixed(0),e.y.toFixed(0),'bullets',G.bullets.length,nb?'NaN bullet vx='+nb.vx+' life='+nb.life:'');if(nb)break;}}
