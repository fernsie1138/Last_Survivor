const L=require('./harness');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncNPCs();return L.G;}
const o=L.LOCS[L.START];
// --- walking in through the door; roof fades
{const G=fresh(),h=G.hero,b=o.bld.find(x=>x.kind==='pub');G.npcs=[];h.x=b.doorOut.x;h.y=b.doorOut.y;
 let wp=[b.doorIn,{x:b.x,y:b.y}];L.step(4,()=>{const p=wp[0];if(!p){L.stick.active=false;return;}if(Math.hypot(p.x-h.x,p.y-h.y)<8)wp.shift();else L.aim(Math.atan2(p.y-h.y,p.x-h.x),0.8);});L.clearInput();
 L.check('you can walk into the pub through its door',L.bInside(b,h.x,h.y,5));L.step(0.6);L.check('the roof fades while you are inside',b.roofA<0.05,'roof '+b.roofA.toFixed(2));
 const other=o.bld.find(x=>x!==b&&!x.tank);L.check('other roofs stay on',other.roofA>0.95);}
// --- walls are solid
{const G=fresh(),h=G.hero,b=o.bld.find(x=>x.kind==='house');G.npcs=[];const back=b.L(0,-b.h/2-30);h.x=back.x;h.y=back.y;
 L.step(3,()=>L.aim(Math.atan2(b.y-h.y,b.x-h.x)));L.clearInput();L.check('you cannot walk through a back wall',!L.bInside(b,h.x,h.y,0));}
{const G=fresh(),b=o.bld.find(x=>x.kind==='garage'),c=G.cars.find(c=>c.id==='hero0');G.npcs=[];const st=b.L(0,b.h/2+260);c.x=st.x;c.y=st.y;c.a=Math.atan2(b.y-c.y,b.x-c.x);
 G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);let inside=0;L.keys.ArrowUp=true;L.step(4,()=>{c.a=Math.atan2(b.y-c.y,b.x-c.x);if(L.bInside(b,c.x,c.y,0))inside++;});L.clearInput();
 L.check('a car cannot drive into a building, even the garage door',inside===0,'frames inside: '+inside+', car body '+c.cond.toFixed(0)+'%');}
// --- townsfolk over a day: they move, don't get stuck in walls, go home at night
{const G=fresh(),h=G.hero;h.x=o.x+3000;h.y=o.y;G.cars=[];L.syncNPCs();G.clock=7*60;const start=G.npcs.map(n=>({n,x:n.x,y:n.y,dist:0,lx:n.x,ly:n.y}));
 const stuckInWall=new Set();
 L.step(6*60,(i)=>{h.x=o.x+2000;h.y=o.y;if(i%30===0)for(const s of start){s.dist+=Math.hypot(s.n.x-s.lx,s.n.y-s.ly);s.lx=s.n.x;s.ly=s.n.y;
     for(const b of o.bld){if(b.tank)continue;const [lx,ly]=bLocal(b,s.n.x,s.n.y);const inWall=Math.abs(lx)<b.w/2+4&&Math.abs(ly)<b.h/2+4&&!(Math.abs(lx)<b.w/2-4&&Math.abs(ly)<b.h/2-4);
       if(inWall&&!(Math.abs(lx)<b.door/2&&ly>0))stuckInWall.add(s.n.def.name);}}});
 function bLocal(b,x,y){const c=Math.cos(b.rot),s=Math.sin(b.rot),dx=x-b.x,dy=y-b.y;return [dx*c+dy*s,-dx*s+dy*c];}
 const movers=start.filter(s=>!['publican','doctor','trader'].includes(s.n.def.role));
 const still=movers.filter(s=>s.dist<150).map(s=>s.n.def.name+' ('+s.n.def.role+')');
 L.check('townsfolk walk about during the day',still.length===0,'walked: '+movers.map(s=>s.n.def.name+' '+Math.round(s.dist)+'px').join(', '));
 L.check('nobody ends up wedged in a wall',stuckInWall.size===0,[...stuckInWall].join(', '));
 G.clock=22*60;for(const s of start){s.n.path=[];s.n.wait=0.01;}L.step(150,()=>{h.x=o.x+2000;h.y=o.y;});
 const settlers=G.npcs.filter(n=>n.def.role==='settler'),home=settlers.filter(n=>L.bInside(o.bld[n.def.home],n.x,n.y,0));
 L.check('settlers are home at night',home.length===settlers.length,home.length+' of '+settlers.length+' indoors at '+L.fmtClock(G.clock));}
// --- every dialogue branch, in many towns, with random hero states: nothing throws, no dead ends
{let errs=[],talks=0,steps=0,dead=0;const rnd=L.LOCS.filter(l=>l.npcs.length).slice(0,30);
 for(const loc of rnd){const G=fresh();G.hero.x=loc.x;G.hero.y=loc.y;L.syncNPCs();
   for(const n of G.npcs.filter(n=>n.loc===loc)){for(let rep=0;rep<3;rep++){
     const h=G.hero;h.water=Math.random()*100;h.food=Math.random()*100;h.hp=20+Math.random()*80;h.inv=Math.random()<0.5?{water:3}:{};
     try{L.startTalk(n);talks++;for(let k=0;k<6&&L.talk;k++){if(!L.talk.opts.length){dead++;L.endTalk();break;}L.chooseOpt(Math.floor(Math.random()*L.talk.opts.length));steps++;}if(L.talk)L.endTalk();}
     catch(e){errs.push(n.def.role+': '+e.message);try{L.endTalk();}catch(_){}}}}}
 L.check('dialogue sweep: no errors and no dead ends',errs.length===0&&dead===0,talks+' conversations, '+steps+' choices'+(errs.length?', errors: '+[...new Set(errs)].slice(0,3).join(' | '):'')+(dead?', dead ends '+dead:''));
 L.check('conversations close cleanly',L.state==='play');}
// --- rumours mark new places on the map; guards point the way to Haven
{const G=fresh();const s=G.npcs.find(n=>n.def.role==='settler'&&n.def.name!=='Dot'),k0=G.known.size;L.startTalk(s);L.chooseOpt(L.talk.opts.findIndex(x=>x.t==='Heard any news?'));
 L.check('a rumour marks a new place on your map',G.known.size===k0+1,L.talk.text);L.endTalk();
 const g=G.npcs.find(n=>n.def.role==='guard');L.startTalk(g);L.chooseOpt(L.talk.opts.findIndex(x=>x.t==='Which way to Haven?'));
 L.check('the guard sets Haven as your destination',G.dest===L.LOCS.findIndex(l=>l.goal)&&!!G.leg,L.talk.text);L.endTalk();}
// --- Dot's quest, start to finish, surviving a save in the middle
{const G=fresh(),dot=G.npcs.find(n=>n.def.name==='Dot');L.check('Dot lives in Rust Hollow',!!dot&&!!L.QCOL);
 L.startTalk(dot);L.chooseOpt(L.talk.opts.findIndex(x=>x.t==='Something wrong?'));L.chooseOpt(L.talk.opts.findIndex(x=>x.t==='I’ll look for it'));L.endTalk();
 L.check('accepting marks the ruin and starts the quest',G.flags.q_col==='active'&&G.known.has(L.QCOL.ruin),L.LOCS[L.QCOL.ruin].name);
 const sv=JSON.parse(JSON.stringify(L.saveData()));L.newGame(sv);const G2=L.G;L.check('quest survives saving',G2.flags.q_col==='active');
 // fetch the car from the ruin and drive it home (teleported for the test)
 const ru=L.LOCS[L.QCOL.ruin];G2.hero.x=ru.x;G2.hero.y=ru.y;L.syncCars();const qc=G2.cars.find(c=>c.id===L.QCOL.car);L.check('Col’s car is at the ruin',!!qc,qc&&qc.def.name);
 G2.hero.x=qc.x+qc.r+12;G2.hero.y=qc.y;L.enterCar(qc);qc.x=o.x;qc.y=o.y;L.exitCar(true);G2.hero.x=o.x;G2.hero.y=o.y;L.syncNPCs();L.syncCars();
 const d2=G2.npcs.find(n=>n.def.name==='Dot');qc.x=d2.x+80;qc.y=d2.y;G2.hero.inv={};L.startTalk(d2);const turnIn=L.talk.opts.findIndex(x=>typeof x.t==='function');
 L.check('Dot recognises the car',turnIn>=0);L.chooseOpt(turnIn);L.endTalk();
 L.check('quest completes with a reward',G2.flags.q_col==='done'&&G2.hero.inv.medkit===1&&G2.hero.inv.toolkit===1,JSON.stringify(G2.hero.inv));}
// --- ruins keep most of their crates indoors
{let inside=0,total=0;for(const l of L.LOCS)if(l.type==='ruin')for(const bx of l.boxes){total++;if(l.bld.some(b=>!b.tank&&L.bInside(b,bx.x,bx.y,0)))inside++;}
 L.check('ruin crates are inside the buildings',inside===total,inside+' of '+total);}
{const G=fresh();let ok=true;try{G.hero.x=o.x;G.hero.y=o.y;L.render();}catch(e){ok=false;console.log(e);}L.check('town renders',ok);}
L.done();
