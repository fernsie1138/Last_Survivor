const L=require('./harness');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;return L.G;}
function longestStraight(R){let best=1,bs=1e9;for(let i=60;i<R.n-260;i+=10){let c=0;for(let k=i;k<i+200;k++){const a1=Math.atan2(R.ys[k]-R.ys[k-1],R.xs[k]-R.xs[k-1]),a2=Math.atan2(R.ys[k+1]-R.ys[k],R.xs[k+1]-R.xs[k]);let d=Math.abs(a2-a1);if(d>Math.PI)d=2*Math.PI-d;c+=d;}if(c<bs){bs=c;best=i;}}return best;}
// --- road grades: top speed and wear for the Kestrel
const res={};
for(const cls of ['highway','gravel','dirt']){const ri=L.roads.findIndex(R=>R.cls===cls&&R.len>60000),R=L.roads[ri],i=longestStraight(R);
  const G=fresh();const a=Math.atan2(R.ys[i+1]-R.ys[i],R.xs[i+1]-R.xs[i]);G.cars=G.cars.filter(c=>c.id==='hero0');const c=G.cars[0];
  c.x=R.xs[i];c.y=R.ys[i];c.a=a;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);for(const k of L.chunks.values())k.rocks=[];
  let top=0,d0=G.dist;L.step(8,()=>{const r2=L.roadInfo(c.x,c.y),j=Math.max(0,Math.min(R.n-1,r2.i+Math.round(5+c.speed/60)));L.aim(Math.atan2(R.ys[j]-c.y,R.xs[j]-c.x));top=Math.max(top,c.speed);});L.clearInput();
  res[cls]={kmh:Math.round(top*0.36),wearPerKm:((100-c.tyres)/((G.dist-d0)/1000)).toFixed(2)};}
console.log('Kestrel on each road grade:',JSON.stringify(res));
L.check('highway fastest, then gravel, then dirt',res.highway.kmh>res.gravel.kmh&&res.gravel.kmh>res.dirt.kmh);
L.check('bitumen causes no wear, dirt wears more than gravel',+res.highway.wearPerKm===0&&+res.dirt.wearPerKm>+res.gravel.wearPerKm);
// --- zones change off-road driving: salt flats are fast, broken ranges are slow
function offroadTop(biome){let spot=null;for(let t=0;t<20000&&!spot;t++){const x=(Math.random()*2-1)*800000,y=(Math.random()*2-1)*550000;
    if(L.landValue(x,y)>0.1&&L.zoneAt(x,y).biome===biome&&L.roadInfo(x,y).d>2000)spot={x,y};}
  const G=fresh();G.cars=G.cars.filter(c=>c.id==='hero0');const c=G.cars[0];c.x=spot.x;c.y=spot.y;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);
  L.syncCars();for(const k of L.chunks.values())k.rocks=[];L.keys.ArrowUp=true;let top=0;L.step(5,()=>{for(const k of L.chunks.values())k.rocks=[];top=Math.max(top,c.speed);});L.clearInput();return Math.round(top*0.36);}
const salt=offroadTop('salt'),ranges=offroadTop('ranges');
L.check('Kestrel off-road: salt flats faster than the ranges',salt>ranges,'salt '+salt+' km/h, ranges '+ranges+' km/h');
// --- multi-stop route: pick a destination 3 stretches away and let a bot follow the guidance
{const G=fresh();let target=null;
  for(const l of L.LOCS){const p=L.routePath(L.START,l.id);if(p&&p.legs.length===3&&l.type!=='ruin'){target=l;break;}}
  L.setDest(target.id);const c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);
  let t=0,stops=[],lastNode=G.lastNode;
  while(t<3600&&G.dest!==null){
    if(L.state==='outpost'){stops.push(L.LOCS[G.lastNode].name);L.depart();if(!L.heroCar())break;}
    const b=L.body(),Lg=G.leg;if(!Lg)break;const R=L.roads[Lg.road],ri=L.roadInfo(b.x,b.y);let tx,ty;
    if(ri.r===Lg.road){const j=Math.max(0,Math.min(R.n-1,ri.i+Lg.dir*Math.round(5+b.speed/60)));tx=R.xs[j];ty=R.ys[j];}else{tx=L.LOCS[Lg.to].x;ty=L.LOCS[Lg.to].y;}
    L.aim(Math.atan2(ty-b.y,tx-b.x));L.update(1/60);t+=1/60;
    if(G.lastNode!==lastNode){lastNode=G.lastNode;stops.push(L.LOCS[lastNode].name);if(L.LOCS[lastNode].service)c.fuel=100;}}  // a stop at the garage
  L.clearInput();
  L.check('bot follows a 3-stretch route to the destination',G.lastNode===target.id&&G.dest===null,(t/60).toFixed(1)+' min, stops: '+stops.join(' > '));}
// --- the sea is impassable
{const coastal=L.LOCS.filter(l=>l.type!=='ruin').sort((a,b)=>L.landValue(a.x,a.y)-L.landValue(b.x,b.y))[0];
  let sea=null;for(let a=0;a<6.28&&!sea;a+=0.1)for(let d=500;d<40000;d+=500){const x=coastal.x+Math.cos(a)*d,y=coastal.y+Math.sin(a)*d;if(L.landValue(x,y)<0){sea={a,d};break;}}
  const G=fresh();G.cars=G.cars.filter(c=>c.id==='hero0');const c=G.cars[0];c.x=coastal.x+Math.cos(sea.a)*(sea.d-1500);c.y=coastal.y+Math.sin(sea.a)*(sea.d-1500);c.a=sea.a;
  G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();L.keys.ArrowUp=true;let wet=0;L.step(15,()=>{c.a=sea.a;if(L.waterAt(c.x,c.y))wet++;});L.clearInput();
  L.check('car driving at the sea stops at the shore',wet===0,'frames in water: '+wet+', land value at car '+L.landValue(c.x,c.y).toFixed(3));}
// --- rotating camera: car faces up, controls stay intuitive
{const G=fresh();L.SETTINGS.rotate=true;const R=L.roads[0],i=longestStraight(R),a=Math.atan2(R.ys[i+1]-R.ys[i],R.xs[i+1]-R.xs[i]);
  G.cars=G.cars.filter(c=>c.id==='hero0');const c=G.cars[0];c.x=R.xs[i];c.y=R.ys[i];c.a=a;G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);for(const k of L.chunks.values())k.rocks=[];
  L.keys.ArrowUp=true;L.step(3);L.clearInput();
  const err=Math.abs(((G.camRot-(-Math.PI/2-c.a))%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);
  L.check('world turns so the car faces up',err<0.1,'error '+err.toFixed(3)+' rad');
  const [ax,ay]=L.w2s(c.x+Math.cos(c.a)*200,c.y+Math.sin(c.a)*200),[cx,cy]=L.w2s(c.x,c.y);
  L.check('road ahead appears straight up the screen',Math.abs(ax-cx)<5&&ay<cy,'dx '+(ax-cx).toFixed(1));
  const a0=c.a;L.aim(-Math.PI/2);L.step(2);L.clearInput();
  L.check('pushing the stick up drives straight ahead',Math.abs(((c.a-a0)+Math.PI)%(2*Math.PI)-Math.PI)<0.15,'heading change '+(c.a-a0).toFixed(3));
  const h0=c.a;L.exitCar(true);const hx=G.hero.x,hy=G.hero.y;L.aim(-Math.PI/2);L.step(1);L.clearInput();
  const walked=Math.atan2(G.hero.y-hy,G.hero.x-hx);
  L.check('on foot, stick up walks toward the top of the screen',Math.abs(((walked-h0)+3*Math.PI)%(2*Math.PI)-Math.PI)<0.3,'walk angle vs car heading '+(walked-h0).toFixed(2));
  L.SETTINGS.rotate=false;}
// --- map: tap a place to select it and plan a route
{const G=fresh();L.openMap();const tgt=L.LOCS.find(l=>G.known.has(l.id)&&l.id!==L.START&&l.type==='city');
  const sx=L.mapView.sc;L.mapView.cx=tgt.x;L.mapView.cy=tgt.y;L.mapTap(512,384);let ok=true;try{L.render();}catch(e){ok=false;console.log(e);}
  L.check('map renders and tapping a city selects it',ok);L.setDest(tgt.id);L.check('route planned to the selected city',G.dest===tgt.id&&!!G.leg);L.closeMap();}
// --- saving keeps discoveries and the destination
{const G=fresh();L.setDest(L.LOCS.find(l=>l.goal).id);G.known.add(5);const s=JSON.stringify(L.saveData());
  L.newGame(JSON.parse(s));L.check('save keeps known places and destination',L.G.known.has(5)&&L.G.dest===L.LOCS.find(l=>l.goal).id,s.length+' bytes');}
L.done();
