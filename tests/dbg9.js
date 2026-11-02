const L=require('./harness');
L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;
const ri=L.roads.findIndex(R=>R.cls==='dirt'&&R.len>60000),R=L.roads[ri];let i=200;
const a=Math.atan2(R.ys[i+1]-R.ys[i],R.xs[i+1]-R.xs[i]);G.cars=G.cars.filter(c=>c.id==='hero0');const c=G.cars[0];
c.x=R.xs[i];c.y=R.ys[i];c.a=a;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);for(const k of L.chunks.values())k.rocks=[];
let offFrames=0,frames=0,lastCond=100,events=[];
L.keys.ArrowUp=true;
for(let f=0;f<480;f++){const b=c,ri2=L.roadInfo(b.x,b.y),j=Math.max(0,Math.min(R.n-1,ri2.i+Math.round(5+b.speed/60)));
  L.keys.ArrowUp=false;L.aim(Math.atan2(R.ys[j]-b.y,R.xs[j]-b.x));L.update(1/60);frames++;if(!c.onRoad)offFrames++;
  if(lastCond-c.cond>0.5)events.push(f+':'+(lastCond-c.cond).toFixed(1)+(c.onRoad?'on':'off'));lastCond=c.cond;}
console.log('cond',c.cond.toFixed(1),'off-road frames',offFrames,'/',frames,'big drops',events.slice(0,8).join(' '),'speed',(c.speed*.36).toFixed(0));
