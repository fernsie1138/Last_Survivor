const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const p=await ctx.newPage();
await p.goto('file://'+__dirname+'/../dist/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(600);
await p.locator('#sBtns button',{hasText:'Start'}).first().tap();await p.waitForTimeout(150);await p.locator('#sBtns button',{hasText:'Head out'}).tap();await p.waitForTimeout(200);
await p.locator('#mapBtn').tap();await p.waitForTimeout(200);console.log('Attack button visible on the map:',await p.locator('#bAttack').isVisible());
await p.locator('#mapClose').tap();await p.waitForTimeout(200);console.log('Attack button back after closing the map:',await p.locator('#bAttack').isVisible());await b.close();})();
