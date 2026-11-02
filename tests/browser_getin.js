const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  if(process.env.DESKTOP_MODE)await page.addInitScript(()=>{for(const o of [window,Window.prototype,Object.getPrototypeOf(Window.prototype)])try{delete o.ontouchstart;}catch(e){}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(400);
  await page.evaluate(()=>{window.__log=[];const L=window.__LT;const orig={enter:L.enterCar,exit:L.exitCar};
    for(const t of ['pointerdown','pointerup','touchstart','touchend','click'])window.addEventListener(t,e=>window.__log.push(t+'@'+(e.target.textContent||e.target.id||e.target.tagName).slice(0,12)+' t='+Math.round(performance.now())),true);});
  console.log("'ontouchstart' in window:",await page.evaluate(()=>'ontouchstart' in window),'| TouchEvent exists:',await page.evaluate(()=>typeof TouchEvent!=='undefined'),'| maxTouchPoints:',await page.evaluate(()=>navigator.maxTouchPoints));
  const btn=page.locator('#ctx button',{hasText:'Get in'});console.log('Get in button present:',await btn.count());
  await btn.tap();
  const trace=[];for(let i=0;i<10;i++){await page.waitForTimeout(100);trace.push(await page.evaluate(()=>window.__LT.G.hero.inCar?'in':'out'));}
  console.log('in/out every 100 ms after tapping Get in:',trace.join(' '));
  console.log('events:',(await page.evaluate(()=>window.__log)).join(' | '));
  console.log('context buttons now:',(await page.locator('#ctx button').allTextContents()).join(', '));
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
