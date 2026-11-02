/* ===== factions and reputation ===== */
const FACTIONS={settlers:{name:'Settlers',start:5},fuelkings:{name:'Fuel Kings',start:-5},raiders:{name:'Dust Devils',start:-60}};
function repTier(v){return v<=-50?'Hated':v<=-15?'Disliked':v<20?'Neutral':v<50?'Liked':v<80?'Respected':'Hero';}
// who holds each town: the Fuel Kings own two cities and the outposts nearest them; the Settlers hold the rest
(function(){
  for(const l of LOCS)l.faction=l.camp?'raiders':l.type==='ruin'?null:'settlers';
  if(TEST_MODE){LOCS[3].faction='fuelkings';return;}
  const cities=LOCS.filter(l=>l.type==='city'&&!l.goal).sort((a,b)=>Math.hypot(a.x-LOCS[START].x,a.y-LOCS[START].y)-Math.hypot(b.x-LOCS[START].x,b.y-LOCS[START].y));
  const fk=cities.slice(1,3);for(const c of fk)c.faction='fuelkings';
  // the Kings' cities have an oil refinery in their outer ring
  for(const c of fk){if(!c.clearArc)continue;const r=rng(hash2(c.id*17+3,99));for(let t=0;t<60;t++){const a=r()*TAU;if(!c.clearArc(a,0.42))continue;c.ringTaken.push(a);
      layoutRefinery(c,a,c.ringR,r,c.fits);c.carSpawns=c.carSpawns.filter(sp=>!c.bld.some(b=>b.struct&&Math.hypot(b.x-sp.x,b.y-sp.y)<b.w/2+60));break;}}
  for(const l of LOCS){if(l.type!=='outpost'||l.id===START)continue;let best=null,bd=1e18;for(const c of LOCS)if(c.type==='city'){const d=Math.hypot(c.x-l.x,c.y-l.y);if(d<bd){bd=d;best=c;}}
    if(best&&best.faction==='fuelkings'&&bd<230000)l.faction='fuelkings';}
})();
// recruitable drifters: one at each of four towns along the way (all four in the test town)
const COMPANIONS={scrounger:{name:'Mick',title:'scrounger',price:{water:2},pitch:'I can find things other people walk past. Two bottles of water and I’m yours.',
    blurb:'Mick turns up extra loot whenever you search something, and finds a bit of tucker on the road.'},
  mechanic:{name:'Shazza',title:'mechanic',price:{parts:1},pitch:'I can keep that heap of yours running. Bring me some engine parts and I’ll come along.',
    blurb:'Shazza patches up the worst part of your car every few hours when you stop.'},
  gunhand:{name:'Tex',title:'gunhand',price:{bullets:10},pitch:'I shoot straight and I don’t ask questions. Ten rounds of revolver ammo up front.',
    blurb:'Tex fights with a revolver on foot and shoots at raider cars from your passenger seat.'},
  medic:{name:'Dulcie',title:'medic',price:{bandage:2},pitch:'I was a nurse before. Give me a couple of bandages to work with and I’ll keep you breathing.',
    blurb:'Dulcie patches you up when you’re hurt and can get you back on your feet.'}};
// the four companions' names are theirs alone: rename any townsperson anywhere who shares one
(function(){const taken=new Set(Object.values(COMPANIONS).map(c=>c.name));
  for(const o of LOCS)for(const p of o.npcs)if(taken.has(p.name)&&!p.comp){const nm=NPC_NAMES.find(n=>!taken.has(n)&&!o.npcs.some(q=>q.name===n));if(nm)p.name=nm;}})();
(function(){const order=['scrounger','mechanic','gunhand','medic'];let towns;
  if(TEST_MODE)towns=[LOCS[0],LOCS[0],LOCS[0],LOCS[0]];
  else{const dist=routeDistances(START),svc=LOCS.filter(l=>l.service&&l.id!==START&&!l.goal&&dist.has(l.id)).sort((a,b)=>dist.get(a.id)-dist.get(b.id));
    const outs=svc.filter(l=>l.type==='outpost'),cities=svc.filter(l=>l.type==='city');towns=[outs[0],outs[2]||outs[1],cities[0]||outs[3],cities[1]||outs[4]];}
  order.forEach((k,i)=>{const o=towns[i];if(!o)return;const C=COMPANIONS[k];
    for(const p of o.npcs)if(p.name===C.name)p.name=NPC_NAMES.find(n=>!o.npcs.some(q=>q.name===n)&&!Object.values(COMPANIONS).some(c=>c.name===n));
    const pub=o.bld.findIndex(b=>b.kind==='pub');o.npcs.push({id:'c_'+k,name:C.name,role:'wanderer',comp:k,work:pub,home:pub,seed:900+i*13});C.home=o.id;});})();
const ROLE_EXTRA={wanderer:'drifter',companion:'companion'};
function rep(f){return f?(G.rep[f]??FACTIONS[f].start):0;}
function changeRep(f,d,why){if(!f||!d)return;const before=repTier(rep(f));G.rep[f]=clamp(rep(f)+d,-100,100);const after=repTier(G.rep[f]);
  if(f!=='raiders')popText(body().x,body().y-44,FACTIONS[f].name+' '+(d>0?'+':'')+d,d>0?'#b9d27a':'#ff7a5a');
  if(before!==after&&f!=='raiders')setTimeout(()=>showMsg(FACTIONS[f].name+' now see you as '+after.toLowerCase(),2.6),0);}
// every raider you take out earns you standing in the towns, and makes the Dust Devils angrier
function raiderDown(){changeRep('settlers',1);changeRep('fuelkings',1);changeRep('raiders',-2);}
function townHostile(o){if(!o||!o.faction||o.faction==='raiders')return false;const day=Math.floor(G.clock/DAY),a=G.flags['assault_'+o.id];
  return rep(o.faction)<=(o.faction==='fuelkings'?-30:-50)||(a!==undefined&&day-a<2);}
function townRefuses(o){return townHostile(o)||(o&&o.faction&&rep(o.faction)<=-15);}
// when a town turns on you, its guards draw their weapons
function hostileGuards(o){for(const n of G.npcs){if(n.loc!==o||n.def.role!=='guard')continue;
  const f=makeFoe({id:'g'+n.def.id,weapon:o.faction==='fuelkings'?'shotgun':'revolver',post:{x:n.x,y:n.y},patrol:[{x:n.x,y:n.y}],seed:n.def.seed,brave:true},null,n.x,n.y);
  f.hp=f.maxHp=90;f.loose=true;f.townGuard=o.id;f.look=n.look;becomeAlert(f,body(),false);G.foes.push(f);G.npcGone.add(n.def.id);}
  G.npcs=G.npcs.filter(n=>!G.npcGone.has(n.def.id));}
function assault(n){if(n.fleeT>0)return;const o=n.loc,day=Math.floor(G.clock/DAY);n.fleeT=10;popText(n.x,n.y-20,'Help! Guards!','#ff7a5a');
  if(o.faction){changeRep(o.faction,-12);G.flags['assault_'+o.id]=day;}if(townHostile(o)){hostileGuards(o);showMsg('The guards are coming for you',2.4);}}
function makeAmends(o,cost){for(const k in cost)invTake(G.hero.inv,k,cost[k]);changeRep(o.faction,15);delete G.flags['assault_'+o.id];}
function amendsOptions(o){const h=G.hero.inv,food=(h.beans||0)+(h.jerky||0),opts=[];
  if((h.water||0)>=3)opts.push({label:'three bottles of water',cost:{water:3}});
  if(food>=3){const c={};let need=3;for(const k of ['beans','jerky']){const t=Math.min(need,h[k]||0);if(t){c[k]=t;need-=t;}}opts.push({label:'three tins and packets of food',cost:c});}
  if((h.medkit||0)>=1)opts.push({label:'a first-aid kit',cost:{medkit:1}});return opts;}
