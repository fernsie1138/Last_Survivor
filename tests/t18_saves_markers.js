const L=require('./harness');
function fresh(){localStorage._s={};L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncCars();return L.G;}
// --- save mid-journey, change everything, load: it all comes back exactly
{const G=fresh(),h=G.hero,R=L.roads[L.LOCS[L.START].links[0].road],c=G.cars.find(c=>c.id==='hero0');
 const i=300;c.x=R.xs[i];c.y=R.ys[i];c.a=1.234;h.x=c.x;h.y=c.y;L.enterCar(c);Object.assign(c,{fuel:42.5,cond:61,engine:77,susp:33});c.tw=[0,80,90,100];c.ups={roobar:true};c.items={water:1,scrap:3};
 h.inv={durries:2,bandage:1,revolver:1,bullets:9};h.weapon='revolver';h.hp=64;h.water=51;h.food=40;h.rest=70;G.clock=2*1440+14*60+20;G.rep.settlers=33;G.flags.q_col='active';
 L.recruit({def:{id:'c_gunhand',comp:'gunhand'},x:h.x,y:h.y});G.comp.hp=55;G.comp.inCar=true;
 G.markers.push({id:1,x:Math.round(h.x+5000),y:Math.round(h.y),text:'Water tank'});G.markerSeq=2;G.waypoint=1;L.setDest(L.LOCS.find(l=>l.goal).id);G.kills=4;
 const why=L.canSaveNow();L.check('saving is allowed when no raiders are about',!why,why||'');
 const file=L.exportSaveText();const snap=JSON.stringify({x:Math.round(c.x),fuel:c.fuel,tw:c.tw,ups:c.ups,inv:h.inv,hp:h.hp,clock:G.clock,rep:G.rep.settlers,dest:G.dest,leg:!!G.leg,mk:G.markers,wp:G.waypoint,comp:G.comp.type,kills:G.kills});
 // wreck the world, then load
 c.x+=9999;c.fuel=0;h.inv={};h.hp=5;G.clock=0;G.markers=[];G.comp=null;G.rep.settlers=-80;
 L.importSaveText(file);const G2=L.G,c2=G2.cars.find(x=>x.id==='hero0'),h2=G2.hero;
 const now=JSON.stringify({x:Math.round(c2.x),fuel:c2.fuel,tw:c2.tw,ups:c2.ups,inv:h2.inv,hp:h2.hp,clock:G2.clock,rep:G2.rep.settlers,dest:G2.dest,leg:!!G2.leg,mk:G2.markers,wp:G2.waypoint,comp:G2.comp&&G2.comp.type,kills:G2.kills});
 L.check('loading restores position, car, tyres, upgrades, kit, health, clock, standing, route, markers, companion and kills',now===snap,now===snap?'':'\n  saved:  '+snap+'\n  loaded: '+now);
 L.check('you’re back in the driver’s seat, playing',h2.inCar==='hero0'&&L.state==='play'&&G2.comp.inCar);
 L.check('loading mid-road doesn’t pop up a town greeting',G2.inside===-1);}
// --- the old save slots are gone: nothing is kept on the device
{const G=fresh();L.arrive(L.LOCS[L.START]);const keys=Object.keys(localStorage._s||{}).filter(k=>/save|slot/.test(k));
 L.check('arriving at an outpost no longer writes anything to the device',keys.length===0,keys.join(', ')||'no save data stored');}
// --- no saving mid-fight
{const G=fresh();const e=L.makeRaider('buggy',G.hero.x+400,G.hero.y,0,0);G.cars.push(e);L.check('can’t save with raider cars about',/raider cars/.test(L.canSaveNow()||''));G.cars=G.cars.filter(c=>c!==e);
 const f=L.makeFoe({id:'x',weapon:'knife',post:{x:0,y:0},patrol:[{x:0,y:0}],seed:1},null,G.hero.x+100,G.hero.y);f.state='alert';G.foes.push(f);L.check('can’t save in the middle of a fight',/fight/.test(L.canSaveNow()||''));}
// --- an older save (no markers or slots) still loads from a file
{const G=fresh();const d=JSON.parse(JSON.stringify(L.saveData()));delete d.lastNode;delete d.markers;delete d.waypoint;delete d.stock;delete d.meta;
 let ok=L.importSaveText(JSON.stringify(d));L.check('an older save (no markers) still loads',ok&&Array.isArray(L.G.markers)&&L.G.waypoint===null);}
// --- markers: drop one on empty ground with a name, get guided to it, arrive
{const G=fresh(),h=G.hero;L.openMap();L.mapView.cx=h.x+6000;L.mapView.cy=h.y;L.mapView.sc=0.01;L.mapTap(512,384);
 L.check('tapping empty ground offers to drop a marker',L.mapDrop&&!L.mapMarker);L.markerAction('drop');document.getElementById('mdText').value='  Old windmill  ';L.markerSave();
 const m=G.markers[0];L.check('the marker is dropped there, named as typed',m&&m.text==='Old windmill'&&Math.abs(m.x-(h.x+6000))<2,m&&JSON.stringify(m));
 L.markerAction('guide');L.check('Guide me here sets it as your waypoint',G.waypoint===m.id);
 L.markerAction('rename');document.getElementById('mdText').value='Windmill (water)';L.markerSave();L.check('rename it',m.text==='Windmill (water)');
 L.markerAction('drop');document.getElementById('mdText').value='';L.mapTap(100,100);L.markerAction('drop');L.markerSave();
 L.check('an empty name gets a sensible default',G.markers.length===2&&/^Marker /.test(G.markers[1].text),G.markers[1]&&G.markers[1].text);
 L.closeMap();h.x=m.x-200;h.y=m.y;L.step(0.3);L.check('arriving at the marker clears the waypoint',G.waypoint===null);
 L.openMap();L.mapView.cx=m.x;L.mapView.cy=m.y;L.mapTap(512,384-10);L.check('tapping a marker selects it',L.mapMarker===m.id);L.markerAction('remove');
 L.check('remove it',!G.markers.some(q=>q.id===m.id));L.closeMap();}
{const G=fresh();G.markers.push({id:1,x:G.hero.x+300,y:G.hero.y,text:'Here'});G.waypoint=1;let ok=true;try{L.render();L.openMap();L.render();L.closeMap();}catch(e){ok=false;console.log(e);}
 L.check('markers draw in the world and on the map',ok);}
L.done();
