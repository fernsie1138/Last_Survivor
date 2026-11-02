// in 2D (the default) the page must never ask for three.js, even after playing for a while
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();const reqs=[];
  page.on('request',r=>{if(/three/.test(r.url()))reqs.push(r.url());});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.waitForTimeout(800);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(300);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(3000);
  console.log('three.js requests in 2D:',reqs.length,'| 3D canvas exists:',await page.evaluate(()=>!!document.getElementById('c3d')),'| errors:',errs.join(' | ')||'none');await b.close();})();
