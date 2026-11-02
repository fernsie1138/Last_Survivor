/* ===== input, panels, settings, map, HUD ===== */
const keys={};
const touch={boost:false,brake:false,reverse:false};
const stick={id:null,ox:0,oy:0,x:0,y:0,active:false};
const STICK_R=82;   // how far the knob travels: a bigger stick means finer control at low speed
window.addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='TEXTAREA')return;if(e.target&&e.target.tagName==='INPUT'){if(e.code==='Enter')markerSave();if(e.code==='Escape')markerClose();return;}keys[e.code]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if((e.code==='KeyP'||e.code==='Escape')&&state!=='talk'){if(state==='map')closeMap();else togglePause();}
  if(e.code==='KeyM'){if(state==='map')closeMap();else openMap();}
  if(e.code==='KeyI'){if(state==='inv')closeInv();else if(state==='play')openInv(null);}
  if(state==='talk'){const m=e.code.match(/^(Digit|Numpad)([1-9])$/);if(m)chooseOpt(+m[2]-1);if(e.code==='Escape')endTalk();}
  if(state==='play'&&(e.code==='Equal'||e.code==='NumpadAdd')){setZoom(SETTINGS.zoom*1.15);saveSettings();}
  if(state==='play'&&(e.code==='Minus'||e.code==='NumpadSubtract')){setZoom(SETTINGS.zoom/1.15);saveSettings();}
  if(state==='play'&&e.code==='Digit0'){setZoom(1);saveSettings();}
  if(state==='map'&&(e.code==='Equal'||e.code==='NumpadAdd'))mapZoom(1.5);
  if(state==='map'&&(e.code==='Minus'||e.code==='NumpadSubtract'))mapZoom(1/1.5);
  if(state==='play'){const a=getActions().find(x=>'Key'+x.k===e.code);if(a)runAction(a.k);
    if(e.code==='Space'&&!G.hero.inCar)heroAttack();if(e.code==='KeyV')toggleSneak();if(e.code==='KeyG'&&G.hero.inCar)heroDriveShoot();}});
// one tap, one action: the same button firing twice within a third of a second (a tap seen as both touch and pointer) counts once
const lastAct={};
function runAction(k){const now=performance.now();if(now-(lastAct[k]||-1e9)<350)return;lastAct[k]=now;const a=getActions().find(x=>x.k===k);if(a)a.fn();}
function toggleSneak(){const h=G.hero;if(h.inCar)return;const now=performance.now();if(now-(lastAct.sneak||-1e9)<300)return;lastAct.sneak=now;h.crouch=!h.crouch;$('bSneak').classList.toggle('on',h.crouch);}
window.addEventListener('keyup',e=>{if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))return;keys[e.code]=false;});
function enableTouchUI(){document.body.classList.add('touch');}
if(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches)enableTouchUI();
const sb=$('stickBase'),sk=$('stickKnob');
const mapPtrs=new Map();let mapGesture=null;
// pinch to zoom while playing: out to see twice as far, in for a closer look
const ZMIN=0.5,ZMAX=1.6,playPtrs=new Map();let pinch=null;
function setZoom(z){SETTINGS.zoom=clamp(z,ZMIN,ZMAX);if(Math.abs(SETTINGS.zoom-1)<0.04)SETTINGS.zoom=1;$('zoomBtn').classList.toggle('hidden',SETTINGS.zoom===1);}
function pinchDist(){const [a,b]=[...playPtrs.values()];return Math.hypot(a.x-b.x,a.y-b.y);}
window.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')enableTouchUI();
  if(e.target.closest&&(e.target.closest('button')||e.target.closest('#markerDlg')||e.target.closest('#mapInfo')))return;
  if(state==='map'){mapPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});mapGestureStart(e);return;}
  if(state!=='play'||e.pointerType==='mouse')return;
  if(e.pointerType==='touch'&&HAS_TOUCH)return;   // fingers are handled by the touch layer below
  playPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(playPtrs.size===2){endStick();pinch={d0:Math.max(20,pinchDist()),z0:SETTINGS.zoom};return;}   // a second finger turns it into a pinch
  if(pinch)return;
  // the joystick lives on the right; buttons are on the left
  if(e.clientX>W*0.38&&stick.id===null){stick.id=e.pointerId;stick.ox=stick.x=e.clientX;stick.oy=stick.y=e.clientY;stick.active=true;
    sb.style.display='block';sb.style.left=e.clientX+'px';sb.style.top=e.clientY+'px';sk.style.transform='translate(0,0)';}
});
window.addEventListener('pointermove',e=>{
  if(state==='map'&&mapPtrs.has(e.pointerId)){mapPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});mapGestureMove();return;}
  if(playPtrs.has(e.pointerId)){playPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch&&playPtrs.size>=2){setZoom(pinch.z0*pinchDist()/pinch.d0);return;}}
  if(e.pointerId!==stick.id)return;stick.x=e.clientX;stick.y=e.clientY;
  let dx=stick.x-stick.ox,dy=stick.y-stick.oy;const m=Math.hypot(dx,dy);if(m>STICK_R){dx*=STICK_R/m;dy*=STICK_R/m;}
  sk.style.transform='translate('+dx+'px,'+dy+'px)';});
function endStick(e){if(e&&e.pointerId!==undefined&&e.pointerId!==stick.id)return;stick.id=null;stick.active=false;sb.style.display='none';}
function startStick(id,x,y){stick.id=id;stick.ox=stick.x=x;stick.oy=stick.y=y;stick.active=true;sb.style.display='block';sb.style.left=x+'px';sb.style.top=y+'px';sk.style.transform='translate(0,0)';}
function moveStick(x,y){stick.x=x;stick.y=y;let dx=x-stick.ox,dy=y-stick.oy;const m=Math.hypot(dx,dy);if(m>STICK_R){dx*=STICK_R/m;dy*=STICK_R/m;}sk.style.transform='translate('+dx+'px,'+dy+'px)';}
function ptrUp(e){if(state==='map'&&mapPtrs.has(e.pointerId)){mapGestureEnd(e);mapPtrs.delete(e.pointerId);return;}
  playPtrs.delete(e.pointerId);if(pinch&&playPtrs.size<2){pinch=null;saveSettings();}endStick(e);}
window.addEventListener('pointerup',ptrUp);window.addEventListener('pointercancel',ptrUp);
window.addEventListener('wheel',e=>{if(state==='play'){e.preventDefault();setZoom(SETTINGS.zoom*(e.deltaY<0?1.1:1/1.1));saveSettings();return;}if(state!=='map')return;e.preventDefault();mapZoom(e.deltaY<0?1.2:1/1.2,e.clientX,e.clientY);},{passive:false});
// hold-to-use buttons
for(const [id,key] of [['bBoost','boost'],['bBrake','brake'],['bReverse','reverse']]){const el=$(id);
  const on=e=>{if(e.pointerType==='touch'&&HAS_TOUCH)return;e.preventDefault();e.stopPropagation();touch[key]=true;el.classList.add('held');if(el.setPointerCapture)try{el.setPointerCapture(e.pointerId);}catch(_){}};
  const off=()=>{touch[key]=false;el.classList.remove('held');};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);}
$('pauseBtn').addEventListener('click',()=>togglePause());
$('zoomBtn').addEventListener('click',e=>{e.stopPropagation();setZoom(1);saveSettings();});setZoom(SETTINGS.zoom);
$('toolsBtn').classList.toggle('hidden',!TEST_MODE);$('toolsBtn').addEventListener('click',e=>{e.stopPropagation();toolsPanel();});
for(const [id,fn] of [['bAttack',()=>heroAttack()],['bSneak',()=>toggleSneak()],['bShoot',()=>heroDriveShoot()]])
  $(id).addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&HAS_TOUCH)return;e.preventDefault();e.stopPropagation();fn();});
// ---- touch layer: native touch events follow each finger by its own identifier, so two thumbs work together on an iPad ----
// iPads in Safari's desktop mode can hide 'ontouchstart' but still send touch events, so check every sign of a touchscreen
const HAS_TOUCH=typeof window!=='undefined'&&(typeof TouchEvent!=='undefined'||'ontouchstart' in window||(navigator.maxTouchPoints||0)>0);
const fingers=new Map(),TAP_BTNS={bAttack:()=>heroAttack(),bSneak:()=>toggleSneak(),bShoot:()=>heroDriveShoot()},HOLD_BTNS={bBoost:'boost',bBrake:'brake',bReverse:'reverse'};
function fieldFingers(){return [...fingers.entries()].filter(([,f])=>f.role==='stick'||f.role==='pinch'||f.role==='field');}
// forget any finger the browser no longer reports as touching: Safari sometimes never tells us a finger lifted
// (for instance when the button under it vanishes), and a finger stuck "down" would block scrolling everywhere
function pruneFingers(e){const live=new Set();for(const t of e.touches||[])live.add(t.identifier);
  for(const [id,f] of fingers)if(!live.has(id)){fingers.delete(id);if(f.role==='hold'){touch[f.key]=false;f.el.classList.remove('held');}else if(f.role==='tap')f.el.classList.remove('held');else if(f.role==='stick'&&stick.id==='t'+id)endStick();else if(f.role==='pinch'){pinch=null;}}}
function touchStart(e){enableTouchUI();pruneFingers(e);for(const t of e.changedTouches)fingers.delete(t.identifier);
  if(state!=='play'){for(const [id,f] of fingers)if(f.role==='stick'&&stick.id==='t'+id)endStick();fingers.clear();return;}   // menus, the map, dialogue and trading use ordinary taps and scrolling
  for(const t of e.changedTouches){const b=t.target&&t.target.closest?t.target.closest('button'):null;
    if(b&&HOLD_BTNS[b.id]){touch[HOLD_BTNS[b.id]]=true;b.classList.add('held');fingers.set(t.identifier,{role:'hold',key:HOLD_BTNS[b.id],el:b});e.preventDefault();continue;}
    if(b&&TAP_BTNS[b.id]){b.classList.add('held');fingers.set(t.identifier,{role:'tap',el:b});TAP_BTNS[b.id]();e.preventDefault();continue;}
    if(b&&b.classList.contains('cbtn')){fingers.set(t.identifier,{role:'tap',el:b});runAction(b.dataset.k);e.preventDefault();continue;}
    if(b)continue;   // Gear, Map, Pause and the rest keep their normal taps
    fingers.set(t.identifier,{role:'field',x:t.clientX,y:t.clientY});e.preventDefault();
    const field=fieldFingers();
    if(field.length===2){endStick();for(const [,f] of field)f.role='pinch';const [a,c]=field.map(([,f])=>f);pinch={d0:Math.max(20,Math.hypot(a.x-c.x,a.y-c.y)),z0:SETTINGS.zoom};continue;}
    if(!pinch&&t.clientX>W*0.38&&stick.id===null){fingers.get(t.identifier).role='stick';startStick('t'+t.identifier,t.clientX,t.clientY);}}}
function touchMove(e){pruneFingers(e);for(const t of e.changedTouches){const f=fingers.get(t.identifier);if(!f)continue;f.x=t.clientX;f.y=t.clientY;
    if(f.role==='stick'&&stick.id==='t'+t.identifier)moveStick(t.clientX,t.clientY);
    if(f.role==='pinch'&&pinch){const p=[...fingers.values()].filter(q=>q.role==='pinch');if(p.length>=2)setZoom(pinch.z0*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/pinch.d0);}}
  // only hold the page still while a finger is steering, pinching or holding a control, and only in play
  if(state==='play'&&[...fingers.values()].some(f=>f.role==='stick'||f.role==='pinch'||f.role==='hold'||f.role==='field'))e.preventDefault();}
function touchEnd(e){pruneFingers(e);for(const t of e.changedTouches){const f=fingers.get(t.identifier);if(!f)continue;fingers.delete(t.identifier);
    if(f.role==='hold'){touch[f.key]=false;f.el.classList.remove('held');}
    else if(f.role==='tap')f.el.classList.remove('held');
    else if(f.role==='stick'&&stick.id==='t'+t.identifier)endStick();
    else if(f.role==='pinch'&&pinch){const left=[...fingers.values()].filter(q=>q.role==='pinch');if(left.length<2){pinch=null;saveSettings();for(const q of left)q.role='field';}}}}
window.addEventListener('touchstart',touchStart,{passive:false});window.addEventListener('touchmove',touchMove,{passive:false});
window.addEventListener('touchend',touchEnd);window.addEventListener('touchcancel',touchEnd);
$('gearBtn').addEventListener('click',e=>{e.stopPropagation();openInv(null);});
$('invClose').addEventListener('click',e=>{e.stopPropagation();closeInv();});
$('invBody').addEventListener('click',invClick);
$('tradeClose').addEventListener('click',e=>{e.stopPropagation();closeTrade();});
$('tradeBody').addEventListener('click',tradeClick);
$('mapBtn').addEventListener('click',e=>{e.stopPropagation();openMap();});
$('mapClose').addEventListener('click',e=>{e.stopPropagation();closeMap();});
$('mapZoomIn').addEventListener('click',e=>{e.stopPropagation();mapZoom(1.5);});
$('mapZoomOut').addEventListener('click',e=>{e.stopPropagation();mapZoom(1/1.5);});
$('miGo').addEventListener('click',e=>{e.stopPropagation();if(mapSel!==null){setDest(mapSel);updateMapInfo();}});
$('mdSave').addEventListener('click',e=>{e.stopPropagation();markerSave();});$('mdCancel').addEventListener('click',e=>{e.stopPropagation();markerClose();});
$('miBtns').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.stopPropagation();markerAction(b.dataset.a);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')togglePause();});

function readInput(car){
  const kU=keys.ArrowUp||keys.KeyW,kD=keys.ArrowDown||keys.KeyS,kL=keys.ArrowLeft||keys.KeyA,kR=keys.ArrowRight||keys.KeyD;
  const inp={thr:0,steer:0,boost:false,drift:false,brake:false,mx:0,my:0,sprint:false},rot=G.camRot;
  if(car){
    inp.thr=kU?1:kD?-1:0;inp.steer=(kR?1:0)-(kL?1:0);
    inp.boost=!!(keys.ShiftLeft||keys.ShiftRight||keys.Space||touch.boost);
    if(stick.active){const dx=stick.x-stick.ox,dy=stick.y-stick.oy,m=Math.min(1,Math.hypot(dx,dy)/STICK_R);
      // a gentle curve: small pushes creep along, a full push is full speed
      if(m>0.14){const d=angDiff(Math.atan2(dy,dx)-rot,car.a),p=Math.pow((m-0.14)/0.86,1.5);inp.steer=clamp(d*2.4,-1,1);inp.thr=Math.abs(d)<1.9?Math.max(0.06,p):0.2;inp.cruise=true;
        inp.drift=Math.abs(d)>1.2&&car.vf>250;}}
    if(kD&&inp.steer!==0&&car.vf>200)inp.drift=true;
    inp.brake=!!(keys.KeyB||touch.brake);
    // Reverse: back up; the stick then points where you want the back of the car to go
    if(touch.reverse){inp.thr=-1;inp.boost=false;inp.drift=false;inp.steer=0;
      if(stick.active){const dx=stick.x-stick.ox,dy=stick.y-stick.oy;if(Math.hypot(dx,dy)>11){const d=angDiff(Math.atan2(dy,dx)-rot,car.a+Math.PI);inp.steer=clamp(-d*2.4,-1,1);}}}
  } else {
    let mx=(kR?1:0)-(kL?1:0),my=(kD?1:0)-(kU?1:0);const m=Math.hypot(mx,my);if(m>0){mx/=m;my/=m;}
    inp.sprint=!!(keys.ShiftLeft||keys.ShiftRight);
    if(stick.active){const dx=stick.x-stick.ox,dy=stick.y-stick.oy,l=Math.hypot(dx,dy),s=Math.min(1,l/STICK_R);
      if(s>0.15){mx=dx/l*s;my=dy/l*s;inp.sprint=s>0.92;}}
    // screen directions -> world directions when the view is rotated
    const c=Math.cos(-rot),sn=Math.sin(-rot);inp.mx=mx*c-my*sn;inp.my=mx*sn+my*c;
  }
  return inp;
}

let msgTimer=null;
function showMsg(t,dur){const m=$('msg');m.textContent=t;m.classList.add('on');clearTimeout(msgTimer);msgTimer=setTimeout(()=>m.classList.remove('on'),(dur||2.2)*1000);}
function showPanel(cfg){$('ver').textContent='Last Survivor v'+VERSION;panelCfg=cfg;
  $('sTitle').textContent=cfg.title;$('sSub').textContent=cfg.sub||'';$('sStats').innerHTML=cfg.stats||'';
  if(cfg.ver)$('sStats').innerHTML+='<div style="opacity:.65;margin-top:8px;font-size:17px">Version '+VERSION+'</div>';
  const box=$('sBtns');box.innerHTML='';
  cfg.buttons.forEach(b=>{const el=document.createElement('button');el.className='pbtn'+(b.primary?' primary':'');el.textContent=b.label;
    el.addEventListener('click',ev=>{ev.stopPropagation();SFX.init();b.fn();});box.appendChild(el);});
  $('sCtl').style.display=cfg.controls?'block':'none';
  $('screen').classList.add('show');$('hud').classList.add('hidden');$('ctx').innerHTML='';ctxKey='';
  setTimeout(()=>{const f=box.querySelector('button');if(f&&f.focus)f.focus();},50);}
function hidePanel(){$('screen').classList.remove('show');$('hud').classList.remove('hidden');}
const km=px=>px/M/1000;
const TYPE_LABEL={city:'City',outpost:'Outpost',ruin:'Ruins'};

// ---- settings ----
function settingsPanel(back){
  const cam=SETTINGS.rotate?'Camera: car faces up, the world turns':'Camera: north stays up';
  const view=want3d()?'View: 3D (prototype, chase camera)':'View: 2D';
  showPanel({title:'Settings',sub:'Changes are saved on this device.'+(want3d()?' In 3D the camera follows behind you; pinch to pull it in or out. The map is still 2D.':''),buttons:[
    {label:cam,primary:true,fn:()=>{SETTINGS.rotate=!SETTINGS.rotate;saveSettings();settingsPanel(back);}},
    {label:view,fn:()=>{SETTINGS.view=want3d()?'2d':'3d';saveSettings();if(V3.status==='failed')V3.status='off';if(want3d())load3D();settingsPanel(back);}},
    {label:'Back',fn:back}]});
}

// ---- flow ----
function switchWorld(test){try{if(test)localStorage.setItem('lastsurvivor.world','test');else localStorage.removeItem('lastsurvivor.world');}catch(e){}
  try{if(location.hash==='#testrange'&&!test)history.replaceState(null,'',location.pathname+location.search);}catch(e){}location.reload();}
function titleScreen(){
  state='title';const btns=[];
  if(TEST_MODE){btns.push({label:'Load a save file',fn:()=>loadPanel(titleScreen)});
    btns.push({label:'Start a fresh test session',primary:true,fn:()=>{newGame();arrive(LOCS[START],'intro');}});
    btns.push({label:'Back to the full game',fn:()=>switchWorld(false)},{label:'Settings',fn:()=>settingsPanel(titleScreen)});
    showPanel({title:'Test Range',sub:'A 1 km island with every feature in reach: a town with all the locals, a car yard with every vehicle, crates with every item, ruins, a raider camp, all four zones, every road grade, the sea and a Haven. It has its own save. Use the Tools button to spawn raiders, change the time and teleport.',buttons:btns,controls:true});return;}
  btns.push({label:'Start',primary:true,fn:()=>{newGame();arrive(LOCS[START],'intro');}});
  btns.push({label:'Load a save file',fn:()=>loadPanel(titleScreen)});
  btns.push({label:'Settings',fn:()=>settingsPanel(titleScreen)},{label:'Test range',fn:()=>switchWorld(true)});
  showPanel({title:'Last Survivor',ver:true,sub:'Outback Australia, a few years after it all ended. The roads still run between the last outposts. Raiders own the stretches in between. Haven is somewhere far to the east.',buttons:btns,controls:true});
}
// reaching any place on the network: update the route
function nodeReached(id){
  G.lastNode=id;G.inside=id;learnAround(LOCS[id]);
  if(G.leg&&G.leg.to===id)G.legsDone++;
  if(G.dest!==null&&G.dest!==id){const p=routePath(id,G.dest);G.leg=p&&p.legs.length?p.legs[0]:null;
    if(G.leg&&LOCS[id].type==='ruin')showMsg('Next: road to '+LOCS[G.leg.to].name,2.4);}
  else{if(G.dest===id&&LOCS[id].type==='ruin')showMsg('You’ve reached '+LOCS[id].name,2.4);G.dest=null;G.leg=null;}
}
function setDest(id){G.dest=id;const p=routePath(G.lastNode,id);G.leg=p&&p.legs.length?p.legs[0]:null;if(!G.leg)G.dest=null;
  G.legNear=null;G.encT=Math.max(G.encT,25);}
// walking or driving into a town or outpost. Services come from its people now: the publican, the mechanic, the doctor.
function arrive(o,mode){
  G.atOutpost=o.id;if(!mode)nodeReached(o.id);else{G.lastNode=o.id;G.inside=o.id;learnAround(o);}
  G.cars=G.cars.filter(c=>c.driver!=='raider');G.encActive=false;
  if(G.comp&&G.comp.state!=='down'){G.comp.hp=G.comp.maxHp;if(G.comp.type==='gunhand')G.comp.ammo=24;}
  const fresh=!G.visited.has(o.id);G.visited.add(o.id);
  if(o.goal)return win();
  if(mode==='intro'){state='outpost';endStick();
    G.outpostPanel={title:o.name,sub:TEST_MODE?'Test Town. Every vehicle is in the car yard just outside the wall, with crates of weapons, supplies and spares beside them. Everything is marked on the map. Tools are top right.':'Rust Hollow, on the edge of '+zoneAt(o.x,o.y).name+'. Your Kestrel GT is parked beside you. No guns, no friends. Haven is somewhere far to the east. Talk to the locals before you go: the publican, the mechanic, the guards.',
      buttons:[{label:'Head out',primary:true,fn:()=>departPanel(true)},{label:'Open the map',fn:()=>openMap()},{label:'Settings',fn:()=>settingsPanel(()=>showPanel(G.outpostPanel))}]};
    showPanel(G.outpostPanel);return;}
  state='play';hidePanel();
  if(!mode){SFX.arrive();const svc=o.npcs.filter(n=>['publican','mechanic','doctor'].includes(n.role)).map(n=>ROLE_LABEL[n.role]);
    showMsg(o.name+(o.faction==='fuelkings'?' (Fuel Kings)':'')+(townHostile(o)?'. The guards draw their guns!':G.leg?'. Next stop: '+LOCS[G.leg.to].name:G.dest===null&&G.lastNode===o.id&&fresh?' (new)':''),2.8);
    if(!G.flags.tip_services){G.flags.tip_services=true;setTimeout(()=>showMsg('Find the mechanic for fuel, the publican for food and a bunk',4),3000);}}
}
function departPanel(stay){state='play';hidePanel();if(!stay&&G.leg)showMsg('Road to '+LOCS[G.leg.to].name,2.6);}
function togglePause(){
  if(state==='play'){state='paused';SFX.engine(0,0,false,false);endStick();
    const pp=()=>showPanel({title:'Paused',sub:'The engine ticks as it cools.',buttons:[{label:'Resume',primary:true,fn:()=>togglePause()},
      {label:'Save to a file',fn:()=>savePanel(pp)},{label:'Load a save file',fn:()=>loadPanel(pp)},
      {label:'Open the map',fn:()=>openMap()},{label:'Settings',fn:()=>settingsPanel(pp)}],controls:true});pp();}
  else if(state==='paused'){state='play';hidePanel();}
}
function gameOver(){
  state='over';SFX.engine(0,0,false,false);endStick();
  const o=LOCS[G.atOutpost];
  showPanel({title:'You died',sub:'The wasteland keeps what it takes. Your boots, your jerrycans, your car.',
    stats:'Driven <b>'+km(G.dist*M).toFixed(1)+' km</b><br>Raiders wiped out <b>'+G.wiped+'</b>',
    buttons:[{label:'Load a save file',primary:true,fn:()=>loadPanel(gameOver)},{label:'Start a new run',fn:()=>{newGame();arrive(LOCS[START],'intro');}}]});
}
function win(){
  state='over';
  showPanel({title:'Haven',sub:'Green water behind a wall of buses. Someone opens the gate. You made it.',
    stats:'Driven <b>'+km(G.dist*M).toFixed(1)+' km</b><br>Raiders wiped out <b>'+G.wiped+'</b><br>Time on the road <b>'+Math.floor(G.time/60)+' min</b><br>Places seen <b>'+G.visited.size+'</b>',
    buttons:[{label:'Start a new run',primary:true,fn:()=>{newGame();arrive(LOCS[START],'intro');}}]});
}

// ---- world map: drag to pan, pinch or buttons to zoom, tap a place to plan a route ----
const mapView={cx:0,cy:0,sc:0.002};let mapSel=null;
function mapMinSc(){return Math.min(W/(WX*2.1),H/(WY*2.1));}
function openMap(){if(state!=='play'&&state!=='outpost'&&state!=='paused')return;
  prevState=state;state='map';endStick();SFX.engine(0,0,false,false);mapPtrs.clear();
  $('screen').classList.remove('show');$('hud').classList.add('hidden');$('ctx').innerHTML='';ctxKey='';$('mapUi').classList.remove('hidden');
  const b=body();mapView.cx=b.x;mapView.cy=b.y;mapView.sc=Math.max(mapMinSc(),Math.min(W,H)/450000);
  mapSel=G.dest;mapMarker=null;mapDrop=null;document.body.classList.add('mapopen');updateMapInfo();}
function closeMap(){if(state!=='map')return;markerClose();document.body.classList.remove('mapopen');state=prevState;$('mapUi').classList.add('hidden');
  if(state==='play')hidePanel();else if(panelCfg)showPanel(panelCfg);}
function mapZoom(f,px,py){px=px===undefined?W/2:px;py=py===undefined?H/2:py;
  const wx=mapView.cx+(px-W/2)/mapView.sc,wy=mapView.cy+(py-H/2)/mapView.sc;
  mapView.sc=clamp(mapView.sc*f,mapMinSc(),W/25000);
  mapView.cx=wx-(px-W/2)/mapView.sc;mapView.cy=wy-(py-H/2)/mapView.sc;}
function mapGestureStart(e){const pts=[...mapPtrs.values()];
  mapGesture={pts:pts.map(p=>({...p})),cx:mapView.cx,cy:mapView.cy,sc:mapView.sc,t:performance.now(),moved:0,start:{x:e.clientX,y:e.clientY}};}
function mapGestureMove(){if(!mapGesture)return;const pts=[...mapPtrs.values()],g=mapGesture;
  if(pts.length===1&&g.pts.length===1){const dx=pts[0].x-g.pts[0].x,dy=pts[0].y-g.pts[0].y;g.moved=Math.max(g.moved,Math.hypot(dx,dy));
    mapView.cx=g.cx-dx/g.sc;mapView.cy=g.cy-dy/g.sc;}
  else if(pts.length>=2&&g.pts.length>=2){const d0=Math.hypot(g.pts[0].x-g.pts[1].x,g.pts[0].y-g.pts[1].y),d1=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
    const mx0=(g.pts[0].x+g.pts[1].x)/2,my0=(g.pts[0].y+g.pts[1].y)/2,mx=(pts[0].x+pts[1].x)/2,my=(pts[0].y+pts[1].y)/2;
    const wx=g.cx+(mx0-W/2)/g.sc,wy=g.cy+(my0-H/2)/g.sc;mapView.sc=clamp(g.sc*d1/Math.max(1,d0),mapMinSc(),W/25000);
    mapView.cx=wx-(mx-W/2)/mapView.sc;mapView.cy=wy-(my-H/2)/mapView.sc;g.moved=99;}
  else mapGestureStart({clientX:pts[0].x,clientY:pts[0].y});}
function mapGestureEnd(e){const g=mapGesture;
  if(g&&g.pts.length===1&&mapPtrs.size===1&&g.moved<10&&performance.now()-g.t<500)mapTap(e.clientX,e.clientY);
  mapPtrs.delete(e.pointerId);mapGesture=null;
  if(mapPtrs.size){const p=[...mapPtrs.values()][0];mapGestureStart({clientX:p.x,clientY:p.y});}}
function mapToScreen(x,y){return [W/2+(x-mapView.cx)*mapView.sc,H/2+(y-mapView.cy)*mapView.sc];}
let mapMarker=null,mapDrop=null;
function mapTap(px,py){mapSel=null;mapMarker=null;mapDrop=null;
  let bm=null,bdm=26;for(const m of G.markers){const [sx,sy]=mapToScreen(m.x,m.y),d=Math.hypot(sx-px,sy-py-10);if(d<bdm){bdm=d;bm=m.id;}}
  if(bm!==null){mapMarker=bm;return updateMapInfo();}
  let best=null,bd=30;for(const l of LOCS){if(!G.known.has(l.id))continue;const [sx,sy]=mapToScreen(l.x,l.y),d=Math.hypot(sx-px,sy-py);if(d<bd){bd=d;best=l.id;}}
  if(best!==null){mapSel=best;return updateMapInfo();}
  mapDrop={x:mapView.cx+(px-W/2)/mapView.sc,y:mapView.cy+(py-H/2)/mapView.sc};updateMapInfo();}
function updateMapInfo(){const box=$('mapInfo'),extra=$('miBtns'),go=$('miGo');extra.innerHTML='';
  const away=(x,y)=>{const b=body();return km(Math.hypot(x-b.x,y-b.y)).toFixed(1)+' km from you in a straight line';};
  if(mapMarker!==null){const m=G.markers.find(q=>q.id===mapMarker);if(!m){mapMarker=null;return updateMapInfo();}box.classList.remove('hidden');go.classList.add('hidden');
    $('miName').textContent=m.text;$('miDesc').textContent='Your marker. '+away(m.x,m.y)+'.'+(G.waypoint===m.id?' You’re being guided here.':'');
    extra.innerHTML=(G.waypoint===m.id?'<button data-a="unguide">Stop guiding</button>':'<button data-a="guide" class="go">Guide me here</button>')+'<button data-a="rename">Rename</button><button data-a="remove">Remove</button>';return;}
  if(mapDrop){box.classList.remove('hidden');go.classList.add('hidden');const lv=landValue(mapDrop.x,mapDrop.y);
    $('miName').textContent=lv<0?'Open water':zoneAt(mapDrop.x,mapDrop.y).name;$('miDesc').textContent=away(mapDrop.x,mapDrop.y)+'.';
    extra.innerHTML='<button data-a="drop" class="go">Drop a marker here</button>';return;}
  if(mapSel===null){box.classList.add('hidden');return;}
  const l=LOCS[mapSel];box.classList.remove('hidden');$('miName').textContent=l.name+(l.goal?' (Haven)':'');
  const p=routePath(G.lastNode,mapSel);let route;
  if(mapSel===G.lastNode)route='You are here.';
  else if(!p)route='No road leads there. You would have to cross open country.';
  else route=km(p.len).toFixed(0)+' km by road, '+p.legs.length+(p.legs.length===1?' stretch':' stretches')+', roughly '+Math.round(km(p.len)/140*60)+' minutes of driving.';
  $('miDesc').textContent=(l.camp&&!G.flags['camp_'+l.id]?'Raider camp, ruins':TYPE_LABEL[l.type])+' in '+zoneAt(l.x,l.y).name+'. '+(l.faction==='fuelkings'?'Held by the Fuel Kings. ':'')+(G.visited.has(l.id)?'Visited. ':'Not visited yet. ')+route;
  go.classList.toggle('hidden',!p||mapSel===G.lastNode);go.textContent=G.dest===mapSel?'Destination set':'Set destination';}

// ---- HUD ----
let hudCache={},ctxKey='';
function setHud(id,prop,val){if(hudCache[id+prop]===val)return;hudCache[id+prop]=val;const el=$(id);
  if(prop==='text')el.textContent=val;else if(prop==='w')el.style.width=val;else if(prop==='low')el.classList.toggle('low',val);
  else if(prop==='hide')el.classList.toggle('hidden',val);else if(prop==='nocar')el.classList.toggle('nocar',val);}
function focusCar(){return heroCar()||nearestCar(140);}
function updateHud(){const h=G.hero,car=heroCar(),fc=focusCar();
  setHud('hpBar','w',Math.max(0,h.hp).toFixed(0)+'%');setHud('hpBar','low',h.hp<30);
  for(const k of ['water','food','rest']){setHud(k+'Bar','w',Math.max(0,h[k]).toFixed(0)+'%');setHud(k+'Bar','low',h[k]<25);}
  setHud('clock','text',fmtClock(G.clock));
  setHud('gauges','nocar',!fc);
  if(fc){setHud('fuelBar','w',Math.max(0,fc.fuel).toFixed(0)+'%');setHud('fuelBar','low',fc.fuel<20);
    setHud('condBar','w',Math.max(0,fc.cond).toFixed(0)+'%');setHud('condBar','low',fc.cond<30);
    setHud('carName','text',(car?'Driving the ':'Nearby: ')+fc.def.name);
    setHud('carWarn','text',carProblems(fc).join(', '));}
  setHud('inv','text','Carrying '+invWeight(h.inv)+' of '+HERO_CAP+' kg'+(h.inv.jerrycan?', jerry cans '+Math.round(canFill(h.inv))+'% of '+h.inv.jerrycan*CAN_CAP+'%':''));
  // fighting on foot: make the Attack button big and easy to hit
  const fighting=!car&&(G.fightT>0||G.foes.some(f=>!f.dead&&f.state==='alert'&&Math.hypot(f.x-h.x,f.y-h.y)<450));
  if(fighting!==hudCache.combat){hudCache.combat=fighting;document.body.classList.toggle('combat',fighting);}
  const Wg=heroWeapon(),gunReady=!!car&&!!Wg.gun&&(h.inv[Wg.ammo]||0)>0;   // a gun and ammo: show Shoot while driving
  if(gunReady!==hudCache.gun){hudCache.gun=gunReady;document.body.classList.toggle('gunready',gunReady);}
  const cp=G.comp;setHud('compLine','text',cp?cp.def.name+' the '+cp.C.title+': '+(cp.state==='down'?'DOWN, '+Math.ceil(cp.downT)+' s to help them':Math.round(cp.hp)+'%, '+(cp.inCar?'riding with you':cp.state==='wait'?'waiting':'following')):'');
  const W=heroWeapon();setHud('weap','text',(h.crouch&&!car?'Sneaking. ':'')+W.name+(W.gun?', '+(h.inv[W.ammo]||0)+' '+ITEMS[W.ammo].name.toLowerCase():''));
  setHud('spd','text',car?String(Math.round(car.speed*3.6/M)):'');setHud('spdUnit','text',car?'km/h':'On foot');
  setHud('wiped','text',G.wiped+(G.wiped===1?' raider wiped out':' raiders wiped out'));
  const wp=G.waypoint!=null?G.markers.find(m=>m.id===G.waypoint):null;
  setHud('legBox','hide',!G.leg&&!wp);
  if(!G.leg&&wp){const b=body();setHud('dest','text',wp.text);setHud('destKm','text',km(Math.hypot(wp.x-b.x,wp.y-b.y)).toFixed(1)+' km away, follow the arrow');}
  if(G.leg){const fin=G.dest!==null&&G.dest!==G.leg.to?' (on the way to '+LOCS[G.dest].name+')':'';
    setHud('dest','text',LOCS[G.leg.to].name);
    setHud('destKm','text',(G.onLeg?legRemaining().toFixed(1)+' km of road left':'Off the road, follow the arrow')+fin);}
}
function legRemaining(){const L=G.leg,R=roads[L.road],ri=body().ri;
  const at=ri.r===L.road?R.cum[ri.i]+ri.t*(R.cum[ri.i+1]-R.cum[ri.i]):(L.dir>0?0:R.len);
  return km(L.dir>0?R.len-at:at);}
function updateCtx(){
  const acts=state==='play'?getActions():[],key=acts.map(a=>a.k+a.label).join('|');if(key===ctxKey)return;ctxKey=key;
  const box=$('ctx');box.innerHTML='';const hint=!document.body.classList.contains('touch');
  acts.forEach(a=>{const el=document.createElement('button');el.className='cbtn'+(a.alt?' alt':'');
    el.innerHTML=a.label+(hint?'<kbd>'+a.k+'</kbd>':'');
    el.dataset.k=a.k;el.addEventListener('pointerdown',ev=>{if(ev.pointerType==='touch'&&HAS_TOUCH)return;ev.preventDefault();ev.stopPropagation();runAction(a.k);});
    box.appendChild(el);});
}

// ---- clock and sleep ----
function fmtClock(m){const d=Math.floor(m/DAY)+1,t=m%DAY,hh=Math.floor(t/60),mm=Math.floor(t%60);return 'Day '+d+', '+String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
function sleepUntilMorning(){const t=G.clock%DAY;let add=(6*60-t+DAY)%DAY;if(add<4*60)add+=DAY;  // at least a few hours
  add=Math.min(add,12*60);G.clock+=add;const h=G.hero;h.rest=100;showMsg('You wake at '+fmtClock(G.clock).split(', ')[1],2);}
function sleepPanel(car){
  const h=G.hero,need=Math.ceil((100-h.rest)/13),onRoad=car.onRoad&&!nearService(car.x,car.y);
  state='paused';endStick();SFX.engine(0,0,false,false);
  showPanel({title:'Sleep in the car',sub:'It’s '+fmtClock(G.clock).split(', ')[1]+'. Raiders patrol the roads at all hours. '+(onRoad?'You’re parked on the road, which is risky. Pull well off it to sleep safer.':'You’re off the road, out of sight of most patrols.'),
    buttons:[{label:'Sleep until rested (about '+need+(need===1?' hour)':' hours)'),primary:true,fn:()=>doSleep(need,car)},
      {label:'Nap for 2 hours',fn:()=>doSleep(2,car)},{label:'Stay awake',fn:()=>{state='play';hidePanel();}}]});
}
// sleeping passes the hours one at a time; each hour carries a chance of being found
function doSleep(hours,car){const h=G.hero,risk=car.onRoad?0.07:0.02;let slept=0,ambush=false;
  for(let i=0;i<hours;i++){G.clock+=60;slept++;h.rest=Math.min(100,h.rest+13);h.water=Math.max(0,h.water-3);h.food=Math.max(0,h.food-1.5);
    if(h.water<=0)h.hp-=8;if(h.food<=0)h.hp-=3;if(Math.random()<risk){ambush=true;break;}}
  state='play';hidePanel();
  if(ambush){for(let k=0;k<2;k++){const a=Math.random()*TAU;G.cars.push(makeRaider('buggy',car.x+Math.cos(a)*700,car.y+Math.sin(a)*700,a+Math.PI,0));}
    G.encActive=true;showMsg('Engines! Raiders found you after '+slept+(slept===1?' hour':' hours'),3);}
  else showMsg('You slept '+slept+(slept===1?' hour':' hours')+'. '+fmtClock(G.clock).split(', ')[1],2.4);
}
// ---- gear (inventory) screen ----
let invOther=null;
function openInv(other){if(state!=='play')return;
  const car=heroCar();invOther=other||(car?{kind:'car',car}:null);
  if(invOther&&invOther.kind==='box'){const bx=invOther.box;boxItems(bx);
    // Mick has an eye for things other people miss
    if(G.comp&&G.comp.type==='scrounger'&&!G.comp.inCar&&!bx.scrounged){bx.scrounged=true;const extra=genLoot(bx.table||'ruin',(Math.random()*1e9)|0,1,bx.biome);
      for(const k in extra)invAdd(bx.items,k,extra[k]);boxChanged(bx);if(Object.keys(extra).length)popText(G.hero.x,G.hero.y-30,G.comp.def.name+' spots something extra','#f2a03d');}}
  state='inv';endStick();SFX.engine(0,0,false,false);$('invPanel').classList.remove('hidden');$('ctx').innerHTML='';ctxKey='';renderInv();}
function closeInv(){if(state!=='inv')return;state='play';$('invPanel').classList.add('hidden');}
function otherInv(){if(!invOther)return null;return invOther.kind==='car'?invOther.car.items:invOther.box.items;}
function otherCap(){return invOther&&invOther.kind==='car'?carCap(invOther.car):undefined;}
function otherTouched(){if(!invOther)return;if(invOther.kind==='car')invOther.car.touched=true;else boxChanged(invOther.box);}
function otherName(){if(!invOther)return '';if(invOther.kind==='car')return 'Boot of the '+invOther.car.def.name;
  return {crate:'Wooden crate',locker:'Rusted locker',esky:'Old esky',bag:'Raider’s bag'}[invOther.box.kind];}
function invCar(){return heroCar()||(invOther&&invOther.kind==='car'?invOther.car:null);}
function itemRow(k,n,side){const it=ITEMS[k],o=otherInv(),car=invCar();let b='';
  const usable=it.use&&(it.use==='fuel'||it.use==='repair'||it.use==='upgrade'?!!car:true);
  if(usable)b+='<button data-a="use" data-k="'+k+'" data-s="'+side+'">'+(it.use==='drink'?'Drink':it.use==='eat'?'Eat':it.use==='heal'?'Use':it.use==='fuel'?'Pour in':'Fit')+'</button>';
  if(side==='me'&&it.weapon)b+=G.hero.weapon===k?'<button data-a="unequip" data-k="'+k+'">Equipped</button>':'<button data-a="equip" data-k="'+k+'">Equip</button>';
  if(side==='me'&&o)b+='<button data-a="put" data-k="'+k+'">Store</button>';
  if(side==='me'&&!heroCar())b+='<button data-a="drop" data-k="'+k+'">Drop</button>';
  if(side==='other'){b+='<button data-a="take" data-k="'+k+'">Take</button>';if(n>1)b+='<button data-a="takeall" data-k="'+k+'">All</button>';}
  return '<div class="irow"><i style="background:'+it.icon+'"></i><span class="nm">'+it.name+(n>1?' ×'+n:'')+'<small>'+(Math.round(it.kg*n*10)/10)+' kg</small></span>'+b+'</div>';}
function renderInv(){const h=G.hero,o=otherInv(),car=invCar();let html='';
  html+='<div class="stats">Health '+Math.round(h.hp)+'%, water '+Math.round(h.water)+'%, food '+Math.round(h.food)+'%, rest '+Math.round(h.rest)+'%. '+fmtClock(G.clock)+'.</div>';
  html+='<h3>Standing</h3><div class="stats">'+Object.keys(FACTIONS).map(f=>FACTIONS[f].name+': '+repTier(rep(f)).toLowerCase()+' ('+(rep(f)>0?'+':'')+Math.round(rep(f))+')').join(', ')+'.</div>';
  if(G.comp){const p=G.comp;html+='<div class="stats">'+p.def.name+' the '+p.C.title+': '+(p.state==='down'?'down!':Math.round(p.hp)+'% health, '+(p.inCar?'riding with you':p.state==='wait'?'waiting':'following'))+(p.type==='gunhand'?', '+p.ammo+' rounds':'')+'.</div>';}
  html+='<h3>You carry<small>'+invWeight(h.inv)+' of '+HERO_CAP+' kg</small></h3>';
  const mine=Object.keys(h.inv);html+=mine.length?mine.map(k=>itemRow(k,h.inv[k],'me')).join(''):'<div class="empty">Nothing but the clothes on your back.</div>';
  if(o){const cap=otherCap();html+='<h3>'+otherName()+'<small>'+(cap!==undefined?invWeight(o)+' of '+cap+' kg':'')+'</small></h3>';
    const ks=Object.keys(o);html+=ks.length?ks.map(k=>itemRow(k,o[k],'other')).join('')+'<div class="irow"><span class="nm"></span><button class="go" data-a="takeevery">Take everything that fits</button></div>':'<div class="empty">Empty.</div>';}
  if(car){html+='<h3>'+car.def.name+'<small>fuel '+Math.round(car.fuel)+'%'+(hasTool(car)?', toolkit to hand':', no toolkit')+'</small></h3>';
    const probs=carProblems(car);if(probs.length)html+='<div class="stats" style="color:#ffb38a">'+probs.join('. ')+'.</div>';
    html+='<div class="stats">Tyres: '+car.tw.map((t,i)=>TYRE_NAMES[i]+' '+(t<=0?'flat':Math.round(t)+'%')).join(', ')+'.</div>';
    const ups=Object.keys(car.ups||{});html+='<div class="stats">Upgrades: '+(ups.length?ups.map(u=>UPGRADES[u].name).join(', '):'none fitted')+'.</div>';
    for(const p of ['cond','engine','tyres','susp']){const v=Math.round(car[p]);
      html+='<div class="part"><span class="pn">'+PARTS[p]+'</span><span class="pb"><b class="'+(v<35?'low':'')+'" style="width:'+v+'%"></b></span><span>'+v+'%</span></div>';}}
  // crafting
  const bench=atWorkbench(),st=myStores();
  html+='<h3>Make things<small>'+(bench?'at the workbench in this '+bench.kind:'workbench recipes need a garage, shed, servo or store')+'</small></h3>';
  RECIPES.forEach((r,i)=>{const need=Object.keys(r.needs).map(k=>{const have=countIn(st,k),ok=have>=r.needs[k];return '<span style="color:'+(ok?'#b9d27a':'#ff9a7a')+'">'+ITEMS[k].name.toLowerCase()+' '+have+'/'+r.needs[k]+'</span>';}).join(', ');
    const can=canCraft(r);html+='<div class="irow"><i style="background:'+ITEMS[r.make].icon+'"></i><span class="nm">'+ITEMS[r.make].name+(r.qty>1?' ×'+r.qty:'')+(r.bench?' <small>(workbench)</small>':'')+'<br><small>'+need+'</small></span><button data-a="craft" data-k="'+i+'"'+(can?'':' disabled')+'>Make</button></div>';});
  $('invBody').innerHTML=html;}
function invClick(e){const btn=e.target.closest&&e.target.closest('button');if(!btn)return;e.stopPropagation();
  const a=btn.dataset.a,k=btn.dataset.k,h=G.hero,o=otherInv(),car=invCar();
  if(a==='use'){const inv=btn.dataset.s==='me'?h.inv:o;if(useItem(k,inv,car)&&btn.dataset.s!=='me')otherTouched();}
  else if(a==='craft'){const r=RECIPES[+k];if(r&&craft(r))showMsg('Made '+ITEMS[r.make].name.toLowerCase()+(r.qty>1?' ×'+r.qty:''),1.4);}
  else if(a==='equip'){h.weapon=k;SFX.click();}else if(a==='unequip'){h.weapon=null;}
  else if(a==='put'){if(!invMove(h.inv,o,k,1,otherCap()))say('No room left');else otherTouched();}
  else if(a==='drop'){const before=canFill(h.inv);if(invTake(h.inv,k,1)){addPickup(k,h.x+rand(-25,25),h.y+rand(-25,25));trimFill(h.inv);if(canFill(h.inv)<before-0.5)showMsg('The fuel in it soaks into the dirt',1.6);}}
  else if(a==='take'||a==='takeall'){if(!invMove(o,h.inv,k,a==='take'?1:999,HERO_CAP))say('Too heavy to carry');else otherTouched();}
  else if(a==='takeevery'){let moved=0;for(const kk of Object.keys(o).sort((x,y)=>ITEMS[x].kg-ITEMS[y].kg))moved+=invMove(o,h.inv,kk,999,HERO_CAP);
    if(moved)otherTouched();if(invCount(o))say('You can’t carry the rest');}
  renderInv();}

// ---- test range tools ----
function toolsPanel(){if(state!=='play')return;state='paused';endStick();SFX.engine(0,0,false,false);
  const h=G.hero,b=()=>body(),near=()=>heroCar()||nearestCar(400),done=t=>{state='play';hidePanel();if(t)showMsg(t,1.8);};
  showPanel({title:'Tools',sub:fmtClock(G.clock)+'. God mode is '+(G.god?'on':'off')+'.',buttons:[
    {label:'Spawn raider cars behind me',primary:true,fn:()=>{if(!heroCar())return done('Get in a car first');G.encT=999;spawnEncounter();done();}},
    {label:'Spawn a raider car with a shooter',fn:()=>{if(!heroCar())return done('Get in a car first');spawnEncounter();for(const c of G.cars)if(c.driver==='raider')c.gunner=true;done();}},
    {label:'Spawn a raider on foot nearby',fn:()=>{const a=h.a+Math.PI*0.7;spawnLooseFoe(b().x+Math.cos(a)*260,b().y+Math.sin(a)*260,true).stun=0;done();}},
    {label:'Spawn wildlife: one of each, and a mob of roos',fn:()=>{const p=b(),put=(sp,ang,d,ex)=>{for(let k=0;k<10;k++){const x=p.x+Math.cos(ang+k*0.3)*d,y=p.y+Math.sin(ang+k*0.3)*d;if(!blockedAt(x,y)&&!obstacleAt(x,y,16))return spawnAnimal(sp,x,y,ex);}};
      put('snake',0,260);put('rabbit',1.6,320);put('dingo',3.2,420);const mob={};for(let i=0;i<4;i++)put('roo',4.7+i*0.12,380+i*25,{mob});done('Snake east, rabbit south, dingo west, roos to the north');}},
    {label:'Reset the raider camp and the quest',fn:()=>{const c=LOCS[2];for(const f of c.foes||[])G.removed.delete(f.id);delete G.flags['camp_'+c.id];delete G.flags.q_col;G.foes=G.foes.filter(f=>f.loc!==c);syncFoes();done('Camp and quest reset');}},
    {label:'Jump to noon',fn:()=>{G.clock=Math.floor(G.clock/DAY)*DAY+12*60;done('12:00');}},
    {label:'Jump to midnight',fn:()=>{G.clock=Math.floor(G.clock/DAY)*DAY+24*60;done('00:00');}},
    {label:'Refill health, water, food and rest',fn:()=>{h.hp=h.water=h.food=h.rest=100;done('All needs full');}},
    {label:'Drain needs to 15%',fn:()=>{h.water=h.food=h.rest=15;done('Thirsty, hungry, exhausted');}},
    {label:'Repair and refuel the nearest car',fn:()=>{const c=near();if(!c)return done('No car nearby');Object.assign(c,{fuel:100,cond:100,engine:100,tyres:100,susp:100});done(c.def.name+' fixed');}},
    {label:'Damage the nearest car (every part to 20%)',fn:()=>{const c=near();if(!c)return done('No car nearby');Object.assign(c,{fuel:20,cond:20,engine:20,tyres:20,susp:20});done(c.def.name+' battered');}},
    {label:'God mode: '+(G.god?'turn off':'turn on'),fn:()=>{G.god=!G.god;done('God mode '+(G.god?'on':'off'));}},
    {label:'Teleport…',fn:()=>teleportPanel()},
    {label:'Back',fn:()=>done()}]});}
function teleportPanel(){const go=(x,y,t)=>{const c=heroCar(),bb=c||G.hero;bb.x=x;bb.y=y;bb.vx=bb.vy=0;G.cam.x=x;G.cam.y=y;G.inside=-1;chunks.clear();syncCars();state='play';hidePanel();showMsg(t,1.8);};
  const yard=LOCS[0].carSpawns[0],L=i=>LOCS[i];
  showPanel({title:'Teleport',sub:'Your car comes with you if you are in one.',buttons:[
    {label:'Test Town square',primary:true,fn:()=>go(L(0).x+40,L(0).y+40,'Test Town')},
    {label:'Car yard and supply crates',fn:()=>go(yard.x,yard.y+60,'Car yard')},
    {label:'Test Ruins',fn:()=>go(L(1).x+500,L(1).y,'Test Ruins')},
    {label:'Just outside the raider camp',fn:()=>go(L(2).x-700,L(2).y,'Raider camp ahead')},
    {label:'Haven (test), to try the ending',fn:()=>go(L(3).x+900,L(3).y,'Haven is just west')},
    {label:'The hidden stash',fn:()=>go(3850,-700,'Stash nearby')},
    {label:'The shoreline',fn:()=>go(4700,0,'The sea')},
    {label:'Back',fn:()=>{state='play';toolsPanel();}}]});}

function carProblems(c){const out=[],fl=flats(c);
  if(c.engine<=0)out.push('Engine dead');else if(c.engine<35)out.push('Engine '+Math.round(c.engine)+'%');
  if(c.cond<=0)out.push('Too battered to run');else if(c.cond<30)out.push('Body '+Math.round(c.cond)+'%');
  if(fl)out.push(fl===1?'1 tyre flat':fl+' tyres flat');else if(c.tyres<35)out.push('Tyres '+Math.round(c.tyres)+'%');
  if(c.susp<=0)out.push('Suspension broken');else if(c.susp<35)out.push('Suspension '+Math.round(c.susp)+'%');
  return out;}

// ---- trading: goods for goods, with services sold like goods ----
let trade=null;
function serviceCar(n){let car=null,cd=700;for(const c of G.cars){if(c.wrecked||c.driver==='raider'||!c.touched)continue;const d=Math.hypot(c.x-n.x,c.y-n.y);if(d<cd){cd=d;car=c;}}return car;}
function openTrade(n){if(state!=='play'&&state!=='talk')return;trade={n,offer:{},want:{},svc:{}};state='trade';endStick();SFX.engine(0,0,false,false);
  $('tradePanel').classList.remove('hidden');$('ctx').innerHTML='';ctxKey='';renderTrade();}
function closeTrade(){if(state!=='trade')return;state='play';trade=null;$('tradePanel').classList.add('hidden');}
function tradeTotals(){const o=trade.n.loc,stock=traderStock(trade.n),svcs=servicesFor(trade.n,serviceCar(trade.n));let give=0,get=0;
  for(const k in trade.offer)give+=sellPrice(o,k)*trade.offer[k];for(const k in trade.want)get+=buyPrice(o,k)*trade.want[k];
  for(const k in trade.svc){const s=svcs.find(x=>x.k===k);if(s)get+=buyPrice(o,k,s.val);}return {give,get,stock,svcs};}
function myGoods(){const st=myStores(trade.n.x,trade.n.y),all={};for(const inv of st)for(const k in inv)all[k]=(all[k]||0)+inv[k];return all;}
function renderTrade(){const n=trade.n,o=n.loc,pm=priceMods(o),T=tradeTotals(),mine=myGoods();let html='';
  const who=n.def.name+', '+(ROLE_LABEL[n.def.role]||n.def.role);
  html+='<div class="stats">'+who+'. '+(o.faction?'The '+FACTIONS[o.faction].name+' see you as '+pm.tier.toLowerCase()+': they charge '+Math.round(pm.buy*100)+'% and pay '+Math.round(pm.sell*100)+'% of value.':'')+'</div>';
  const lines=[];for(const k in trade.want)lines.push('<button data-a="unwant" data-k="'+k+'">− '+ITEMS[k].name+' ×'+trade.want[k]+'</button>');
  for(const k in trade.svc){const s=T.svcs.find(x=>x.k===k);if(s)lines.push('<button data-a="unsvc" data-k="'+k+'">− '+s.name+'</button>');}
  const olines=[];for(const k in trade.offer)olines.push('<button data-a="unoffer" data-k="'+k+'">− '+ITEMS[k].name+' ×'+trade.offer[k]+'</button>');
  const ok=T.get>0&&T.give>=T.get;
  html+='<div class="basket"><div class="tot"><span>You get: <b>'+T.get+'</b></span><span>You give: <b>'+T.give+'</b></span></div>'+
    (lines.length?'<div class="lines">'+lines.join('')+'</div>':'')+(olines.length?'<div class="lines">'+olines.join('')+'</div>':'')+
    '<div class="irow"><span class="nm">'+(T.get===0?'Tap what you want, then offer goods to cover it.':ok?(T.give>T.get?'They’ll take it. You’re overpaying by '+(T.give-T.get)+'.':'A fair swap.'):'Offer '+(T.get-T.give)+' more in value.')+'</span>'+
    '<button data-a="clear">Clear</button><button class="go" data-a="deal"'+(ok?'':' disabled')+'>Deal</button></div></div>';
  html+='<h3>They have</h3>';
  for(const s of T.svcs){const inB=!!trade.svc[s.k];html+='<div class="irow"><i style="background:#f2a03d"></i><span class="nm">'+s.name+'</span><span class="price">'+buyPrice(o,s.k,s.val)+'</span><button data-a="svc" data-k="'+s.k+'"'+(inB?' disabled':'')+'>'+(inB?'Added':'Want')+'</button></div>';}
  const sk=Object.keys(T.stock).filter(k=>T.stock[k]-(trade.want[k]||0)>0);
  if(!sk.length&&!T.svcs.length)html+='<div class="empty">Cleaned out for today.</div>';
  for(const k of sk){const left=T.stock[k]-(trade.want[k]||0);html+='<div class="irow"><i style="background:'+ITEMS[k].icon+'"></i><span class="nm">'+ITEMS[k].name+(left>1?' ×'+left:'')+'</span><span class="price">'+buyPrice(o,k)+'</span><button data-a="want" data-k="'+k+'">Want</button></div>';}
  html+='<h3>You have<small>your pockets and your car’s boot</small></h3>';
  const mk=Object.keys(mine).filter(k=>mine[k]-(trade.offer[k]||0)>0&&VALUE[k]);
  if(!mk.length)html+='<div class="empty">Nothing left to offer.</div>';
  for(const k of mk){const left=mine[k]-(trade.offer[k]||0);html+='<div class="irow"><i style="background:'+ITEMS[k].icon+'"></i><span class="nm">'+ITEMS[k].name+(left>1?' ×'+left:'')+'</span><span class="price">'+sellPrice(o,k)+'</span><button data-a="offer" data-k="'+k+'">Offer</button></div>';}
  $('tradeBody').innerHTML=html;}
function tradeClick(e){const btn=e.target.closest&&e.target.closest('button');if(!btn||btn.disabled)return;e.stopPropagation();const a=btn.dataset.a,k=btn.dataset.k;
  if(a==='want')trade.want[k]=(trade.want[k]||0)+1;else if(a==='unwant'){if(!--trade.want[k])delete trade.want[k];}
  else if(a==='offer')trade.offer[k]=(trade.offer[k]||0)+1;else if(a==='unoffer'){if(!--trade.offer[k])delete trade.offer[k];}
  else if(a==='svc')trade.svc[k]=true;else if(a==='unsvc')delete trade.svc[k];
  else if(a==='clear'){trade.offer={};trade.want={};trade.svc={};}
  else if(a==='deal')doDeal();
  if(trade)renderTrade();}
function doDeal(){const T=tradeTotals();if(!(T.get>0&&T.give>=T.get))return false;const n=trade.n,car=serviceCar(n),st=myStores(n.x,n.y),h=G.hero;
  for(const k in trade.offer){takeFrom(st,k,trade.offer[k]);if(h.weapon===k&&!h.inv[k])h.weapon=null;}for(const inv of st)trimFill(inv);
  for(const k in trade.want){T.stock[k]-=trade.want[k];if(T.stock[k]<=0)delete T.stock[k];giveItem(k,trade.want[k]);}
  const bunk=!!trade.svc.svc_bunk;for(const k in trade.svc)if(k!=='svc_bunk')applyService(k,car);
  SFX.pick();trade.offer={};trade.want={};trade.svc={};
  if(bunk){closeTrade();sleepUntilMorning();h.hp=100;h.water=Math.max(h.water,70);h.food=Math.max(h.food,60);}else showMsg('Deal',1);
  return true;}

// ---- save and load: files only ----
function canSaveNow(){if(G.cars.some(c=>c.driver==='raider'))return 'You can’t save with raider cars on your tail';
  const b=body();if(G.foes.some(f=>!f.dead&&f.state==='alert'&&Math.hypot(f.x-b.x,f.y-b.y)<900))return 'You can’t save in the middle of a fight';
  if(G.animals.some(a=>a.state==='chase'||a.state==='attack'))return 'You can’t save with an animal going for you';return null;}
function savePanel(back){downloadSave(back);}
function loadPanel(back){showPanel({title:'Load a save file',sub:(G&&state!=='title'&&state!=='over'?'Anything you haven’t saved to a file will be lost. ':'')+'Open a save file you downloaded, on this device or another.',
  buttons:[{label:'Open a save file',primary:true,fn:()=>openSaveFile(back)},{label:'Paste a save',fn:()=>openPaste(back)},{label:'Back',fn:back}]});}
// pick up exactly where the save was made
function resumeSave(d){newGame(d);state='play';hidePanel();endStick();showMsg((d.meta&&d.meta.where)||LOCS[d.at].name,2.4);}

// ---- map markers ----
let mdMode=null;
function markerDialog(mode,text){mdMode=mode;$('mdTitle').textContent=mode==='new'?'Name this marker':'Rename marker';const t=$('mdText');t.value=text||'';
  $('markerDlg').classList.remove('hidden');try{t.focus();t.select();}catch(e){}}
function markerClose(){$('markerDlg').classList.add('hidden');mdMode=null;try{$('mdText').blur();}catch(e){}}
function markerSave(){if(!mdMode)return;const text=($('mdText').value||'').trim().slice(0,40)||'Marker '+G.markerSeq;
  if(mdMode==='new'&&mapDrop){const m={id:G.markerSeq++,x:Math.round(mapDrop.x),y:Math.round(mapDrop.y),text};G.markers.push(m);mapDrop=null;mapMarker=m.id;}
  else if(mdMode==='rename'){const m=G.markers.find(q=>q.id===mapMarker);if(m)m.text=text;}
  markerClose();updateMapInfo();}
function markerAction(a){const m=G.markers.find(q=>q.id===mapMarker);
  if(a==='drop')return markerDialog('new','');
  if(!m)return;if(a==='guide')G.waypoint=m.id;else if(a==='unguide')G.waypoint=null;else if(a==='rename')return markerDialog('rename',m.text);
  else if(a==='remove'){G.markers=G.markers.filter(q=>q.id!==m.id);if(G.waypoint===m.id)G.waypoint=null;mapMarker=null;}
  updateMapInfo();}
// ---- siphoning and stripping ----
function nightWarning(){return darkness()>0.3?' It’s dark: raiders sometimes spot people working on cars at night.':'';}
function siphonPanel(t){const h=G.hero,inv=h.inv,src=t.src;state='paused';endStick();SFX.engine(0,0,false,false);const back=()=>{state='play';hidePanel();};
  if(!inv.hose||!inv.jerrycan)return showPanel({title:'Siphon fuel',sub:'You need '+(!inv.hose&&!inv.jerrycan?'a length of hose and an empty jerry can':!inv.hose?'a length of hose':'a jerry can to siphon into')+' in your pockets.',buttons:[{label:'Back',primary:true,fn:back}]});
  const space=canSpace(inv),there=src.fuel||0;
  if(there<0.5)return showPanel({title:'Siphon fuel',sub:'The '+t.name+'’s tank is bone dry.',buttons:[{label:'Back',primary:true,fn:back}]});
  if(space<0.5)return showPanel({title:'Siphon fuel',sub:'Your jerry cans are full. Pour them into a car first.',buttons:[{label:'Back',primary:true,fn:back}]});
  const all=Math.min(there,space),hrs=all/SIPHON_RATE;
  showPanel({title:'Siphon fuel',sub:'About '+Math.round(there)+'% of a tank left in the '+t.name+'. Your cans have room for '+Math.round(space)+'%. Siphoning runs at about '+SIPHON_RATE+'% an hour.'+nightWarning(),
    buttons:[{label:'Siphon '+Math.round(all)+'% (about '+fmtHours(hrs)+')',primary:true,fn:()=>doSiphon(t,hrs+0.01)},
      ...(hrs>1.2?[{label:'Siphon for an hour ('+Math.round(Math.min(all,SIPHON_RATE))+'%)',fn:()=>doSiphon(t,1)}]:[]),{label:'Leave it',fn:back}]});}
function stripPanel(t){const h=G.hero,src=t.src;state='paused';endStick();SFX.engine(0,0,false,false);const back=()=>{state='play';hidePanel();};
  if(!hasTool(heroCar()||carById(G.lastCar)))return showPanel({title:'Strip parts',sub:'You need a toolkit to take anything off the '+t.name+'.',buttons:[{label:'Back',primary:true,fn:back}]});
  const jobs=strippable(src);if(!jobs.length)return showPanel({title:'Strip parts',sub:'The '+t.name+' has been picked clean.',buttons:[{label:'Back',primary:true,fn:back}]});
  const q=it=>it==='scrap'?'only good for scrap':it.endsWith('_used')||it==='tyre_worn'?'worn':'in good nick',total=jobs.reduce((s,j)=>s+j.h,0);
  showPanel({title:'Strip the '+t.name,sub:'Pick what to take. Most of it’s in poor shape.'+nightWarning(),
    buttons:[{label:'Take everything worth having (about '+fmtHours(total)+')',primary:true,fn:()=>doStrip(t,jobs)},
      ...jobs.filter((j,i)=>!j.id.startsWith('scrap')||j.id==='scrap0').map(j=>{const n=j.id==='scrap0'?jobs.filter(x=>x.id.startsWith('scrap')).length:1;
        return {label:(j.id==='scrap0'?(n>1?'Cut '+n+' lots of scrap from the body':'Cut scrap from the body'):'Take '+j.name+' ('+q(j.item)+')')+', '+fmtHours(j.h*n),fn:()=>doStrip(t,j.id==='scrap0'?jobs.filter(x=>x.id.startsWith('scrap')):[j])};}),
      {label:'Leave it',fn:back}]});}

// ---- save files: download a save, and open one on any device ----
function slugify(t){return String(t).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'save';}
function exportSaveText(){const d=saveData();d.meta={real:Date.now(),where:placeLabel(),clock:G.clock,dist:G.dist,slot:'file'};
  return JSON.stringify({game:'last-survivor',world:TEST_MODE?'test':'full',exported:new Date().toISOString(),save:d});}
function saveFileName(){return 'last-survivor-'+slugify(placeLabel())+'-day-'+(Math.floor(G.clock/DAY)+1)+'.json';}
async function downloadSave(back){const why=canSaveNow();if(why)return showPanel({title:'Save game',sub:why+'. Deal with them first.',buttons:[{label:'Back',primary:true,fn:back}]});
  const text=exportSaveText(),name=saveFileName();let how='';
  try{const cl=typeof window!=='undefined'&&window.claude&&window.claude.use?await window.claude.use('downloads'):null;
    if(cl){await cl.save({filename:name,data:text});how='saved';}
    else{const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);how='saved';}}
  catch(e){how=e&&e.code==='declined'?'declined':'failed';}
  if(how==='saved')showPanel({title:'Save file ready',sub:name+' has been handed to your device. On your other device, choose Load game, then Open a save file.',buttons:[{label:'Back',primary:true,fn:back}]});
  else if(how==='declined')showPanel({title:'Not saved',sub:'You cancelled the download.',buttons:[{label:'Back',primary:true,fn:back}]});
  else showPanel({title:'Couldn’t download',sub:'This view won’t save files. Your progress is still safe in the save slots on this device.',buttons:[{label:'Back',primary:true,fn:back}]});}
// check a save file thoroughly before touching the game you have now
function parseSaveText(text){let o;try{o=JSON.parse(String(text).trim());}catch(e){return {err:'That isn’t a save file: it couldn’t be read. Make sure you copied all of it.'};}
  const d=o&&o.game==='last-survivor'?o.save:(o&&o.v===5&&o.hero?o:null);   // also accept a bare save, as stored in a slot
  if(!d)return {err:'That file isn’t a Last Survivor save.'};
  if(o.world&&o.world!==(TEST_MODE?'test':'full'))return {err:o.world==='test'?'That save is from the test range. Open the test range first, then load it.':'That save is from the full game. Leave the test range first, then load it.'};
  if(d.v!==5||!d.hero||typeof d.hero.x!=='number'||!Array.isArray(d.cars)||!LOCS[d.at])return {err:'That save is damaged or from a different version of the game.'};
  return {save:d};}
function importSaveText(text,back){const r=parseSaveText(text);back=back||titleScreen;
  if(r.err){showPanel({title:'Couldn’t load that save',sub:r.err,buttons:[{label:'Back',primary:true,fn:back}]});return false;}
  const before=G?saveData():null;
  try{resumeSave(r.save);return true;}
  catch(e){if(before)try{newGame(before);}catch(_){}showPanel({title:'Couldn’t load that save',sub:'Something in it didn’t make sense to this version of the game. Your current game hasn’t been changed.',buttons:[{label:'Back',primary:true,fn:back}]});return false;}}
let fileBack=null;
function openSaveFile(back){fileBack=back;const inp=$('saveFile');inp.value='';inp.click();}
$('saveFile').addEventListener('change',e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();
  rd.onload=()=>importSaveText(rd.result,fileBack);rd.onerror=()=>showPanel({title:'Couldn’t read that file',sub:'Try again, or use Paste a save instead.',buttons:[{label:'Back',primary:true,fn:fileBack||titleScreen}]});rd.readAsText(f);});
let pasteBack=null;
function openPaste(back){pasteBack=back;$('pasteText').value='';$('pasteDlg').classList.remove('hidden');try{$('pasteText').focus();}catch(e){}}
function closePaste(){$('pasteDlg').classList.add('hidden');try{$('pasteText').blur();}catch(e){}}
$('pasteLoad').addEventListener('click',e=>{e.stopPropagation();const t=$('pasteText').value;closePaste();importSaveText(t,pasteBack);});
$('pasteCancel').addEventListener('click',e=>{e.stopPropagation();closePaste();});
