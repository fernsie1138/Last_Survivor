const L=require('./harness');
function fresh(){localStorage._s={};L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncCars();return L.G;}
const snapshot=G=>{const c=G.cars.find(x=>x.id==='hero0'),h=G.hero;return JSON.stringify({x:Math.round(c.x),fuel:c.fuel,tw:c.tw,ups:c.ups,boot:c.items,canBoot:L.canFill(c.items),inv:h.inv,can:L.canFill(h.inv),hp:h.hp,clock:G.clock,rep:G.rep,dest:G.dest,mk:G.markers,wp:G.waypoint,comp:G.comp&&G.comp.type,kills:G.kills,flags:G.flags,known:[...G.known].length,wrecks:G.wreckState});};
// --- build up a game on "device A", download it
let text,before;
{const G=fresh(),h=G.hero,c=G.cars.find(x=>x.id==='hero0'),R=L.roads[L.LOCS[L.START].links[0].road];c.x=R.xs[400];c.y=R.ys[400];h.x=c.x;h.y=c.y;L.enterCar(c);
 Object.assign(c,{fuel:37,cond:58});c.tw=[100,40,90,0];c.ups={blower:true,longtank:true};c.items={jerrycan:1,scrap:2};L.setFill(c.items,22);
 h.inv={jerrycan:1,hose:1,watch:2,revolver:1,bullets:5};L.setFill(h.inv,11);h.weapon='revolver';h.hp=71;G.clock=3*1440+9*60;G.rep.settlers=41;G.rep.fuelkings=22;G.flags.q_col='done';G.kills=7;
 L.recruit({def:{id:'c_medic',comp:'medic'},x:h.x,y:h.y});G.comp.inCar=true;G.markers.push({id:1,x:h.x+9000,y:h.y,text:'Bore water'});G.markerSeq=2;G.waypoint=1;L.setDest(L.LOCS.find(l=>l.goal).id);
 G.wreckState={k1_2_0:{fuel:0,engine:0,susp:12,scrap:1,tw:[0,0,0,0]}};
 text=L.exportSaveText();before=snapshot(G);const o=JSON.parse(text);
 L.check('the save file is plain JSON, labelled as a Last Survivor save',o.game==='last-survivor'&&o.world==='full'&&o.save.v===5,Math.round(text.length/1024)+' KB');
 L.check('the file is named after where you are and the day',/^last-survivor-[a-z0-9-]+-day-4\.json$/.test(L.saveFileName()),L.saveFileName());}
// --- "device B": nothing saved at all; open the file
{localStorage._s={};L.newGame();L.arrive(L.LOCS[L.START],"intro");L.titleScreen&&L.titleScreen();
 const ok=L.importSaveText(text);const G=L.G;L.check('on a fresh device, the file loads',ok&&L.state==='play');
 const after=snapshot(G);L.check('everything comes back: car, tyres, upgrades, boot, fuel in cans, kit, health, clock, standing, quest, companion, route, markers, kills, wrecks',after===before,after===before?'':'\n  before: '+before+'\n  after:  '+after);
 L.check('nothing is written to the device: the file is the save',!Object.keys(localStorage._s||{}).some(k=>/save|slot/.test(k)));}
// --- bad files are refused, and the game in progress is untouched
{const G=fresh();G.clock=777;const keep=snapshot(G);
 const tries=[['garbage','not json at all {'],['another game',JSON.stringify({game:'other',save:{}})],['the test range',JSON.stringify({game:'last-survivor',world:'test',save:JSON.parse(text).save})],
   ['damaged',JSON.stringify({game:'last-survivor',world:'full',save:{v:5,hero:{x:'oops'},cars:[],at:0}})],['half a file',text.slice(0,text.length/2)]];
 for(const [name,t] of tries){const r=L.parseSaveText(t);L.check('refuses '+name+', with a reason',!!r.err,r.err);L.importSaveText(t);L.check('…and your current game is untouched',snapshot(L.G)===keep);}
 const slot=JSON.stringify(JSON.parse(text).save);L.check('a bare save (as stored in a slot) is also accepted',!L.parseSaveText(slot).err);}
// --- no downloading mid-fight, same as saving
{const G=fresh();const e=L.makeRaider('buggy',G.hero.x+300,G.hero.y,0,0);G.cars.push(e);L.downloadSave(()=>{});L.check('can’t download a save with raiders on your tail',/raider/.test(document.getElementById('sSub').textContent||''));}
L.done();
