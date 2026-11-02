const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const p=await ctx.newPage();
  await p.goto('file://'+__dirname+'/../dist/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(700);
  await p.locator('#sBtns button',{hasText:'Start'}).first().tap();await p.waitForTimeout(200);await p.locator('#sBtns button',{hasText:'Head out'}).tap();
  await p.evaluate(()=>{const L=window.__LT;L.setZoom(0.5);const o=L.LOCS[L.START];L.G.hero.x=o.x;L.G.hero.y=o.y+60;L.G.cam.x=o.x;L.G.cam.y=o.y;});
  await p.waitForTimeout(2500);await p.screenshot({path:'/mnt/user-data/outputs/zoomed-out.png'});await b.close();})();
