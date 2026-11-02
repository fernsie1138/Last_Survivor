// can you drag-scroll the trade list? first normally, then with a finger whose lift was never reported (what Safari can do)
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const page=await (await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true})).newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  const cdp=await page.context().newCDPSession(page);
  const drag=async()=>{const box=await page.locator('#tradePanel .invbox').boundingBox(),x=box.x+box.width/2,y0=box.y+box.height*0.8,y1=box.y+box.height*0.25;
    const before=await page.evaluate(()=>document.querySelector('#tradePanel .invbox').scrollTop);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y0,id:7}]});for(let k=1;k<=10;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y0+(y1-y0)*k/10,id:7}]});await page.waitForTimeout(16);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
    return Math.round(await page.evaluate(()=>document.querySelector('#tradePanel .invbox').scrollTop)-before);};
  const openTrade=async()=>{await page.evaluate(()=>{const L=window.__LT,o=L.LOCS[L.START];L.G.hero.x=o.x;L.G.hero.y=o.y;L.syncNPCs();L.G.hero.inv={durries:3,watch:2,water:2,beans:2,jerky:2,bandage:2,scrap:4,cloth:3,wire:2,hose:1,jerrycan:1,tyreiron:1};
    L.openTrade(L.G.npcs.find(n=>n.def.role==='mechanic'));});await page.waitForTimeout(300);};
  await openTrade();const tall=await page.evaluate(()=>{const e=document.querySelector('#tradePanel .invbox');return e.scrollHeight-e.clientHeight;});
  console.log('trade list can scroll by',tall,'px | drag scrolled it by',await drag(),'px (normal case)');
  await page.evaluate(()=>window.__LT.closeTrade());await page.waitForTimeout(200);
  // a finger goes down on the open ground in play, and its lift is never reported
  await page.evaluate(()=>{const c=document.querySelector('canvas'),t=new Touch({identifier:99,target:c,clientX:700,clientY:400});c.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],targetTouches:[t],bubbles:true,cancelable:true}));});
  await openTrade();console.log('with a lost finger lift: drag scrolled it by',await drag(),'px');
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
