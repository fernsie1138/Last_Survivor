const L=require('./harness');
let ARENA=null;for(let t=0;t<50000&&!ARENA;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;if(L.landValue(x,y)>0.15&&L.roadInfo(x,y).d>3000&&!L.LOCS.some(l=>Math.hypot(l.x-x,l.y-y)<6000))ARENA={x,y};}
let shots=0,hits=0,tyre=0,runs=40;
for(let i=0;i<runs;i++){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;G.hero.x=ARENA.x;G.hero.y=ARENA.y;L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.syncT=1e9;for(const c of L.chunks.values())c.rocks=[];
  const c=L.makeCar('kestrel',ARENA.x,ARENA.y,0,{id:'tc',touched:true});G.cars=[c];L.enterCar(c);const e=L.makeRaider('buggy',c.x-60,c.y+90,0,300);e.gunner=true;G.cars.push(e);
  L.keys.ArrowUp=true;let prevB=G.bullets.length,prevT=c.tyres,prevC=c.cond,hit=false;
  for(let f=0;f<900;f++){c.a=0;L.update(1/60);if(G.bullets.length>prevB)shots+=G.bullets.length-prevB;prevB=G.bullets.length;if(prevT-c.tyres>20){tyre++;hit=true;}prevT=c.tyres;if(prevC-c.cond>0.5&&prevC-c.cond<6)hits++;prevC=c.cond;}
  L.clearInput();}
console.log('over',runs,'15-second chases:',shots,'shots fired,',hits,'hits on the car,',tyre,'tyre hits');
