const L=require('./harness');
const G0=()=>L.G;
L.check('test mode is on',L.TEST_MODE===true);
L.check('four places: town, ruins, raider camp, Haven',L.LOCS.length===4&&L.LOCS[0].type==='city'&&L.LOCS[2].camp&&L.LOCS[3].goal,L.LOCS.map(l=>l.name).join(', '));
L.check('every road grade is present',['highway','gravel','dirt'].every(c=>L.roads.some(r=>r.cls===c)));
{const z=new Set();for(let y=-4900;y<4900;y+=250)for(let x=-4900;x<4900;x+=250)if(L.landValue(x,y)>=0)z.add(L.zoneAt(x,y).biome);
 L.check('all five zone types are on the island',z.size===5,[...z].join(', '));}
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncCars();return L.G;}
// --- separate save
{const G=fresh();const f=JSON.parse(L.exportSaveText());L.check('a test-range save file is labelled as one, so the full game won’t mix them up',f.world==='test'&&!L.parseSaveText(L.exportSaveText()).err);
 L.check('every place is already on the map',G.known.size===4);}
// --- car yard: every vehicle, each one drives
{const types=Object.keys(L.CARS);let drove=[];for(const t of types){const G=fresh();const c=G.cars.find(c=>c.id==='ty_'+t);if(!c)continue;G.hero.x=c.x+c.r+14;G.hero.y=c.y;
   L.enterCar(c);if(!L.heroCar())continue;L.keys.ArrowUp=true;L.step(1.5);L.clearInput();if(c.speed>100)drove.push(t);}
 L.check('all 9 vehicles in the car yard can be driven',drove.length===9,drove.join(', '));}
// --- supply crates hold every item
{const G=fresh();const all=new Set();for(const b of G.boxes.filter(b=>b.id.startsWith('tb_')))for(const k in L.boxItems(b))all.add(k);
 const missing=Object.keys(L.ITEMS).filter(k=>!all.has(k));L.check('the supply crates hold one of every item',missing.length===0,missing.length?'missing '+missing.join(', '):all.size+' item types');}
// --- every kind of local is in town and talkable
{const G=fresh();G.hero.x=L.LOCS[0].x;G.hero.y=L.LOCS[0].y;L.syncNPCs();const roles=new Set(G.npcs.map(n=>n.def.role));let ok=true;
 for(const n of G.npcs){try{L.startTalk(n);if(!L.talk.opts.length)ok=false;L.endTalk();}catch(e){ok=false;console.log(e);}}
 L.check('publican, mechanic, doctor, trader, guards and settlers all talk',['publican','mechanic','doctor','trader','guard','settler'].every(r=>roles.has(r))&&ok,[...roles].join(', '));
 L.check('Dot’s quest points at the Test Ruins',L.QCOL&&L.QCOL.ruin===1);}
// run each tool by calling the panel builder and pressing each button through the panel config
{const G=fresh();const ui=L;let ran=0,errs=[];
 for(let i=0;i<13;i++){const g=fresh();const c=g.cars.find(c=>c.id==='ty_kestrel');g.hero.x=c.x+c.r+14;g.hero.y=c.y;if(i<2)L.enterCar(c);
   L.toolsPanel();const cfg=L.panel();const btn=cfg.buttons[i];if(!btn)break;try{btn.fn();ran++;L.step(0.5);}catch(e){errs.push(btn.label+': '+e.message);}}
 L.check('every Tools button works',errs.length===0,ran+' pressed'+(errs.length?', errors: '+errs.join(' | '):''));}
// --- every teleport lands where it says
{let ok=[];for(let i=0;i<7;i++){const g=fresh();L.toolsPanel();L.panel().buttons.find(b=>b.label==='Teleport…').fn();const btn=L.panel().buttons[i];btn.fn();
   const b=L.body();if(L.landValue(b.x,b.y)>=0)ok.push(btn.label);L.step(0.5);}
 L.check('all 7 teleports land on dry ground',ok.length===7,ok.join(', '));}
// --- raider camp, stash, sea, Haven
{const g=fresh();g.hero.x=L.LOCS[2].x-700;g.hero.y=L.LOCS[2].y;L.syncCars();L.check('the camp has its four raiders',g.foes.filter(f=>f.loc===L.LOCS[2]).length===4,g.foes.map(f=>f.weapon).join(', '));}
{const g=fresh();g.hero.x=3850;g.hero.y=-700;L.syncCars();const st=g.boxes.find(b=>b.id==='ts_stash');L.check('the hidden stash is there and has loot',!!st&&Object.keys(L.boxItems(st)).length>0,st&&JSON.stringify(st.items));}
{const g=fresh(),c=g.cars.find(c=>c.id==='ty_kestrel');c.x=3500;c.y=0;c.a=0;g.hero.x=c.x;g.hero.y=c.y;L.enterCar(c);L.syncCars();L.keys.ArrowUp=true;let wet=0;
 L.step(8,()=>{c.a=0;if(L.waterAt(c.x,c.y))wet++;});L.clearInput();L.check('the sea stops you at the island’s edge',wet===0&&c.x<5000,'stopped at x='+Math.round(c.x));}
{const g=fresh(),c=g.cars.find(c=>c.id==='ty_kestrel'),hv=L.LOCS[3],gt=hv.gates[0],wr=hv.rad-40;L.enterCar(c);c.x=hv.x+Math.cos(gt.a)*(wr+250);c.y=hv.y+Math.sin(gt.a)*(wr+250);L.syncCars();L.keys.ArrowUp=true;L.step(5,()=>{c.a=Math.atan2(hv.y-c.y,hv.x-c.x);});L.clearInput();   // drive in through a gate
 L.check('driving into Haven (test) ends the game',L.state==='over');}
// --- performance: time per simulated frame in the busiest spot (town plus car yard)
{const g=fresh();g.hero.x=L.LOCS[0].x;g.hero.y=L.LOCS[0].y;L.syncCars();const t0=Date.now();for(let i=0;i<600;i++){L.update(1/60);L.render();}
 const ms=(Date.now()-t0)/600;console.log('simulation cost in town: '+ms.toFixed(2)+' ms per frame (drawing calls stubbed)');}
L.done();
