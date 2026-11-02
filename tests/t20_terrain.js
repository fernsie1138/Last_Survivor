const L=require('./harness');const T=L.T;
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncCars();return L.G;}
const NAME={0:'ground',1:'sea',2:'river',3:'dry creek bed',4:'canyon',5:'mountain',6:'mesa',7:'road cutting',8:'bridge over water',9:'bridge over canyon'};
// --- every road is passable along its whole length, and we count the bridges and cuttings on the way
{fresh();let blocked=[],pts=0,bridges=0,cuts=0,lastT=-1;
 for(const R of L.roads){for(let i=0;i<R.n;i+=3){pts++;const t=L.terrainAt(R.xs[i],R.ys[i]);if(L.blockedAt(R.xs[i],R.ys[i]))blocked.push(L.LOCS[R.a].name+'→'+L.LOCS[R.b].name);
     if(t!==lastT){if(t===T.BRIDGE_W||t===T.BRIDGE_C)bridges++;if(t===T.CUT)cuts++;}lastT=t;}
   if(L.chunks.size>3000)L.chunks.clear();}
 L.check('every one of the '+L.roads.length+' roads is passable end to end',blocked.length===0,pts+' road points checked'+(blocked.length?'; blocked on '+[...new Set(blocked)].slice(0,5).join(', '):'')+'; '+bridges+' bridges and '+cuts+' cuttings along the way');
 L.check('roads cross rivers and canyons on bridges; there are no cuttings any more',bridges>=15&&cuts===0);}
// --- towns stand on clear ground
{L.chunks.clear();let bad=[];for(const l of L.LOCS){for(let a=0;a<6.28;a+=0.4)for(let d=0;d<l.rad+450;d+=60){const x=l.x+Math.cos(a)*d,y=l.y+Math.sin(a)*d;if(L.blockedAt(x,y)&&L.landValue(x,y)>0.02){bad.push(l.name);break;}}if(L.chunks.size>2000)L.chunks.clear();}
 L.check('no town or ruin has mountains, mesas, canyons or rivers inside it',bad.length===0,[...new Set(bad)].join(', ')||L.LOCS.length+' places checked');}
// --- how much of the land is what
{L.chunks.clear();const cnt={};let n=0;for(let y=-540000;y<540000;y+=3000)for(let x=-790000;x<790000;x+=3000){if(L.landValue(x,y)<0)continue;n++;const t=L.terrainRaw(x,y);cnt[t]=(cnt[t]||0)+1;}
 console.log('share of the land:',Object.keys(cnt).map(k=>NAME[k]+' '+(100*cnt[k]/n).toFixed(1)+'%').join(', '));
 L.check('rivers, creek beds and canyons exist; the old mountains and blob mesas are gone',[T.RIVER,T.DRY,T.CANYON].every(k=>cnt[k]>0)&&!cnt[5]&&!cnt[6]);}
// find places: a spot of a given terrain type, reachable from open ground
function findType(type,needFlat){for(let t=0;t<200000;t++){const x=(Math.random()*2-1)*780000,y=(Math.random()*2-1)*530000;if(L.landValue(x,y)<0.05)continue;
  if(L.terrainRaw(x,y)!==type||L.roadInfo(x,y).d<2000||L.LOCS.some(l=>Math.hypot(l.x-x,l.y-y)<5000))continue;
  for(let a=0;a<6.28;a+=0.39){for(let d=60;d<1500;d+=30){const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(L.terrainRaw(px,py)===T.GROUND){return {x,y,gx:x+Math.cos(a)*(d+250),gy:y+Math.sin(a)*(d+250),toward:a+Math.PI};}}}}return null;}
// --- impassable features: drive straight at them and never get inside
for(const [type,hurts] of [[T.CANYON,false],[T.RIVER,false]]){const p=findType(type);if(!p){L.check(NAME[type]+' found to test',false);continue;}
  const G=fresh(),c=G.cars.find(c=>c.id==='hero0');G.npcs=[];c.x=p.gx;c.y=p.gy;c.a=p.toward;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
  for(const k of L.chunks.values())k.rocks=[];let inside=0;const c0=c.cond;L.keys.ArrowUp=true;L.step(8,()=>{c.a=Math.atan2(p.y-c.y,p.x-c.x);for(const k of L.chunks.values())k.rocks=[];if(L.blockedAt(c.x,c.y))inside++;});L.clearInput();
  L.check('you can’t drive into '+(type===T.CANYON?'a canyon':'a flowing river')+(hurts?' (it’s a rock face: it hurts the car)':' (you stop at the edge)'),inside===0&&(hurts?c.cond<c0:c.cond>=c0-1),'frames inside: '+inside+', body '+Math.round(c0)+'% → '+Math.round(c.cond)+'%');}
// --- dry creek beds: you can drive along them, but the sand slows you
{const p=findType(T.DRY);const G=fresh(),c=G.cars.find(c=>c.id==='hero0');c.x=p.x;c.y=p.y;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
 L.check('a dry creek bed is not blocked',!L.blockedAt(p.x,p.y));c.terr=L.terrainAt(c.x,c.y);L.check('…and it counts as soft sand',c.terr===T.DRY);}
// --- hills: steep climbs slow cars and people; downhill helps
{let best=null,bg=0;for(let t=0;t<40000;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;if(L.landValue(x,y)<0.15||L.terrainRaw(x,y)!==T.GROUND)continue;
   const a=Math.random()*6.28,g=(L.heightAt(x+Math.cos(a)*24,y+Math.sin(a)*24)-L.heightAt(x,y))/24;if(g>bg){bg=g;best={x,y,a};}if(L.chunks.size>2500)L.chunks.clear();}
 const up=L.slopeFactor(best.x,best.y,Math.cos(best.a),Math.sin(best.a),true),down=L.slopeFactor(best.x,best.y,-Math.cos(best.a),-Math.sin(best.a),true),walk=L.slopeFactor(best.x,best.y,Math.cos(best.a),Math.sin(best.a),false);
 L.check('the steepest climbs cut your speed hard; going down is a little quicker',up<0.75&&down>1&&walk<up,'steepest grade found '+(bg*100).toFixed(0)+'%: car uphill '+Math.round(up*100)+'%, downhill '+Math.round(down*100)+'%, on foot uphill '+Math.round(walk*100)+'%');
 let gs=[];for(let t=0;t<4000;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;if(L.landValue(x,y)<0.15)continue;const z=L.zoneAt(x,y).biome;const a=Math.random()*6.28;gs.push([z,Math.abs(L.heightAt(x+Math.cos(a)*24,y+Math.sin(a)*24)-L.heightAt(x,y))/24]);if(L.chunks.size>2500)L.chunks.clear();}
 const avg=z=>{const v=gs.filter(g=>g[0]===z).map(g=>g[1]);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;};
 console.log('average slope by country: ranges '+(avg('ranges')*100).toFixed(1)+'%, red desert '+(avg('red')*100).toFixed(1)+'%, mallee '+(avg('mallee')*100).toFixed(1)+'%, salt flats '+(avg('salt')*100).toFixed(1)+'%');
 L.check('the ranges are hilly and the salt flats are flat',avg('ranges')>avg('mallee')&&avg('salt')<0.005);}
// a real climb, timed
{let spot=null;for(let t=0;t<40000&&!spot;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;if(L.landValue(x,y)<0.15||L.roadInfo(x,y).d<1500)continue;const a=Math.random()*6.28;let ok=true,rise=0;
   for(let d=0;d<900;d+=60){const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(L.terrainRaw(px,py)!==T.GROUND){ok=false;break;}}if(!ok)continue;rise=L.heightAt(x+Math.cos(a)*900,y+Math.sin(a)*900)-L.heightAt(x,y);if(rise>70)spot={x,y,a};if(L.chunks.size>2500)L.chunks.clear();}
 const climb=(dir)=>{const G=fresh(),c=G.cars.find(c=>c.id==='hero0');c.x=spot.x+(dir>0?0:Math.cos(spot.a)*900);c.y=spot.y+(dir>0?0:Math.sin(spot.a)*900);c.a=dir>0?spot.a:spot.a+Math.PI;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
   let t=0;const sx=c.x,sy=c.y;L.keys.ArrowUp=true;while(t<20&&Math.hypot(c.x-sx,c.y-sy)<850){for(const k of L.chunks.values())k.rocks=[];c.a=dir>0?spot.a:spot.a+Math.PI;L.update(1/60);t+=1/60;}L.clearInput();return t;};
 const up=climb(1),down=climb(-1);L.check('driving up a hill takes longer than coming down it',up>down*1.08,'900 px rising '+'~'+Math.round(L.heightAt(spot.x+Math.cos(spot.a)*900,spot.y+Math.sin(spot.a)*900)-L.heightAt(spot.x,spot.y))+' px: '+up.toFixed(1)+' s up, '+down.toFixed(1)+' s down');}
// --- boulder fields are far rockier than ordinary ground
{L.chunks.clear();let bf=[],norm=[];for(let cx=-120;cx<120&&(bf.length<30||norm.length<30);cx+=3)for(let cy=-80;cy<80;cy+=3){const c=L.getChunk(cx,cy);if(L.landValue(cx*640,cy*640)<0.2)continue;(c.boulders?bf:norm).push(c.rocks.length);}
 const m=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);L.check('boulder fields are far rockier than ordinary country',m(bf)>m(norm)*3,'rocks per chunk: boulder field '+m(bf).toFixed(1)+', elsewhere '+m(norm).toFixed(1));}
// --- mountains block sight; bridges and terrain draw; the map shows it all
{ const G=fresh();let ok=true;try{for(const R of L.roads){let i=0;for(;i<R.n;i+=3)if(L.terrainRaw(R.xs[i],R.ys[i])===T.RIVER)break;if(i<R.n){G.hero.x=R.xs[i]+200;G.hero.y=R.ys[i];G.cam.x=R.xs[i];G.cam.y=R.ys[i];break;}}L.render();L.openMap();L.render();L.closeMap();}catch(e){ok=false;console.log(e);}
 L.check('terrain, bridges and the map draw without errors',ok);}
// --- mesas and buttes
{const C=L.MESA_CELL,all=[];for(let j=Math.floor(-550000/C);j<550000/C;j++)for(let i=Math.floor(-800000/C);i<800000/C;i++){const m=L.mesaAt(i,j);if(m)all.push(m);}
 const sizes=all.map(m=>m.maxR*2).sort((a,b)=>a-b),red=all.filter(m=>L.zoneAt(m.x,m.y).biome==='red').length,butte=all.filter(m=>m.butte).length;
 L.check('lots of small mesas and buttes, mostly in the red desert',all.length>800&&red>all.length*0.7&&butte>all.length*0.4,all.length+' in all ('+butte+' buttes, '+red+' in the red desert); '+Math.round(sizes[0]/10)+'–'+Math.round(sizes[sizes.length-1]/10)+' m across, median '+Math.round(sizes[sizes.length>>1]/10)+' m');
 const nearRoad=all.filter(m=>L.roadInfo(m.x,m.y).d<m.maxR+200).length,nearTown=all.filter(m=>L.LOCS.some(l=>Math.hypot(l.x-m.x,l.y-m.y)<l.rad+m.maxR+300)).length;
 L.check('no mesa stands on or beside a road, or in a town',nearRoad===0&&nearTown===0);
 let crossed=0;for(const R of L.roads)for(let i=0;i<R.n;i+=4)if(L.insideMesa(R.xs[i],R.ys[i],20))crossed++;L.check('…so every road stays clear of cliffs',crossed===0);
 // the biggest one: drive at it, walk at it, look past it
 const m=all.reduce((a,b)=>b.maxR>a.maxR?b:a);const G=fresh(),c=G.cars.find(c=>c.id==='hero0');G.npcs=[];c.x=m.x+m.maxR+500;c.y=m.y;c.a=Math.PI;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
 let inside=0,c0=c.cond;L.keys.ArrowUp=true;L.step(6,()=>{c.a=Math.atan2(m.y-c.y,m.x-c.x);for(const k of L.chunks.values())k.rocks=[];if(L.insideMesa(c.x,c.y,-c.r))inside++;});L.clearInput();
 L.check('you can’t drive into a mesa: the cliff is like hitting a boulder',inside===0&&c.cond<c0,'body '+Math.round(c0)+'% → '+Math.round(c.cond)+'%');
 const G2=fresh(),h=G2.hero;G2.npcs=[];G2.cars=[];h.x=m.x+m.maxR+200;h.y=m.y;let inH=0;L.step(6,()=>{L.aim(Math.atan2(m.y-h.y,m.x-h.x),1);if(L.insideMesa(h.x,h.y,-4))inH++;});L.clearInput();
 L.check('…or walk into one',inH===0);
 L.check('a mesa blocks line of sight',!L.losClear(m.x-m.maxR-150,m.y,m.x+m.maxR+150,m.y));
 const G3=fresh();let scree=0;for(let cx=Math.floor((m.x-m.maxR-100)/640);cx<=Math.floor((m.x+m.maxR+100)/640);cx++)for(let cy=Math.floor((m.y-m.maxR-100)/640);cy<=Math.floor((m.y+m.maxR+100)/640);cy++){
   for(const r of L.getChunk(cx,cy).rocks){const d=Math.hypot(r.x-m.x,r.y-m.y),e=L.mesaR(m,Math.atan2(r.y-m.y,r.x-m.x));if(d>e&&d<e+90)scree++;}}
 L.check('boulders lie in a scree apron round the base',scree>=8,scree+' boulders at the foot of the biggest mesa');
 let onTop=0;for(let cx=Math.floor((m.x-m.maxR)/640);cx<=Math.floor((m.x+m.maxR)/640);cx++)for(let cy=Math.floor((m.y-m.maxR)/640);cy<=Math.floor((m.y+m.maxR)/640);cy++){const ch=L.getChunk(cx,cy);for(const k of [...ch.rocks,...ch.decor,...ch.carSpawns,...ch.boxes])if(L.insideMesa(k.x,k.y))onTop++;}
 L.check('nothing is placed on top of a mesa',onTop===0);}
L.done();
