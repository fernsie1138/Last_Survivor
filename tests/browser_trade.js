const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  // walk up to the publican and talk, using the on-screen buttons
  await page.evaluate(()=>{const L=window.__LT,o=L.LOCS[L.START];L.G.hero.x=o.x;L.G.hero.y=o.y;L.syncNPCs();const p=L.G.npcs.find(n=>n.def.role==='publican');p.path=[];p.wait=99;L.G.hero.x=p.x+20;L.G.hero.y=p.y;L.G.hero.inv={durries:2,watch:1,water:1};});
  await page.waitForTimeout(400);const talkBtn=page.locator('#ctx button',{hasText:'Talk to'});console.log('Talk button:',await talkBtn.count()>0);await talkBtn.tap();await page.waitForTimeout(200);
  await page.locator('#tOpts button',{hasText:'business'}).tap();await page.waitForTimeout(200);console.log('trade screen open:',await page.locator('#tradePanel').isVisible());
  await page.locator('#tradeBody button[data-a="want"][data-k="water"]').tap();await page.locator('#tradeBody button[data-a="want"][data-k="beans"]').tap();
  const dealBefore=await page.locator('#tradeBody button[data-a="deal"]').isDisabled();
  await page.locator('#tradeBody button[data-a="offer"][data-k="watch"]').tap();await page.waitForTimeout(100);
  const dealAfter=await page.locator('#tradeBody button[data-a="deal"]').isDisabled();console.log('Deal disabled before offering:',dealBefore,'; after offering a watch:',dealAfter);
  await page.screenshot({path:'/mnt/user-data/outputs/trade.png'});
  await page.locator('#tradeBody button[data-a="deal"]').tap();await page.waitForTimeout(150);
  console.log('after the deal:',await page.evaluate(()=>JSON.stringify(window.__LT.G.hero.inv)));
  await page.locator('#tradeClose').tap();await page.waitForTimeout(150);console.log('back in play:',await page.evaluate(()=>window.__LT.state));
  // crafting from the Gear screen
  await page.evaluate(()=>{window.__LT.G.hero.inv.cloth=1;});await page.locator('#gearBtn').tap();await page.waitForTimeout(200);
  const make=page.locator('#invBody button[data-a="craft"]').first();await make.tap();await page.waitForTimeout(100);
  console.log('made bandages from rags:',await page.evaluate(()=>window.__LT.G.hero.inv.bandage||0));
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
