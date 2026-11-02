const L=require('./harness');
// place each car on a long straight stretch of road and measure performance
const R=L.roads[0];let best=0,bs=1e9;
for(let i=100;i<R.n-400;i+=10){let c=0;for(let k=i;k<i+250;k++){const a1=Math.atan2(R.ys[k]-R.ys[k-1],R.xs[k]-R.xs[k-1]),a2=Math.atan2(R.ys[k+1]-R.ys[k],R.xs[k+1]-R.xs[k]);let d=Math.abs(a2-a1);if(d>Math.PI)d=2*Math.PI-d;c+=d;}if(c<bs){bs=c;best=i;}}
function test(type,onRoad){
  L.newGame();L.arrive(L.LOCS[L.START],"intro");L.setDest(L.LOCS[L.START].links[0].to);L.depart();
  const G=L.G;G.encT=1e9;const a=Math.atan2(R.ys[best+1]-R.ys[best],R.xs[best+1]-R.xs[best]);
  let x=R.xs[best],y=R.ys[best];if(!onRoad){x+=-Math.sin(a)*900;y+=Math.cos(a)*900;}
  const c=L.makeCar(type,x,y,a,{id:'test'});G.cars=[c];G.hero.x=x;G.hero.y=y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(q=>q===c);
  let t100=null,t=0,top=0;L.keys.ArrowUp=true;
  while(t<12){L.update(1/60);t+=1/60;const kmh=c.speed*0.36;if(t100===null&&kmh>=100)t100=t;top=Math.max(top,kmh);}
  L.clearInput();return {top:Math.round(top),t100:t100?t100.toFixed(1)+'s':'never',burnPerMin:((100-c.fuel)/12*60).toFixed(1),cond:Math.round(c.cond)};
}
console.log('car'.padEnd(24),'road top  0-100   fuel%/min | off-road top  wear after 12s');
for(const k of ['kestrel','kingsford','wagon','ute','van','cruiser','bike','buggy','brute']){
  const a=test(k,true),b=test(k,false);
  console.log(L.CARS[k].name.padEnd(24),String(a.top).padStart(4)+' km/h',a.t100.padStart(6),String(a.burnPerMin).padStart(8),' |',String(b.top).padStart(6)+' km/h',' car condition '+b.cond+'%');
}
