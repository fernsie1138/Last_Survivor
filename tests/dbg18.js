const L=require('./harness');
let ARENA=null;for(let t=0;t<50000&&!ARENA;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;if(L.landValue(x,y)>0.15&&L.roadInfo(x,y).d>3000&&!L.LOCS.some(l=>Math.hypot(l.x-x,l.y-y)<6000))ARENA={x,y};}
function fight(opts){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;if(opts.sync)L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.hero.x=ARENA.x;G.hero.y=ARENA.y;G.clock=opts.clock||G.clock;L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.syncT=1e9;for(const c of L.chunks.values()){c.rocks=[];c.wrecks=[];}
  const h=G.hero;h.inv={bat:1};h.weapon='bat';
  const fs=['knife','bat','knife'].map((w,i)=>{const f=L.makeFoe({id:'t'+i,weapon:w,post:{x:0,y:0},patrol:[{x:0,y:0}],seed:5,brave:true},null,h.x+(opts.near?150:160)+i*30,h.y+(i-1)*40);f.a=Math.PI;f.loose=true;if(opts.cd)f.cd=0.5;f.state='alert';f.detect=1;f.lastSeen={x:h.x,y:h.y};G.foes.push(f);return f;});
  let t=0;while(t<60&&h.hp>0&&fs.some(f=>!f.dead&&f.state!=='flee')){const tg=fs.filter(f=>!f.dead&&f.state!=='flee').sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    const d=Math.hypot(tg.x-h.x,tg.y-h.y),a=Math.atan2(tg.y-h.y,tg.x-h.x);if(d>52)L.aim(a,0.8);else{L.stick.active=false;h.a=a;if(h.atkCd<=0)L.heroAttack();}L.update(1/60);t+=1/60;if(L.state!=='play')break;}
  L.clearInput();return h.hp>0;}
for(const [lab,o] of [['as in the new test',{sync:true}],['clock noon',{sync:true,clock:12*60}],['foes start cd 0.5',{sync:true,cd:true}],['all of the Phase 5 setup',{clock:12*60,cd:true,near:true}]]){
  let w=0;for(let i=0;i<10;i++)if(fight(o))w++;console.log(lab.padEnd(28),'won',w+'/10');}
