const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const page=await (await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true})).newPage();
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  const cdp=await page.context().newCDPSession(page);
  const drag=async sel=>{const box=await page.locator(sel).boundingBox(),x=box.x+box.width/2,y0=box.y+box.height*0.8,y1=box.y+box.height*0.25;const before=await page.evaluate(s=>document.querySelector(s).scrollTop,sel);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y0,id:3}]});for(let k=1;k<=10;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y0+(y1-y0)*k/10,id:3}]});await page.waitForTimeout(16);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);return Math.round(await page.evaluate(s=>document.querySelector(s).scrollTop,sel)-before);};
  // lose a finger lift first, as Safari can
  await page.evaluate(()=>{const c=document.querySelector('canvas'),t=new Touch({identifier:42,target:c,clientX:700,clientY:400});c.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],targetTouches:[t],bubbles:true,cancelable:true}));
    window.__LT.G.hero.inv={durries:3,watch:2,water:2,beans:2,jerky:2,bandage:2,scrap:4,cloth:3,wire:2,hose:1,jerrycan:1,tyreiron:1,powder:2,bat:1};});
  await page.locator('#gearBtn').tap();await page.waitForTimeout(300);console.log('Gear screen: drag scrolled it by',await drag('#invPanel .invbox'),'px');
  await page.locator('#invClose').tap();await page.waitForTimeout(200);await page.locator('#pauseBtn').tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Settings'}).tap();await page.waitForTimeout(300);
  const room=await page.evaluate(()=>{const e=document.querySelector('#screen .panel');return e?e.scrollHeight-e.clientHeight:0;});
  console.log('Settings panel: '+(room>0?'drag scrolled it by '+await drag('#screen .panel')+' px':'fits on screen, nothing to scroll'));await b.close();})();
