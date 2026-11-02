const L=require('./harness');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncCars();return L.G;}
const o=L.LOCS[L.START],wr=o.rad-40;
// --- every walled town has gates, and nobody gets sealed in
{let minG=99,worst=0;for(const l of L.LOCS){if(!l.wall||!l.wall.length)continue;minG=Math.min(minG,l.gates.length);const as=l.gates.map(g=>((g.a%(2*Math.PI))+2*Math.PI)%(2*Math.PI)).sort((a,b)=>a-b);
   for(let i=0;i<as.length;i++){const nx=i+1<as.length?as[i+1]:as[0]+2*Math.PI;worst=Math.max(worst,nx-as[i]);}}
 L.check('every walled town has several gates, no wall longer than ~100°',minG>=2&&worst<1.8,'fewest gates '+minG+', longest wall '+(worst*57.3).toFixed(0)+'°');}
// --- a car driven straight at a wall stops at it
function wallAngle(){for(const w of o.wall){if(o.gates.every(g=>Math.abs(((w.a-g.a)+3*Math.PI)%(2*Math.PI)-Math.PI)>g.half+0.25))return w.a;}}
{const G=fresh(),c=G.cars.find(c=>c.id==='hero0'),a=wallAngle();G.npcs=[];c.x=o.x+Math.cos(a)*(wr-70);c.y=o.y+Math.sin(a)*(wr-70);c.a=a;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);
 for(const b of o.bld)b.w=b.w;let maxR=0;L.keys.ArrowUp=true;L.step(5,()=>{c.a=a;maxR=Math.max(maxR,Math.hypot(c.x-o.x,c.y-o.y));});L.clearInput();
 L.check('a car can’t drive through the town wall',maxR<wr+5,'got to '+Math.round(maxR)+' of '+wr+' px from the centre, body '+Math.round(c.cond)+'%');}
// --- …but drives out through every gate
{let out=[];for(const g of o.gates){const G=fresh(),c=G.cars.find(c=>c.id==='hero0');G.npcs=[];c.x=o.x+Math.cos(g.a)*(wr-180);c.y=o.y+Math.sin(g.a)*(wr-180);c.a=g.a;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);
   for(const k of L.chunks.values())k.rocks=[];G.cars=G.cars.filter(x=>x===c);L.touch.brake=false;let t=0;while(t<6&&Math.hypot(c.x-o.x,c.y-o.y)<wr+60){L.aim(g.a+G.camRot,0.5);L.update(1/60);t+=1/60;}L.clearInput();
   if(Math.hypot(c.x-o.x,c.y-o.y)>=wr+60)out.push(g.side?'side':'road');}
 L.check('you can drive out through every gate',out.length===o.gates.length,out.length+' of '+o.gates.length+' gates ('+out.join(', ')+')');}
// --- on foot: wall is solid, gate is open
{const G=fresh(),h=G.hero,a=wallAngle();G.npcs=[];h.x=o.x+Math.cos(a)*(wr-60);h.y=o.y+Math.sin(a)*(wr-60);let maxR=0;L.step(5,()=>{L.aim(a,1);maxR=Math.max(maxR,Math.hypot(h.x-o.x,h.y-o.y));});L.clearInput();
 L.check('you can’t walk through the wall',maxR<wr+3);const g=o.gates.find(x=>x.side)||o.gates[0];h.x=o.x+Math.cos(g.a)*(wr-60);h.y=o.y+Math.sin(g.a)*(wr-60);
 L.step(5,()=>L.aim(g.a,1));L.clearInput();L.check('…but you can walk out through a gate',Math.hypot(h.x-o.x,h.y-o.y)>wr+20);}
// --- everyone walks at half the old pace; raiders still edge out a running survivor
{let A=L.flatSpot();   // open, level ground
 const G=fresh(),h=G.hero;G.npcs=[];G.cars=[];h.x=A.x;h.y=A.y;L.syncCars();G.cars=[];G.npcs=[];for(const k of L.chunks.values()){k.rocks=[];k.wrecks=[];}
 const sp=(fn)=>{const x=h.x,y=h.y;L.step(2,fn);L.clearInput();return Math.hypot(h.x-x,h.y-y)/2;};
 const walk=sp(()=>{L.aim(0,0.85);for(const k of L.chunks.values())k.rocks=[];}),run=sp(()=>L.aim(0,1));h.crouch=true;const sneak=sp(()=>L.aim(0,0.85));h.crouch=false;
 console.log('speeds (px/s): walk',walk.toFixed(0),'run',run.toFixed(0),'sneak',sneak.toFixed(0));
 L.check('you walk ~half the old speed (58 px/s at a firm push, 100 running)',walk>40&&walk<60&&run>90&&run<106&&sneak<30);}
{const G=fresh();G.hero.x=o.x;G.hero.y=o.y;L.syncCars();G.hero.x=o.x+2000;   // step back so they don't stop to look at you
 const n=G.npcs.find(x=>x.def.role==='settler');n.path=[{x:n.x+500,y:n.y}];n.wait=0;const x0=n.x;L.step(2);
 L.check('townsfolk stroll at about 21 px/s',Math.abs((n.x-x0)/2-21)<6||n.speed===21,((n.x-x0)/2).toFixed(0)+' px/s');}
// --- the stick: part-way pushes hold part speed
{const R=L.roads.find(r=>r.cls==='highway'&&r.len>150000);let best=200,bs=1e9;for(let i=60;i<R.n-400;i+=10){let c=0;for(let k=i;k<i+300;k++){const a1=Math.atan2(R.ys[k]-R.ys[k-1],R.xs[k]-R.xs[k-1]),a2=Math.atan2(R.ys[k+1]-R.ys[k],R.xs[k+1]-R.xs[k]);let d=Math.abs(a2-a1);if(d>Math.PI)d=2*Math.PI-d;c+=d;}if(c<bs){bs=c;best=i;}}
 const res=[];for(const m of [0.3,0.45,0.6,0.8,1]){const G=fresh(),c=G.cars.find(c=>c.id==='hero0');c.x=R.xs[best];c.y=R.ys[best];c.a=Math.atan2(R.ys[best+1]-R.ys[best],R.xs[best+1]-R.xs[best]);
   G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);for(const k of L.chunks.values())k.rocks=[];G.cars=G.cars.filter(x=>x===c);
   L.step(8,()=>{const r2=L.roadInfo(c.x,c.y),j=Math.min(R.n-1,r2.i+10);L.aim(Math.atan2(R.ys[j]-c.y,R.xs[j]-c.x)+G.camRot,m);});L.clearInput();res.push([m,Math.round(c.speed*0.36)]);}
 console.log('steady speed by stick push:',res.map(([m,v])=>Math.round(m*100)+'% → '+v+' km/h').join(', '));
 L.check('a light push creeps (under 30 km/h), a full push is full speed',res[0][1]<30&&res[4][1]>170&&res.every((r,i)=>!i||r[1]>res[i-1][1]));}
// --- zoom
{const G=fresh();const c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);L.setZoom(0.1);L.check('zoom out stops at half scale (twice the distance)',L.SETTINGS.zoom===0.5);
 L.step(3);const far=L.w2s(c.x+1000,c.y)[0]-L.w2s(c.x,c.y)[0];L.setZoom(1);L.step(3);const near=L.w2s(c.x+1000,c.y)[0]-L.w2s(c.x,c.y)[0];
 L.check('zoomed out, the same 100 m takes half the screen space',Math.abs(far/near-0.5)<0.05,(far/near).toFixed(2)+'×');L.setZoom(5);L.check('zoom in stops at 1.6×',L.SETTINGS.zoom===1.6);L.setZoom(1);}
L.done();
