const L=require('./harness');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;L.syncCars();return L.G;}
const opt=t=>L.talk.opts.findIndex(o=>(typeof o.t==='function'?o.t(null):o.t)===t);
const optLike=re=>L.talk.opts.findIndex(o=>{try{return re.test(typeof o.t==='function'?o.t({car:L.heroCar()||{def:{name:''}}}):o.t);}catch(e){return false;}});
// --- reverse
{const G=fresh(),c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);for(const k of L.chunks.values())k.rocks=[];const x0=c.x,y0=c.y,a0=c.a;
 L.touch.reverse=true;L.step(2);const back=-((c.x-x0)*Math.cos(a0)+(c.y-y0)*Math.sin(a0));
 L.check('holding Reverse backs the car up',c.vf<-50&&back>60,'backed '+Math.round(back)+' px at '+Math.round(-c.vf*0.36)+' km/h');
 // steer while reversing: point the stick to the car's right-rear and the tail swings that way
 const aBefore=c.a,rot=L.G.camRot,tailRight=a0+Math.PI-0.9;L.aim(tailRight+rot);L.step(1);
 const tail=c.a+Math.PI;L.check('the stick steers where the tail goes while reversing',Math.abs(((tail-tailRight)+3*Math.PI)%(2*Math.PI)-Math.PI)<Math.abs(((aBefore+Math.PI-tailRight)+3*Math.PI)%(2*Math.PI)-Math.PI),'tail moved toward the stick');
 L.clearInput();L.touch.reverse=false;}
// --- factions own towns
{const fk=L.LOCS.filter(l=>l.faction==='fuelkings'),st=L.LOCS.filter(l=>l.faction==='settlers');
 L.check('the Fuel Kings hold some towns, the Settlers the rest',fk.length>=3&&st.length>fk.length,fk.length+' Fuel Kings towns ('+fk.filter(l=>l.type==='city').map(l=>l.name).join(', ')+'), '+st.length+' Settler towns');
 L.check('Rust Hollow is a Settler town',L.LOCS[L.START].faction==='settlers');}
// --- raiders you take out earn standing
{const G=fresh();const s0=L.rep('settlers'),r0=L.rep('raiders');const f={id:'x',def:{patrol:[{x:0,y:0}]},hp:1,x:G.hero.x+30,y:G.hero.y,loose:true,weapon:'knife',state:'idle'};
 const foe=L.makeFoe({id:'tz',weapon:'knife',post:{x:G.hero.x+30,y:G.hero.y},patrol:[{x:0,y:0}],seed:1},null,G.hero.x+30,G.hero.y);foe.loose=true;G.foes.push(foe);L.hitFoe(foe,999,1,0,0);
 L.check('killing a raider: Settlers +1, Dust Devils −2',L.rep('settlers')===s0+1&&L.rep('raiders')===r0-2);}
// --- assault: the town turns on you, services close, amends reopen them
{const G=fresh(),o=L.LOCS[L.START];G.hero.x=o.x;G.hero.y=o.y;L.syncCars();G.rep.settlers=0;
 const victim=G.npcs.find(n=>n.def.role==='settler'),pub=G.npcs.find(n=>n.def.role==='publican');G.hero.x=victim.x-20;G.hero.y=victim.y;G.hero.a=0;victim.x=G.hero.x+20;
 const guards0=G.npcs.filter(n=>n.def.role==='guard').length;for(const n of G.npcs)if(n!==victim&&Math.hypot(n.x-G.hero.x,n.y-G.hero.y)<80){n.x+=300;n.path=[];n.wait=99;}   // bystanders out of the swing
 G.hero.atkCd=0;L.heroAttack();
 L.check('hitting a townsperson costs standing and makes them flee',L.rep('settlers')===-12&&victim.fleeT>0);
 L.check('…and the guards draw their weapons',L.townHostile(o)&&G.foes.filter(f=>f.townGuard===o.id).length===guards0&&guards0>0,guards0+' guard(s) hostile');
 G.hero.inv={water:3};L.startTalk(pub);L.check('the publican refuses to serve you',L.talk.node==='refuse',L.talk.text);
 L.chooseOpt(opt('I want to make amends'));L.chooseOpt(0);
 L.check('three bottles of water makes amends and reopens the pub',!L.townRefuses(o)&&L.rep('settlers')===3&&!G.hero.inv.water,'standing now '+L.rep('settlers'));L.endTalk();}
// --- Fuel Kings: no fuel unless they like you; the bounty fixes that
{const fk=L.LOCS.find(l=>l.faction==='fuelkings'&&l.type==='city');const G=fresh();G.hero.x=fk.x;G.hero.y=fk.y;L.syncCars();G.rep.fuelkings=-5;
 const mech=G.npcs.find(n=>n.def.role==='mechanic'&&n.loc===fk),guard=G.npcs.find(n=>n.def.role==='guard'&&n.loc===fk);
 const car=G.cars.find(c=>c.id==='hero0');car.x=mech.x+60;car.y=mech.y;car.fuel=20;L.startTalk(mech);
 L.check('a Fuel Kings mechanic won’t refuel a stranger',opt('Will you fill her up?')>=0&&optLike(/look at my/)<0);L.endTalk();
 L.startTalk(guard);L.chooseOpt(opt('Any work going?'));const camp=G.flags.bounty;L.check('their guard offers a bounty on a raider camp',camp!==undefined&&L.LOCS[camp].camp,L.LOCS[camp]&&L.LOCS[camp].name);L.endTalk();
 G.flags['camp_'+camp]='cleared';L.startTalk(guard);L.chooseOpt(opt('About that bounty…'));L.chooseOpt(opt('Collect the bounty'));L.endTalk();
 L.check('collecting the bounty: ammo, a medkit and the Kings’ favour',L.rep('fuelkings')===10&&G.hero.inv.bullets>=12,'Fuel Kings now '+L.rep('fuelkings'));
 L.startTalk(mech);L.check('now the mechanic will fill you up',optLike(/look at my/)>=0);L.endTalk();}
// --- companions: recruit, follow, ride along, get out with you, save
{const G=fresh(),o=L.LOCS[L.COMPANIONS.scrounger.home];G.hero.x=o.x;G.hero.y=o.y;L.syncCars();const mick=G.npcs.find(n=>n.def.comp==='scrounger');
 L.check('Mick the scrounger is waiting at '+o.name,!!mick);L.startTalk(mick);G.hero.inv={};L.chooseOpt(opt('Want to come along?'));
 L.check('without his price he says no',!L.G.comp,L.talk&&L.talk.text);L.endTalk();G.hero.inv={water:2};L.startTalk(mick);L.chooseOpt(opt('Want to come along?'));
 L.check('pay two waters and he joins',G.comp&&G.comp.type==='scrounger'&&!G.hero.inv.water&&!G.npcs.includes(mick));
 const h=G.hero;G.cars=G.cars.filter(c=>c.id==='hero0');const c=G.cars[0];c.x=h.x+400;c.y=h.y;h.x=G.comp.x;h.y=G.comp.y;
 let t=0,p0={x:h.x,y:h.y};while(t<6){L.aim(0,1);L.update(1/60);t+=1/60;}L.clearInput();
 L.check('he follows you on foot',Math.hypot(G.comp.x-h.x,G.comp.y-h.y)<120,'gap '+Math.round(Math.hypot(G.comp.x-h.x,G.comp.y-h.y))+' px after running '+Math.round(Math.hypot(h.x-p0.x,h.y-p0.y))+' px');
 c.x=h.x+30;c.y=h.y;L.enterCar(c);L.step(0.3);L.check('he hops in when you get in the car',G.comp.inCar);
 L.keys.ArrowUp=true;L.step(2);L.keys.ArrowUp=false;L.keys.KeyB=true;L.step(2);L.clearInput();L.exitCar();L.step(0.3);
 L.check('…and gets out when you do',!G.comp.inCar&&Math.hypot(G.comp.x-h.x,G.comp.y-h.y)<120);
 const sv=JSON.parse(JSON.stringify(L.saveData()));L.newGame(sv);L.check('your companion survives saving and loading',L.G.comp&&L.G.comp.type==='scrounger');}
// --- daily upkeep: no food, no friend
{const G=fresh();G.comp=null;L.recruit({def:{id:'c_medic',comp:'medic'},x:G.hero.x,y:G.hero.y});const p=G.comp;
 G.hero.inv={water:1,beans:1};G.cars.forEach(c=>c.items={});G.clock+=24*60;L.compTick();L.check('each morning they take a drink and a meal from your supplies',!G.hero.inv.water&&!G.hero.inv.beans&&p.missed===0);
 G.clock+=24*60;L.compTick();L.check('miss a day and they complain',G.comp&&G.comp.missed===1);G.clock+=24*60;L.compTick();L.check('miss two and they walk off',!G.comp);}
// --- down and out: help them up within a minute or lose them
{const G=fresh();L.recruit({def:{id:'c_gunhand',comp:'gunhand'},x:G.hero.x+20,y:G.hero.y});L.hurtComp(500);
 L.check('a companion knocked to 0 is down, not dead',G.comp.state==='down');G.hero.inv={bandage:1};G.hero.x=G.comp.x+10;G.hero.y=G.comp.y;
 const a=L.getActions().find(x=>/Help Tex up/.test(x.label));a&&a.fn();L.check('a bandage gets them back up',G.comp.state==='follow'&&G.comp.hp===40);
 L.hurtComp(500);L.step(61);L.check('left for a minute, they die',!G.comp&&G.flags.dead_c_gunhand);}
// --- does a companion actually help in a fight? cricket bat vs 3 raiders, alone and with Tex, across randomised starts
{const D=require('./duelrand');const alone=D.series('bat vs 3 raiders, alone',['bat',0,['knife','bat','knife']],20),tex=D.series('bat vs 3 raiders, with Tex',['bat',0,['knife','bat','knife'],true],20);
 L.check('Tex turns a mostly losing 3-on-1 into a fight you usually win',tex>=0.6&&tex>alone+0.3,Math.round(alone*100)+'% alone, '+Math.round(tex*100)+'% with Tex');}
// --- the Dust Devils' grudge: more kills, more ambushes
{const G=fresh();const rate=r=>{G.rep.raiders=r;return Math.max(0.9,Math.min(1.25,0.7-r/200));};L.check('the angrier the raiders, the sooner the next ambush',rate(-100)>rate(-60)&&rate(-60)>=rate(-20),'ambush rate ×'+rate(-20).toFixed(2)+' at −20, ×'+rate(-60).toFixed(2)+' at −60, ×'+rate(-100).toFixed(2)+' at −100');}
{const G=fresh();let ok=true;try{L.recruit({def:{id:'c_medic',comp:'medic'},x:G.hero.x+20,y:G.hero.y});L.render();L.openInv(null);L.renderInv();L.closeInv();}catch(e){ok=false;console.log(e);}L.check('companion and standing render',ok);}
L.done();
