const L=require('./harness');
L.newGame();L.arrive(L.OUTPOSTS[0],'intro');L.setCourse(L.OUTPOSTS[0],L.OUTPOSTS[0].links[0]);const G=L.G;G.encT=1e9;
const h=G.hero;h.x=20000;h.y=20000;G.cars=G.cars.filter(c=>c.id==='hero0');G.cars[0].x=h.x+200;G.cars[0].y=h.y;
const e=L.makeRaider('buggy',h.x-900,h.y,0,300);G.cars.push(e);
for(let i=0;i<360;i++){L.update(1/60);if(i%30==0)console.log((i/60).toFixed(1),'state',L.state,'raider present',G.cars.includes(e),'d',Math.hypot(e.x-h.x,e.y-h.y).toFixed(0),'spd',e.speed.toFixed(0),'stab',(e.stab||0).toFixed(0),'wipe',e.wipe.toFixed(2),'hp',h.hp.toFixed(0),'cars',G.cars.length);}
