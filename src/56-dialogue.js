/* ===== scripted dialogue library =====
   Each node has text (a string or a function of the context) and options. An option can have
   an `if` condition, a `do` effect, and `go` (the next node, or null to end).
   If `do` returns a string, it is shown as the reply, with options to go back or leave.
   If `do` returns {end:true}, the conversation closes. */
const PUB_NAMES=['The Dusty Swag','Railway Hotel','Royal Hotel','Tin Shed Tavern','The Last Drop','Commercial Hotel','The Rusty Nail','Drovers Arms','The Dry Gully'];
// the quest: Dot's brother Col drove out to the nearest ruin with a car and never came back
const QCOL=(function(){const s=LOCS[START];let best=null,bd=1e18;
  for(const l of LOCS)if(l.type==='ruin'&&l.carSpawns.length){const d=Math.hypot(l.x-s.x,l.y-s.y);if(d<bd){bd=d;best=l;}}
  return best?{ruin:best.id,car:best.carSpawns[0].id,type:best.carSpawns[0].type}:null;})();
function dctx(){const n=talk.npc,o=n.loc,h=G.hero,day=Math.floor(G.clock/DAY);
  const pick=(list,salt)=>list[Math.floor(rng(hash2(n.def.seed+(salt||0),day+3))()*list.length)];
  const hr=hourNow(),greet=hr<5?'Bit late to be wandering about':hr<12?'Mornin’':hr<17?'G’day':hr<21?'Evening':'Bit late to be wandering about';
  let car=null,cd=700;for(const c of G.cars){if(c.wrecked||c.driver==='raider'||!c.touched)continue;const d=Math.hypot(c.x-n.x,c.y-n.y);if(d<cd){cd=d;car=c;}}
  const ctx={n,o,h,day,pick,greet,car,name:n.def.name,town:o.name,zone:zoneAt(o.x,o.y).name,
    pub:PUB_NAMES[o.id%PUB_NAMES.length],first:!G.flags['met_'+n.def.id],
    flag:k=>G.flags[k],set:(k,v)=>{G.flags[k]=v===undefined?true:v;},
    daily:k=>!G.flags[k+'_'+o.id+'_'+day],markDaily:k=>{G.flags[k+'_'+o.id+'_'+day]=true;},
    has:(k,q)=>(h.inv[k]||0)>=(q||1),
    take:(k,q)=>{invTake(h.inv,k,q||1);},
    give:(k,q)=>{for(let i=0;i<(q||1);i++){if(invWeight(h.inv)+ITEMS[k].kg<=HERO_CAP+1e-6)invAdd(h.inv,k,1);
      else if(car&&invWeight(car.items)+ITEMS[k].kg<=carCap(car)){invAdd(car.items,k,1);car.touched=true;}
      else addPickup(k,h.x+rand(-25,25),h.y+rand(-25,25));}popText(h.x,h.y-30,'+ '+ITEMS[k].name+(q>1?' ×'+q:''),'#f2a03d');},
    reveal:id=>{const was=G.known.has(id);G.known.add(id);if(!was)setTimeout(()=>showMsg('Marked on your map: '+LOCS[id].name,2.4),0);return LOCS[id];},
    // the nearest place this town knows about that you don't
    rumourPlace:(filter)=>{let best=null,bd=420000;for(const l of LOCS){if(G.known.has(l.id)||(filter&&!filter(l)))continue;const d=Math.hypot(l.x-o.x,l.y-o.y);if(d<bd){bd=d;best=l;}}return best;},
    needsService:c=>c&&(c.fuel<99||c.cond<99||c.engine<99||c.tyres<99||c.susp<99),
    fac:o.faction,facName:o.faction?FACTIONS[o.faction].name:'',rep:rep(o.faction),tier:repTier(rep(o.faction)),
    kingsFuel:o.faction!=='fuelkings'||rep('fuelkings')>=0};
  return ctx;}
const LORE=['When the oil ran out the cities ate themselves. Out here we just kept doing what we always did, only hungrier.',
  'My old man said the radio stopped on a Tuesday. Just static after that. Nobody ever came to say why.',
  'The army came through once, heading for the coast. Never saw ’em come back. Their trucks are still rusting on the highway.',
  'Water’s the only money that matters now. Fuel’s a close second. Everything else is just weight.',
  'The raiders weren’t always raiders. Some of ’em were shearers, truckies, footy players. Hard times make hard men.',
  'Used to be a cricket pitch where the car yard is now. Kids still find balls in the dirt.'];
const HAVEN_LINES=['Haven? Fairy story. Green water and fresh fruit and a wall to keep the bastards out. If it’s real, it’s a long way east.',
  'A truckie told me he’d seen Haven’s gate. Big wall made of buses. Then again, he’d seen a lot of things after a few beers.',
  'Haven’s real, all right. My cousin went. She never wrote, but there’s no post, so what does that prove?'];
const SETTLER_LINES=['Flies are bad this year. Worse than the raiders, some days.','Don’t drink from the dams out west. Something died in every one of ’em.',
  'If you’re heading out, go early. The sun’ll cook you in a tin car by noon.','We had rain last month. Twenty minutes of it. Kids danced in the street.',
  'Keep your tank full and your mouth shut. That’s the outback way.','The guards say there’s a big crew working the highway. Watch your mirrors.'];
const DLG={
  publican_start:{text:c=>(c.first?c.greet+'. I’m '+c.name+'. Welcome to '+c.pub+', best pub in '+c.town+'. Only pub, too.':c.greet+'. Back again?')+' '+
      c.pick(['The beer’s warm but it’s wet.','Mind the dog, she bites.','We had a band in here once. Before.','Sit anywhere. Not that chair, it’s Merv’s.']),
    opts:[{t:'Let’s do business',do:c=>{endTalk();openTrade(c.n);return {end:true};}},
      {t:'Get a feed and a drink',if:c=>(c.h.water<95||c.h.food<95)&&!G.flags['feed_'+c.o.id],do:c=>{G.flags['feed_'+c.o.id]=true;c.h.water=100;c.h.food=100;SFX.pick();
        return c.pick(['A tin plate of mutton stew and a jug of bore water. “First feed’s on the house. After that, it’s trade.”','Damper, beans and cold tea. “This one’s free, love. Next time bring something to swap.”','Roo steak, charred black. “On the house, first time. Don’t ask what’s in the gravy.”'],5);}},
      {t:'Heard any news?',go:'rumour'},
      {t:'Ever heard of Haven?',do:c=>c.pick(HAVEN_LINES,9)},
      {t:'See you round',go:null}]},
  mechanic_start:{text:c=>c.name+' wipes their hands on a greasy rag. '+(c.first?'“Name’s '+c.name+'. If it’s got wheels, I can fix it. If it hasn’t, I can probably put some on it.”':
      '“'+c.pick(['Back already? What’ve you done to it this time?','Mind the grease pit.','I can hear your diff from here.','Bring me something interesting.'])+'”'),
    opts:[{t:'Will you fill her up?',if:c=>c.needsService(c.car)&&!c.kingsFuel,do:c=>'“Fuel’s for friends of the Kings. Do the Kings a favour first. Ask one of the guards about work.”'},
      {t:c=>'Can you look at my '+c.car.def.name+'?',if:c=>c.needsService(c.car)&&c.kingsFuel,do:c=>{endTalk();openTrade(c.n);return {end:true};}},
      {t:'Let’s trade parts',if:c=>c.kingsFuel,do:c=>{endTalk();openTrade(c.n);return {end:true};}},
      {t:'My car’s fine, thanks',if:c=>c.car&&!c.needsService(c.car),go:null},
      {t:'I’m on foot. Any cars going?',if:c=>!c.car,go:'car_rumour'},
      {t:'Know where I could find a car?',go:'car_rumour'},
      {t:'Cheers',go:null}]},
  car_rumour:{text:c=>{const l=c.rumourPlace(x=>x.type==='ruin'&&x.carSpawns.length);if(!l)return '“Every car I know of is in this yard. Sorry, mate.”';
      c.reveal(l.id);return '“Some bloke left a '+CARS[l.carSpawns[0].type].name+' out at '+l.name+'. Ran out of fuel, walked in, died of something. Might still be there.”';},
    opts:[{t:'Thanks',go:null}]},
  doctor_start:{text:c=>'“'+(c.first?'I’m Dr '+c.name+'. Well, I was a vet. Close enough these days.':c.pick(['What have you done to yourself now?','Sit down before you fall down.','Don’t touch anything on that tray.']))+'”',
    opts:[{t:'Patch me up',if:c=>c.h.hp<100,do:c=>{endTalk();openTrade(c.n);return {end:true};}},
      {t:'What have you got?',do:c=>{endTalk();openTrade(c.n);return {end:true};}},
      {t:'Thanks, doc',go:null}]},
  trader_start:{text:c=>'“'+(c.first?c.name+'’s the name, trade’s the game. ':'')+c.pick(['Everything’s got a price. Water’s king.','Durries, watches, bullets. I take it all.','Fresh stock this morning, near enough.'])+'”',
    opts:[{t:'Let’s trade',do:c=>{endTalk();openTrade(c.n);return {end:true};}},{t:'Heard any news?',go:'rumour'},{t:'Later, then',go:null}]},
  guard_start:{text:c=>c.name+' looks you up and down. “'+c.pick(['Keep your nose clean in '+c.town+' and we’ll get along.','No fighting inside the walls.','You’re not a raider. Raiders don’t look that tired.'])+'”',
    opts:[{t:'Which way to Haven?',if:c=>G.dest!==LOCS.findIndex(l=>l.goal),do:c=>{const hv=LOCS.findIndex(l=>l.goal),p=routePath(G.lastNode,hv);
        if(!p)return '“Haven? No road goes there from here. You’d need wings.”';for(const L of p.legs)G.known.add(L.to);setDest(hv);
        return '“East. Always east. Take the road to '+LOCS[p.legs[0].to].name+', then keep asking.” Your map now shows the way.';}},
      {t:'Seen any raiders about?',do:c=>{const l=c.o.links[Math.floor(rng(c.n.def.seed+c.day)()*c.o.links.length)];if(!l)return '“Quiet lately. Too quiet, my old sergeant would say.”';
        return '“A crew’s been working the '+ROADCLS[roads[l.road].cls].label+' out to '+LOCS[l.to].name+'. If one pulls up alongside you, shove the bastard into the scrub.”';}},
      {t:'Any work going?',if:c=>c.fac==='fuelkings'&&!G.flags.bounty,go:'fk_bounty'},
      {t:'About that bounty…',if:c=>c.fac==='fuelkings'&&G.flags.bounty&&!G.flags.bountyPaid,go:'fk_bounty_check'},
      {t:'Where do I stand here?',do:c=>c.fac?'“Round here, the '+c.facName+' reckon you’re '+c.tier.toLowerCase()+'.” '+(c.rep>=20?'They nod at you like you belong.':c.rep<=-15?'Their hand never leaves the gun.':'They don’t know you yet.'):'“You stand on dirt, same as everyone.”'},
      {t:'I’ll be on my way',go:null}]},
  fk_bounty:{text:c=>{let best=null,bd=1e18;for(const l of LOCS)if(l.camp&&!G.flags['camp_'+l.id]){const d=Math.hypot(l.x-c.o.x,l.y-c.o.y);if(d<bd){bd=d;best=l;}}
      if(!best)return '“The roads are quiet. For now.”';c.set('bounty',best.id);c.reveal(best.id);
      return '“The Kings want '+best.name+' cleaned out. Raiders have been bleeding our convoys dry. Put every one of them in the ground and come back. The Kings pay their debts.”';},
    opts:[{t:'Consider it done',go:null}]},
  fk_bounty_check:{text:c=>G.flags['camp_'+G.flags.bounty]?'“Word came in. '+LOCS[G.flags.bounty].name+' is a graveyard now. Here.”':'“'+LOCS[G.flags.bounty].name+' is still crawling with raiders. Get on with it.”',
    opts:[{t:'Collect the bounty',if:c=>!!G.flags['camp_'+G.flags.bounty],do:c=>{G.flags.bountyPaid=true;c.give('bullets',12);c.give('medkit',1);changeRep('fuelkings',15);
        return 'The guard counts out twelve rounds and a first-aid kit. “The Kings remember who helps them.”';}},{t:'Right',go:null}]},
  // when a town won't serve you
  refuse:{text:c=>townHostile(c.o)?'“Get out of here before the guards put you down!”':'“We don’t serve your sort in '+c.town+'. The '+c.facName+' haven’t forgotten what you’ve done.”',
    opts:[{t:'I want to make amends',if:c=>amendsOptions(c.o).length>0,go:'amends'},{t:'Fine',go:null}]},
  amends:{text:c=>'“Supplies talk louder than sorry. What are you offering?”',
    opts:[0,1,2].map(i=>({t:c=>{const a=amendsOptions(c.o)[i];return a?'Give '+a.label:'';},if:c=>!!amendsOptions(c.o)[i],
      do:c=>{const a=amendsOptions(c.o)[i];makeAmends(c.o,a.cost);return '“That’ll do for a start. Don’t make us regret it.”';}})).concat([{t:'Never mind',go:null}])},
  // drifters who'll travel with you
  wanderer_start:{text:c=>{const C=COMPANIONS[c.n.def.comp];return (c.first?'“Name’s '+C.name+'.” ':'')+'“'+C.pitch+'”';},
    opts:[{t:'Want to come along?',if:c=>!compActive(),do:c=>{const C=COMPANIONS[c.n.def.comp],free=c.rep>=50;
        for(const k in C.price)if(!free&&!c.has(k,C.price[k]))return '“No offence, but I don’t work for promises. Come back with '+priceText(C.price)+'.”';
        if(!free)for(const k in C.price)c.take(k,C.price[k]);recruit(c.n);return {end:true};}},
      {t:'I’ve already got company',if:c=>compActive(),go:null},
      {t:'What can you do?',do:c=>COMPANIONS[c.n.def.comp].blurb},
      {t:'Maybe later',go:null}]},
  companion_start:{text:c=>{const p=G.comp;return '“'+(p.hp<40?'I’m hurting, boss.':p.missed?'I’m starving here.':c.pick(['What’s the plan?','Long road, this.','I’ve got your back.','Say the word.']))+'”';},
    opts:[{t:'Wait here',if:c=>G.comp.state==='follow',do:c=>{G.comp.state='wait';return {end:true};}},
      {t:'Follow me',if:c=>G.comp.state==='wait',do:c=>{G.comp.state='follow';return {end:true};}},
      {t:'Patch me up',if:c=>G.comp.type==='medic'&&G.hero.hp<95&&G.comp.abilityT<=0,do:c=>{G.hero.hp=Math.min(100,G.hero.hp+30);G.comp.abilityT=90;return '“Hold still.” She works fast and doesn’t fuss.';}},
      {t:'Have a look at the car',if:c=>G.comp.type==='mechanic'&&!!carById(G.lastCar)&&G.comp.abilityT<=0,do:c=>{const k=carById(G.lastCar);for(const p of ['cond','engine','tyres','susp'])addPart(k,p,12);G.comp.abilityT=180;k.touched=true;return '“Should hold together a while longer.”';}},
      {t:'How are you holding up?',do:c=>{const p=G.comp;return p.def.name+' is at '+Math.round(p.hp)+'% health'+(p.type==='gunhand'?' with '+p.ammo+' rounds left':'')+'. '+(p.missed?'They went without food and water today.':'Fed and watered.');}},
      {t:'Time we parted ways',do:c=>{compLeave('part');return {end:true};}},
      {t:'Let’s keep moving',go:null}]},

  settler_start:{text:c=>{if(c.o.id===START&&c.name==='Dot'&&QCOL){const q=c.flag('q_col');
        if(!q)return 'Dot keeps glancing at the road. “Sorry, love. Miles away.”';
        if(q==='active')return '“Any sign of Col’s '+CARS[QCOL.type].name+'?”';
        return '“Thanks again, love. Look after that car for him.”';}
      return (c.first?'“'+c.greet+'. I’m '+c.name+'.” ':'')+'“'+c.pick(SETTLER_LINES)+'”';},
    opts:[{t:'Something wrong?',if:c=>c.o.id===START&&c.name==='Dot'&&QCOL&&!c.flag('q_col'),go:'dot_ask'},
      {t:c=>'I brought back Col’s '+CARS[QCOL.type].name,if:c=>c.name==='Dot'&&c.flag('q_col')==='active'&&G.cars.some(k=>k.id===QCOL.car&&!k.wrecked&&Math.hypot(k.x-c.n.x,k.y-c.n.y)<700),
        do:c=>{c.set('q_col','done');c.give('medkit',1);c.give('toolkit',1);c.give('beans',2);changeRep('settlers',15);
          return 'Dot runs a hand along the bonnet for a long time. “No sign of him, then.” She swallows. “Take these. And keep the car. He’d want it driven, not rusting out there.”';}},
      {t:'Heard any news?',go:'rumour'},{t:'What happened, back then?',do:c=>c.pick(LORE,7)},{t:'Ever heard of Haven?',do:c=>c.pick(HAVEN_LINES,8)},{t:'See you',go:null}]},
  dot_ask:{text:c=>'“It’s my brother, Col. He drove out to '+LOCS[QCOL.ruin].name+' a week back in his '+CARS[QCOL.type].name+'. Said there was a fuel cache. He never came home.” Her voice cracks. “If you find that car, bring it back here. I haven’t got much, but it’s yours.”',
    opts:[{t:'I’ll look for it',do:c=>{c.set('q_col','active');c.reveal(QCOL.ruin);return '“Bless you. Watch yourself out there.” '+LOCS[QCOL.ruin].name+' is now on your map.';}},
      {t:'Sorry. I can’t help',go:null}]},
  scavenger_start:{text:c=>c.name+' is picking through the rubble. “'+(c.first?'Don’t mind me. I was here first, mind. ':'')+c.pick(['Water. You got water? I’ll trade.','Picked this place over twice. Still finding things.','Sun’s getting to me. Or the other way round.'])+'”',
    opts:[{t:'Trade two water bottles',if:c=>c.has('water',2)&&!c.flag('scav_'+c.n.def.id),do:c=>{c.take('water',2);c.set('scav_'+c.n.def.id);const p=c.pick(['toolkit','parts','springs','medkit'],3);c.give(p,1);changeRep('settlers',2);
        return '“Pleasure doing business.” '+c.name+' hands over a '+ITEMS[p].name.toLowerCase()+' and drinks half a bottle on the spot.';}},
      {t:'Show me what you’ve got',do:c=>{endTalk();openTrade(c.n);return {end:true};}},{t:'Know any good spots?',go:'rumour'},{t:'Good luck',go:null}]},
  rumour:{text:c=>{const l=c.rumourPlace();if(!l)return '“Nothing you haven’t heard, I reckon.”';c.reveal(l.id);
      const what=l.type==='ruin'?'an old '+l.name.split(' ').slice(1).join(' ').toLowerCase()+' out past the '+zoneAt(l.x,l.y).name+' way. Folk say it hasn’t been picked clean':
        l.type==='city'?'a whole city called '+l.name+'. Walls and everything':'an outpost called '+l.name+'. Decent people, mostly';
      return '“There’s '+what+'.”';},opts:[{t:'Thanks',go:null}]}
};
// ---- conversation runtime ----
let talk=null;
function startNodeFor(n){const svc=['publican','mechanic','doctor','trader','settler','wanderer'].includes(n.def.role);return svc&&n.loc&&townRefuses(n.loc)?'refuse':n.def.role+'_start';}
function priceText(p){return Object.keys(p).map(k=>p[k]+' '+(p[k]>1?ITEMS[k].name.toLowerCase()+'s':ITEMS[k].name.toLowerCase()).replace('rounds s','rounds').replace('ammos','ammo')).join(' and ');}
function startTalk(n){talk={npc:n};n.talking=true;state='talk';endStick();SFX.engine(0,0,false,false);$('ctx').innerHTML='';ctxKey='';$('talk').classList.remove('hidden');
  goNode(startNodeFor(n));G.flags['met_'+n.def.id]=true;}
function goNode(id){if(!id||!DLG[id])return endTalk();const N=DLG[id],c=dctx();talk.node=id;
  talk.text=typeof N.text==='function'?N.text(c):N.text;talk.opts=N.opts.filter(o=>!o.if||o.if(c));renderTalk();}
function chooseOpt(i){const o=talk&&talk.opts[i];if(!o)return;let next=o.go;
  if(o.do){const r=o.do(dctx());if(r&&r.end)return endTalk();
    if(typeof r==='string'){talk.text=r;talk.opts=[{t:'Something else',go:startNodeFor(talk.npc)},{t:'Bye',go:null}];renderTalk();return;}}
  goNode(next);}
function endTalk(){if(talk)talk.npc.talking=false;talk=null;$('talk').classList.add('hidden');if(state==='talk'){state='play';hidePanel();}}
function renderTalk(){const n=talk.npc,c=dctx();$('tName').textContent=n.def.name+', '+(n.def.role==='companion'?COMPANIONS[n.type].title:n.def.role==='wanderer'?COMPANIONS[n.def.comp].title:ROLE_LABEL[n.def.role]);$('tText').textContent=talk.text;
  const box=$('tOpts');box.innerHTML='';talk.opts.forEach((o,i)=>{const b=document.createElement('button');b.textContent=(i+1)+'. '+(typeof o.t==='function'?o.t(c):o.t);
    b.addEventListener('click',e=>{e.stopPropagation();chooseOpt(i);});box.appendChild(b);});}
