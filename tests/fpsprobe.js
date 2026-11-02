const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  for(const where of ['in Rust Hollow','out in open country']){
    if(where!=='in Rust Hollow')await page.evaluate(()=>{const L=window.__LT;L.G.hero.x+=6000;L.G.hero.y+=6000;L.G.cam.x=L.G.hero.x;L.G.cam.y=L.G.hero.y;});
    await page.waitForTimeout(500);
    const r=await page.evaluate(()=>new Promise(res=>{const L=window.__LT,g0=L.G.time,t0=performance.now();let frames=0;const f=()=>{frames++;if(performance.now()-t0<2000)requestAnimationFrame(f);else res({fps:frames/((performance.now()-t0)/1000),ratio:(L.G.time-g0)/((performance.now()-t0)/1000)});};requestAnimationFrame(f);}));
    console.log(where+': '+r.fps.toFixed(0)+' frames per second; game time runs at '+(r.ratio*100).toFixed(0)+'% of real time');}
  await b.close();})();
