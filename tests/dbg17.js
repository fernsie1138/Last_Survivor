const L=require('./harness');
for(let run=0;run<6;run++){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const o=L.LOCS[L.START];
 const h=G.hero;h.x=o.x+3000;h.y=o.y;G.cars=[];L.syncNPCs();G.clock=7*60;const bev=G.npcs.find(n=>n.def.role==='guard');let found=null;
 for(let i=0;i<6*60*60&&!found;i++){h.x=o.x+2000;h.y=o.y;L.update(1/60);if(i%30)continue;
   for(const b of o.bld){if(b.tank)continue;const c=Math.cos(b.rot),s=Math.sin(b.rot),dx=bev.x-b.x,dy=bev.y-b.y,lx=dx*c+dy*s,ly=-dx*s+dy*c;
     const inWall=Math.abs(lx)<b.w/2+4&&Math.abs(ly)<b.h/2+4&&!(Math.abs(lx)<b.w/2-4&&Math.abs(ly)<b.h/2-4);
     if(inWall&&!(Math.abs(lx)<b.door/2&&ly>0))found={t:(i/60).toFixed(0),kind:b.kind,lx:lx.toFixed(1),ly:ly.toFixed(1),w:b.w,h:b.h,door:b.door,path:JSON.stringify(bev.path.slice(0,2).map(p=>[Math.round(p.x-o.x),Math.round(p.y-o.y)])),wait:bev.wait.toFixed(1)};}}
 console.log('run',run,found?JSON.stringify(found):'ok');}
