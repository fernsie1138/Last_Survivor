const L=require('./harness');
let ARENA=null;for(let t=0;t<50000&&!ARENA;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;
  if(L.landValue(x,y)>0.15&&L.roadInfo(x,y).d>3000&&!L.LOCS.some(l=>Math.hypot(l.x-x,l.y-y)<6000))ARENA={x,y};}
L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;G.hero.x=ARENA.x;G.hero.y=ARENA.y;L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.syncT=1e9;for(const c of L.chunks.values())c.rocks=[];
const h=G.hero;h.inv={revolver:1,bullets:12};h.weapon='revolver';
const fs=['knife','bat','knife'].map((w,i)=>{const f=L.makeFoe({id:'t'+i,weapon:w,post:{x:0,y:0},patrol:[{x:0,y:0}],seed:5,brave:true},null,h.x+150+i*30,h.y+(i-1)*40);f.a=Math.PI;f.loose=true;f.state='alert';f.detect=1;f.lastSeen={x:h.x,y:h.y};G.foes.push(f);return f;});
for(let i=0;i<300;i++){L.update(1/60);if(i%20===0)console.log((i/60).toFixed(2),'s', fs.map(f=>f.state[0]+Math.round(f.hp)+'@'+Math.round(Math.hypot(f.x-h.x,f.y-h.y))+(f.stun>0?'S':'')+(f.wind>0?'W':'')).join(' '),'hero',Math.round(h.hp),'shots left',h.inv.bullets||0);
  const tg=fs.filter(f=>!f.dead)[0];if(!tg)break;h.a=Math.atan2(tg.y-h.y,tg.x-h.x);if(h.atkCd<=0)L.heroAttack();}
