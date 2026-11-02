// independent fingers: dispatch real TouchEvents in the page, so one finger can lift while the other stays down
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  await page.evaluate(()=>{const active=new Map();
    window.__finger=(type,id,x,y)=>{const target=type==='touchstart'?document.elementFromPoint(x,y):active.get(id).target;
      const t=new Touch({identifier:id,target,clientX:x,clientY:y});if(type==='touchstart')active.set(id,{target,t});else if(type==='touchmove')active.get(id).t=t;
      const all=[...active.values()].map(a=>a.t);if(type==='touchend')active.delete(id);
      target.dispatchEvent(new TouchEvent(type,{touches:type==='touchend'?all.filter(q=>q.identifier!==id):all,changedTouches:[t],targetTouches:[t],bubbles:true,cancelable:true}));return target.id||target.tagName;};});
  const F=(type,id,x,y)=>page.evaluate(([a,b,c,d])=>window.__finger(a,b,c,d),[type,id,x,y]);
  const st=()=>page.evaluate(()=>{const L=window.__LT,h=L.G.hero,c=L.heroCar();return {hx:h.x,hy:h.y,stick:L.stick.active,swing:h.swing,foe:L.G.foes[0]&&L.G.foes[0].hp,car:c?{speed:c.speed,boost:c.boosting}:null,zoom:L.SETTINGS.zoom};});
  const vp=page.viewportSize(),sx=vp.width*0.75,sy=vp.height*0.6;
  // ---- on foot: walk with the right thumb, tap Attack five times with the left ----
  await page.evaluate(()=>{const L=window.__LT,h=L.G.hero;h.inv={bat:1};h.weapon='bat';
    const f=L.makeFoe({id:'ft',weapon:'knife',post:{x:h.x,y:h.y},patrol:[{x:h.x,y:h.y}],seed:1,brave:true},null,h.x-30,h.y);f.loose=true;f.state='alert';f.detect=1;f.lastSeen={x:h.x,y:h.y};f.cd=99;f.hp=999;f.maxHp=999;L.G.foes.push(f);});
  await page.waitForTimeout(300);const ab=await page.locator('#bAttack').boundingBox(),ax=ab.x+ab.width/2,ay=ab.y+ab.height/2;
  console.log('right thumb lands on:',await F('touchstart',1,sx,sy));await F('touchmove',1,sx+55,sy);await page.waitForTimeout(300);
  const s0=await st();let swings=0,landed='';
  for(let k=0;k<5;k++){landed=await F('touchstart',2,ax,ay);if((await st()).swing>0)swings++;await page.waitForTimeout(90);await F('touchend',2,ax,ay);await F('touchmove',1,sx+56,sy);await page.waitForTimeout(500);}
  const s1=await st();
  console.log('left thumb lands on:',landed,'| 5 Attack taps while walking: swings',swings+'/5, raider lost',s0.foe-s1.foe,'health, hero kept walking',Math.round(Math.hypot(s1.hx-s0.hx,s1.hy-s0.hy)),'px, joystick still held:',s1.stick);
  await F('touchend',1,sx+56,sy);await page.evaluate(()=>{window.__LT.G.foes=[];});
  // ---- in the car: steer with the right thumb, hold Boost with the left, then Shoot with a gun ----
  await page.evaluate(()=>{const L=window.__LT,c=L.G.cars.find(c=>c.id==='hero0');L.G.hero.x=c.x;L.G.hero.y=c.y;L.enterCar(c);L.G.hero.inv={revolver:1,bullets:6};L.G.hero.weapon='revolver';});
  await page.waitForTimeout(300);const bb=await page.locator('#bBoost').boundingBox();
  await F('touchstart',3,sx,sy);await F('touchmove',3,sx,sy-60);await page.waitForTimeout(600);await F('touchstart',4,bb.x+bb.width/2,bb.y+bb.height/2);await page.waitForTimeout(500);
  const boosting=await page.evaluate(()=>window.__LT.touch.boost);await F('touchend',4,bb.x+bb.width/2,bb.y+bb.height/2);await page.waitForTimeout(150);const after=(await st());
  console.log('driving: Boost held while both thumbs down:',boosting,'; Boost released, still steering:',!(await page.evaluate(()=>window.__LT.touch.boost))&&after.stick);
  const shootVisible=await page.locator('#bShoot').isVisible();
  await page.evaluate(()=>{const L=window.__LT,c=L.heroCar();const e=L.makeRaider('buggy',c.x+120,c.y+60,c.a,c.speed);L.G.cars.push(e);});
  const sh=await page.locator('#bShoot').boundingBox();const b0=await page.evaluate(()=>window.__LT.G.hero.inv.bullets);
  await F('touchstart',5,sh.x+sh.width/2,sh.y+sh.height/2);await page.waitForTimeout(80);await F('touchend',5,sh.x+sh.width/2,sh.y+sh.height/2);
  const b1=await page.evaluate(()=>window.__LT.G.hero.inv.bullets);
  console.log('Shoot button shown in the car with a revolver:',shootVisible,'; tapping it while steering fired:',b0-b1,'round(s); joystick still held:',(await st()).stick);
  await F('touchend',3,sx,sy-60);
  // ---- two fingers on open ground still pinch-zoom ----
  await page.evaluate(()=>{const L=window.__LT;L.exitCar(true);L.G.cars=L.G.cars.filter(c=>c.driver!=='raider');});await page.waitForTimeout(200);
  await F('touchstart',6,vp.width*0.5,vp.height*0.4);await F('touchstart',7,vp.width*0.7,vp.height*0.4);for(let i=1;i<=6;i++){await F('touchmove',7,vp.width*0.7-i*15,vp.height*0.4);await page.waitForTimeout(30);}
  const z=(await st()).zoom;await F('touchend',7,0,0);await F('touchend',6,0,0);console.log('two fingers on open ground pinch: zoom →',z.toFixed(2));
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
