// how often do raider cars hit rocks? a passive driver goes down gravel and dirt roads (boulders line their edges) with raiders on its tail
const L=require('./harness');
function runOn(cls,secs){const R=L.roads.filter(r=>r.cls===cls&&r.len>60000)[0];L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;
  const c=G.cars.find(c=>c.id==='hero0'),i0=30;c.x=R.xs[i0];c.y=R.ys[i0];c.a=Math.atan2(R.ys[i0+1]-R.ys[i0],R.xs[i0+1]-R.xs[i0]);G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();
  G.cars=G.cars.filter(x=>x===c);G.encT=2;c.cond=1e6;c.tw=[1e6,1e6,1e6,1e6];   // an unbreakable car, so the test only measures the raiders
  window.__stats={};let raiderSecs=0,wipes=0,seen=new Set();
  L.step(secs,()=>{const r2=L.roadInfo(c.x,c.y),j=Math.min(R.n-1,r2.i+Math.round(5+c.speed/60));L.aim(Math.atan2(R.ys[j]-c.y,R.xs[j]-c.x)+G.camRot,0.75);
    for(const e of G.cars)if(e.driver==='raider'){raiderSecs+=1/60;if(e.wipe>0&&!seen.has(e)){seen.add(e);wipes++;}}if(r2.i>R.n-60)c.a+=Math.PI;});L.clearInput();
  for(const k in window.__stats)if(k!=='raiderCrash')tot2[k]=(tot2[k]||0)+window.__stats[k];return {crashes:window.__stats.raiderCrash||0,mins:raiderSecs/60,wipes};}
const tot2={};
let tot={crashes:0,mins:0,wipes:0};for(const cls of ['gravel','dirt'])for(let k=0;k<3;k++){const r=runOn(cls,90);tot.crashes+=r.crashes;tot.mins+=r.mins;tot.wipes+=r.wipes;}
console.log('raider rock/wreck crashes:',tot.crashes,'in',tot.mins.toFixed(1),'raider-minutes =',(tot.crashes/Math.max(0.1,tot.mins)).toFixed(2),'per raider-minute; wipeouts',tot.wipes);
console.log('details:',JSON.stringify(tot2));module.exports=tot;
