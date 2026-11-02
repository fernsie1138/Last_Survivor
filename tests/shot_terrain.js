const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  const spots=await page.evaluate(()=>{const L=window.__LT,T=L.T,out={};
    // a bridge over a flowing river, and one over a canyon; a road cutting
    for(const R of L.roads){for(let i=5;i<R.n-5;i+=2){const t=L.terrainRaw(R.xs[i],R.ys[i]);
      if(t===T.RIVER&&!out.river)out.river={x:R.xs[i],y:R.ys[i]};if(t===T.CANYON&&!out.canyon)out.canyon={x:R.xs[i],y:R.ys[i]};
      if((t===T.MOUNT)&&!out.cutting)out.cutting={x:R.xs[i],y:R.ys[i]};if(t===T.MESA&&!out.mesa)out.mesa={x:R.xs[i],y:R.ys[i]};}}
    for(let t=0;t<60000&&!out.boulders;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;if(L.landValue(x,y)<0.2)continue;const c=L.getChunk(Math.floor(x/640),Math.floor(y/640));if(c.boulders&&c.rocks.length>15)out.boulders={x:c.cx*640+320,y:c.cy*640+320};}
    return out;});
  console.log('found:',Object.keys(spots).join(', '));
  for(const k of Object.keys(spots)){const s=spots[k];
    await page.evaluate(([x,y])=>{const L=window.__LT,c=L.G.cars.find(c=>c.id==='hero0');L.G.hero.x=x;L.G.hero.y=y;L.G.cam.x=x;L.G.cam.y=y;c.x=x+5000;c.y=y+5000;L.G.clock=11*60;L.setZoom(0.6);L.G.raiders=[];L.G.cars=L.G.cars.filter(c=>c.driver!=='raider');},[s.x,s.y]);
    await page.waitForTimeout(700);await page.screenshot({path:'/tmp/terr_'+k+'.png'});}
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
