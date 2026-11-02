const L=require('./harness');
function run(cls,aggressive){
  L.newGame();L.arrive(L.LOCS[L.START],"intro");
  const R=L.roads.find(r=>r.cls===cls&&L.LOCS[r.a].service&&L.LOCS[r.b].service&&r.len>130000),ri=L.roads.indexOf(R),from=L.LOCS[R.a];
  const G=L.G;G.lastNode=from.id;L.setDest(R.b);L.depart();G.cars=[];const c=L.makeCar('kestrel',from.x,from.y,Math.atan2(R.ys[14]-from.y,R.xs[14]-from.x),{id:'test',touched:true});
  G.cars.push(c);G.hero.x=c.x;G.hero.y=c.y;G.inside=from.id;L.enterCar(c);G.encT=20;
  let t=0,minCond=100,wreck=false;
  while(L.state==='play'&&t<1200&&G.lastNode!==R.b){const car=L.heroCar(),b=L.body();if(!car||car.cond<=0){wreck=true;break;}   // a car battered to zero is out of the race
    const r2=L.roadInfo(b.x,b.y);let tx,ty;const tgt=aggressive&&G.cars.find(e=>e.driver==='raider'&&e.wipe<=0&&Math.hypot(e.x-b.x,e.y-b.y)<220);
    if(tgt){tx=tgt.x+Math.cos(tgt.a)*70;ty=tgt.y+Math.sin(tgt.a)*70;}
    else if(r2.r===ri){const j=Math.max(0,Math.min(R.n-1,r2.i+Math.round(5+b.speed/60)));tx=R.xs[j];ty=R.ys[j];}else{tx=L.LOCS[R.b].x;ty=L.LOCS[R.b].y;}
    L.aim(Math.atan2(ty-b.y,tx-b.x));L.update(1/60);t+=1/60;const hc=L.heroCar();if(hc)minCond=Math.min(minCond,hc.cond);}
  L.clearInput();return {made:G.lastNode===R.b&&!wreck,wreck,min:t/60,minCond,wiped:G.wiped,len:R.len/10000};
}
for(const cls of ['highway','gravel'])for(const ag of [false,true]){const rs=[];for(let i=0;i<8;i++)rs.push(run(cls,ag));
  console.log((cls+(ag?', shoving':', passive')).padEnd(18),rs[0].len.toFixed(0)+' km','arrived',rs.filter(r=>r.made).length+'/8','destroyed',rs.filter(r=>r.wreck).length,
    'avg minutes',(rs.reduce((a,r)=>a+r.min,0)/8).toFixed(1),'avg lowest condition',Math.round(rs.reduce((a,r)=>a+r.minCond,0)/8)+'%','avg wiped',(rs.reduce((a,r)=>a+r.wiped,0)/8).toFixed(1));}
