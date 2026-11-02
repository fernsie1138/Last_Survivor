const L=require('./harness');
let ARENA=null;for(let t=0;t<50000&&!ARENA;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;if(L.landValue(x,y)>0.15&&L.roadInfo(x,y).d>3000&&!L.LOCS.some(l=>Math.hypot(l.x-x,l.y-y)<6000))ARENA={x,y};}
L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;G.hero.x=ARENA.x;G.hero.y=ARENA.y;L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.syncT=1e9;for(const c of L.chunks.values())c.rocks=[];
const c=L.makeCar('kestrel',ARENA.x,ARENA.y,0,{id:'tc',touched:true});G.cars=[c];L.enterCar(c);const e=L.makeRaider('buggy',c.x-60,c.y+90,0,300);e.gunner=true;G.cars.push(e);
L.keys.ArrowUp=true;for(let f=0;f<900;f++){c.a=0;L.update(1/60);if(f%60===0)console.log((f/60)+'s dist',Math.round(Math.hypot(e.x-c.x,e.y-c.y)),'raider',G.cars.includes(e)?(e.wipe>0?'wiping':'ok stab '+Math.round(e.stab)):'gone','gcd',(e.gcd||0).toFixed(2),'onRoad',e.onRoad,'speeds',Math.round(c.speed*.36),Math.round(e.speed*.36));}
