// genuine two-finger input: right thumb holds the joystick, left thumb taps Attack. Lifting one finger = a touchMove that leaves it out.
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(200);
  const vp=page.viewportSize(),cdp=await ctx.newCDPSession(page);
  // log every pointer event the page sees
  await page.evaluate(()=>{window.__pe=[];for(const t of ['pointerdown','pointerup','pointercancel'])window.addEventListener(t,e=>window.__pe.push(t+'#'+e.pointerId+'@'+(e.target.id||e.target.tagName)),true);});
  await page.evaluate(()=>{const L=window.__LT,h=L.G.hero;h.inv={bat:1};h.weapon='bat';
    const f=L.makeFoe({id:'mt',weapon:'knife',post:{x:h.x,y:h.y},patrol:[{x:h.x,y:h.y}],seed:1,brave:true},null,h.x-30,h.y);f.loose=true;f.state='alert';f.detect=1;f.lastSeen={x:h.x,y:h.y};f.cd=99;f.hp=999;f.maxHp=999;L.G.foes.push(f);});
  await page.waitForTimeout(300);const ab=await page.locator('#bAttack').boundingBox(),ax=ab.x+ab.width/2,ay=ab.y+ab.height/2,sx=vp.width*0.75,sy=vp.height*0.6;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy,id:1}]});
  for(let i=0;i<5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+50,y:sy,id:1}]});await page.waitForTimeout(40);}
  const s0=await page.evaluate(()=>({x:window.__LT.G.hero.x,hp:window.__LT.G.foes[0].hp}));let swings=0;
  for(let k=0;k<5;k++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx+50,y:sy,id:1},{x:ax,y:ay,id:2}]});   // second finger down on Attack
    const sw=await page.evaluate(()=>window.__LT.G.hero.swing>0);if(sw)swings++;
    await page.waitForTimeout(80);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+50,y:sy,id:1}]});                         // lift only the second finger
    for(let j=0;j<8;j++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+50,y:sy,id:1}]});await page.waitForTimeout(60);}}
  const s1=await page.evaluate(()=>({x:window.__LT.G.hero.x,hp:window.__LT.G.foes[0].hp,stick:window.__LT.stick.active,pe:window.__pe.slice(0,16)}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  console.log('5 taps on Attack while holding the joystick: swings started',swings,'; raider lost',s0.hp-s1.hp,'health; hero walked',Math.round(Math.abs(s1.x-s0.x)),'px; joystick still held:',s1.stick);
  console.log('pointer events seen:',s1.pe.join(', '));console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
