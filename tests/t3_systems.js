const L=require('./harness');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.setDest(L.LOCS[L.START].links[0].to);L.depart();L.G.encT=1e9;return L.G;}
// --- disabled raider car can be stolen and driven
let G=fresh(),h=G.hero;h.x+=400;const e=L.makeRaider('buggy',h.x+30,h.y,0,0);e.driver=null;e.cond=30;e.fuel=25;G.cars.push(e);
const near=L.nearestCar(40);L.check('abandoned raider buggy is enterable',near===e);
if(near){L.enterCar(near);L.check('driving a stolen car',L.heroCar()&&L.heroCar().type===near.type,L.heroCar()&&L.heroCar().def.name);}
// --- a car battered to zero body: it stops running, you stay inside, and you can still get in and out
G=fresh();h=G.hero;const k=G.cars.find(c=>c.id==='hero0');L.enterCar(k);L.keys.ArrowUp=true;L.step(1.5);const sp0=k.speed;k.cond=0;L.step(2);const sp1=k.speed;L.clearInput();
L.check('a car at zero body loses power and coasts, with you still inside',h.inCar===k.id&&!k.wrecked&&sp1<sp0*0.8,'throttle held: '+Math.round(sp0*0.36)+' → '+Math.round(sp1*0.36)+' km/h');
L.keys.ArrowDown=false;L.touch.brake=true;L.step(2);L.touch.brake=false;L.exitCar();L.check('you can get out of it',!h.inCar);
L.check('…and back in to try again later',L.getActions().some(a=>a.label==='Get in'));
// --- save and load round trip
G=fresh();h=G.hero;const kes=G.cars.find(c=>c.id==='hero0');
const other=G.cars.find(c=>c.id.startsWith('o'+L.START+'_'));
L.enterCar(kes);kes.x+=500;kes.fuel=55;L.exitCar(true);
// (in real play you can't switch cars within half a second, so the test lifts the guard)
h.x=other.x+other.r+15;h.y=other.y;G.swapT=-9;L.enterCar(other);other.x+=300;other.fuel=12.5;h.inv={water:2,scrap:3};
const before=JSON.stringify(L.saveData());const file=L.exportSaveText();
L.newGame(L.parseSaveText(file).save);G=L.G;   // round trip through a save file
const k2=G.cars.find(c=>c.id==='hero0'),o2=G.cars.filter(c=>c.id===other.id);
L.check('Kestrel restored where it was left',k2&&Math.abs(k2.x-kes.x)<1&&Math.abs(k2.fuel-55)<0.2);
L.check('hero restored inside the stolen car',G.hero.inCar===other.id&&o2.length===1&&o2[0].driver==='hero');
L.check('no duplicate of the taken outpost car after reload',o2.length===1,'copies: '+o2.length);
L.check('carried items restored',G.hero.inv.water===2&&G.hero.inv.scrap===3);
L.check('save is small',before.length<4000,before.length+' bytes');
// --- world: roadside abandoned cars are the same on every visit
function roadsideCars(){const out=[];for(let i=0;i<L.roads[0].n;i+=8){const cx=Math.floor(L.roads[0].xs[i]/640),cy=Math.floor(L.roads[0].ys[i]/640);
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){for(const s of L.getChunk(cx+a,cy+b).carSpawns)out.push(s.id+':'+s.type+':'+s.x.toFixed(1));}}return [...new Set(out)];}
const v1=roadsideCars();L.chunks.clear();const v2=roadsideCars();
L.check('roadside cars regenerate identically',JSON.stringify(v1)===JSON.stringify(v2),v1.length+' abandoned cars along Rust Hollow to Saltpan ('+(L.roads[0].len/10000).toFixed(1)+' km)');
// --- render every state without errors
let ok=true;try{G=fresh();L.render();L.openMap();L.render();L.closeMap();L.render();}catch(err){ok=false;console.log(err);}
L.check('renders play, map and outpost states',ok);
L.done();
