const L=require('./harness');
// over many random spots off-road, how often does a raider reach a hero on foot, and how often does it crash first?
let reached=0,crashed=0,N=40;
for(let n=0;n<N;n++){
  L.newGame();L.arrive(L.LOCS[L.START],"intro");L.setDest(L.LOCS[L.START].links[0].to);L.depart();const G=L.G;G.encT=1e9;
  const h=G.hero;h.x=20000+n*3000;h.y=-30000+n*1700;G.cars=[];const ang=Math.random()*6.28;
  const e=L.makeRaider('buggy',h.x+Math.cos(ang)*900,h.y+Math.sin(ang)*900,ang+Math.PI,250);G.cars.push(e);
  let t=0;while(t<10&&L.state==='play'){L.update(1/60);t+=1/60;if(h.hp<100){reached++;break;}if(!G.cars.includes(e)||e.wipe>0){crashed++;break;}}
}
L.check('raiders usually reach a hero on foot',reached>=N*0.75,reached+'/'+N+' reached, '+crashed+' crashed into terrain first');
L.done();
