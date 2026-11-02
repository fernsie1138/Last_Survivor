const L=require('./harness');
const cities=L.LOCS.filter(l=>l.type==='city');
// --- every city has what a city should
for(const o of cities){const k={};for(const b of o.bld)k[b.kind]=(k[b.kind]||0)+1;const fk=o.faction==='fuelkings';
  const ok=o.bld.length>=50&&o.streets.length>=10&&['pub','garage','clinic','store'].every(x=>k[x])&&k.warehouse>=1&&(k.watertower||0)+(k.raintank||0)>=1&&o.paddocks.length>=2&&k.barn>=1&&(!fk||(k.oiltank>=4&&k.flare&&k.column));
  L.check(o.name+': a street grid, services, warehouses, water storage, farms'+(fk?', and an oil refinery':''),ok,o.bld.length+' buildings, '+o.streets.length+' streets, '+o.paddocks.length+' paddocks, '+(k.warehouse||0)+' warehouses'+(fk?', '+(k.oiltank||0)+' oil tanks':''));}
// --- nothing on a road, nothing overlapping, every door clear, everything inside the wall
{const corners=b=>{const c=Math.cos(b.rot),s=Math.sin(b.rot),out=[];for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1],[0,0]])out.push({x:b.x+u*b.w/2*c-v*b.h/2*s,y:b.y+u*b.w/2*s+v*b.h/2*c});return out;};
 let onRoad=[],overlap=[],blockedDoor=[],outside=[];
 for(const o of cities){for(const b of o.bld){for(const p of corners(b)){const ri=L.roadInfo(p.x,p.y);if(ri.r>=0&&ri.d<ri.w/2-2){onRoad.push(o.name+' '+b.kind);break;}}
     if(Math.hypot(b.x-o.x,b.y-o.y)+Math.hypot(b.w,b.h)/2>o.rad-40)outside.push(o.name+' '+b.kind);
     for(const q of o.bld){if(q===b)continue;if(L.bInside(q,b.x,b.y,-4)){overlap.push(o.name+' '+b.kind+'/'+q.kind);}}
     if(b.doorOut&&!b.tank&&o.bld.some(q=>q!==b&&L.bInside(q,b.doorOut.x,b.doorOut.y,-6)))blockedDoor.push(o.name+' '+b.kind);}}
 L.check('no city building sits on a road',onRoad.length===0,onRoad.slice(0,4).join(', '));
 L.check('no two buildings overlap',overlap.length===0,overlap.slice(0,4).join(', '));
 L.check('every door has clear ground in front of it',blockedDoor.length===0,blockedDoor.slice(0,4).join(', '));
 L.check('everything stands inside the town wall',outside.length===0,outside.slice(0,4).join(', '));}
// --- the townsfolk of a big city still get about, and home at night
{L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G,h=G.hero;G.encT=1e9;const o=cities.find(c=>!c.goal);h.x=o.x;h.y=o.y;L.syncNPCs();
 const start=G.npcs.map(n=>({n,x:n.x,y:n.y}));let wedged=new Set();
 L.step(150,()=>{h.x=o.x+o.rad-250;h.y=o.y;for(const n of G.npcs)for(const b of o.bld)if(b.tank&&L.bInside(b,n.x,n.y,2))wedged.add(n.def.name);});
 const moved=start.filter(s=>!['publican','doctor','trader','mechanic'].includes(s.n.def.role)&&Math.hypot(s.n.x-s.x,s.n.y-s.y)>150).length,movers=start.filter(s=>!['publican','doctor','trader','mechanic'].includes(s.n.def.role)).length;
 L.check('in a big city, townsfolk walk about by day',moved>=movers*0.7,moved+' of '+movers+' moved');L.check('nobody gets stuck inside a tank or tower',wedged.size===0,[...wedged].join(', '));
 G.clock=22*60;for(const n of G.npcs){n.path=[];n.wait=0.01;}let t=0;const settlers=G.npcs.filter(n=>n.def.role==='settler');
 while(t<300&&!settlers.every(n=>L.bInside(o.bld[n.def.home],n.x,n.y,0))){L.update(1/60);t+=1/60;h.x=o.x+o.rad-250;}
 const home=settlers.filter(n=>L.bInside(o.bld[n.def.home],n.x,n.y,0)).length;
 L.check('at night every settler finds their way home through the bigger streets',home===settlers.length,home+' of '+settlers.length+' home after '+Math.round(t)+' s');}
// --- the outback ruins
{const C=L.SHELL_CELL,all=[];for(let j=Math.floor(-550000/C);j<550000/C;j++)for(let i=Math.floor(-800000/C);i<800000/C;i++){const s=L.shellAt(i,j);if(s)all.push(s);}
 const road=all.filter(s=>L.roadInfo(s.x,s.y).d<1200).length,withBox=all.filter(s=>s.box).length;
 L.check('ruined buildings line the roads and dot the outback',all.length>800&&road>300,all.length+' in all, '+road+' beside a road');
 L.check('they keep off roads and out of towns, and away from mesas',all.every(s=>L.roadInfo(s.x,s.y).d>40&&!L.LOCS.some(l=>Math.hypot(l.x-s.x,l.y-s.y)<l.rad+300)&&!L.insideMesa(s.x,s.y,60)));
 const val=(table,rolls)=>{let v=0,n=0;for(let i=0;i<2000;i++){const inv=L.genLoot(table,i*97+5,rolls,null);for(const k in inv)v+=L.VALUE[k]*inv[k];n++;}return v/n;};
 const shellV=val('shell',1)*(withBox/all.length),ruinV=val('ruin',2);
 L.check('there’s very little to find in them',withBox/all.length<0.4&&shellV<ruinV*0.25,'only '+Math.round(100*withBox/all.length)+'% have a debris pile; average find per ruin worth '+shellV.toFixed(1)+' against '+ruinV.toFixed(0)+' for a crate in a proper ruined town');
 // walk and drive into a wall; look through one
 const s=all.find(s=>s.walls.some(w=>Math.hypot(w.x2-w.x1,w.y2-w.y1)>60)&&L.roadInfo(s.x,s.y).d>1500),w=s.walls.find(w=>Math.hypot(w.x2-w.x1,w.y2-w.y1)>60);
 const mx=(w.x1+w.x2)/2,my=(w.y1+w.y2)/2,nx=-(w.y2-w.y1),ny=w.x2-w.x1,nl=Math.hypot(nx,ny),ux=nx/nl,uy=ny/nl;
 L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;G.npcs=[];G.foes=[];const h=G.hero;h.x=mx+ux*150;h.y=my+uy*150;L.syncCars();G.cars=[];
 let through=false;const side0=Math.sign((h.x-mx)*ux+(h.y-my)*uy);L.step(5,()=>{L.aim(Math.atan2(my-h.y,mx-h.x),1);if(Math.sign((h.x-mx)*ux+(h.y-my)*uy)!==side0)through=true;for(const ch of L.chunks.values())ch.rocks=[];});L.clearInput();
 L.check('you can’t walk through a ruined wall',!through);
 const c=L.makeCar('ute',mx+ux*300,my+uy*300,Math.atan2(-uy,-ux),{id:'rc',touched:true,fuel:100});G.cars=[c];h.x=c.x;h.y=c.y;L.enterCar(c);const c0=c.cond;let cthrough=false;
 L.keys.ArrowUp=true;L.step(4,()=>{c.a=Math.atan2(my-c.y,mx-c.x);if(Math.sign((c.x-mx)*ux+(c.y-my)*uy)!==side0)cthrough=true;for(const ch of L.chunks.values())ch.rocks=[];});L.clearInput();
 L.check('…or drive through one, and hitting it hurts',!cthrough&&c.cond<c0,'body '+Math.round(c0)+'% → '+Math.round(c.cond)+'%');
 L.check('a ruined wall blocks line of sight',!L.losClear(mx+ux*120,my+uy*120,mx-ux*120,my-uy*120));
 let onWall=0;for(let cx=Math.floor((s.x-300)/640);cx<=Math.floor((s.x+300)/640);cx++)for(let cy=Math.floor((s.y-300)/640);cy<=Math.floor((s.y+300)/640);cy++){const ch=L.getChunk(cx,cy);for(const k of [...ch.rocks,...ch.decor,...ch.carSpawns])if(L.inShellWall(k.x,k.y,4))onWall++;}
 L.check('nothing is placed inside a wall',onWall===0);
 const bx=all.find(s=>s.box);const ch=L.getChunk(Math.floor(bx.box.x/640),Math.floor(bx.box.y/640));L.check('a debris pile can be searched like any container',ch.boxes.some(b=>b.id===bx.box.id&&b.kind==='rubble'));}
L.done();
