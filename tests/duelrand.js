const L=require('./harness');
let ARENA=L.flatSpot();   // open, level ground
// one fight with randomised distance, spread, readiness and time of day
function fight(myW,ammo,foes,tex){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;G.hero.x=ARENA.x;G.hero.y=ARENA.y;G.clock=(9+Math.random()*8)*60;
  L.syncCars();G.cars=[];G.npcs=[];G.foes=[];G.syncT=1e9;for(const c of L.chunks.values()){c.rocks=[];c.wrecks=[];}
  const h=G.hero;h.inv={};if(myW){h.inv[myW]=1;h.weapon=myW;}if(ammo)h.inv[L.WEAPONS[L.ITEMS[myW].weapon].ammo]=ammo;
  if(tex)L.recruit({def:{id:'c_gunhand',comp:'gunhand'},x:h.x-20,y:h.y+20});
  const base=Math.random()*6.28,dist=130+Math.random()*150;
  const fs=foes.map((w,i)=>{const a=base+(i-1)*(0.3+Math.random()*0.5),r=dist+Math.random()*60;const f=L.makeFoe({id:'t'+i,weapon:w,post:{x:0,y:0},patrol:[{x:0,y:0}],seed:5+i,brave:true},null,h.x+Math.cos(a)*r,h.y+Math.sin(a)*r);
    f.a=a+Math.PI;f.loose=true;f.cd=Math.random()*1.2;f.state='alert';f.detect=1;f.lastSeen={x:h.x,y:h.y};G.foes.push(f);return f;});
  const W=L.heroWeapon();let t=0;
  while(t<60&&h.hp>0&&fs.some(f=>!f.dead&&f.state!=='flee')){const tg=fs.filter(f=>!f.dead&&f.state!=='flee').sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    const d=Math.hypot(tg.x-h.x,tg.y-h.y),a=Math.atan2(tg.y-h.y,tg.x-h.x);
    if(W.gun){L.stick.active=false;h.a=a;if(h.atkCd<=0&&h.inv[W.ammo])L.heroAttack();else if(!h.inv[W.ammo]){if(d>W.range+14)L.aim(a,0.8);}}
    else{if(d>W.range+14)L.aim(a,0.8);else{L.stick.active=false;h.a=a;if(h.atkCd<=0)L.heroAttack();}}
    L.update(1/60);t+=1/60;if(L.state!=='play')break;}
  L.clearInput();return {win:h.hp>0,hp:Math.max(0,h.hp)};}
function series(label,args,n){let w=0,hp=0;for(let i=0;i<n;i++){const r=fight(...args);if(r.win){w++;hp+=r.hp;}}
  console.log(label.padEnd(40),'won',String(w).padStart(2)+'/'+n,'('+Math.round(100*w/n)+'%)  avg health left when winning',w?Math.round(hp/w):'-');return w/n;}
module.exports={series,fight};
if(require.main===module){const N=+process.argv[2]||30;
  series('fists vs 1 knife raider',[null,0,['knife']],N);series('cricket bat vs 1 knife raider',['bat',0,['knife']],N);
  series('cricket bat vs 3 raiders',['bat',0,['knife','bat','knife']],N);series('cricket bat vs 3 raiders, with Tex',['bat',0,['knife','bat','knife'],true],N);
  series('revolver (12) vs 3 raiders',['revolver',12,['knife','bat','knife']],N);series('fists vs 1 revolver raider',[null,0,['revolver']],N);}
