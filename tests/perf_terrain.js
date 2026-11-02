const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  const r=await page.evaluate(()=>{const L=window.__LT;const t0=performance.now();let n=0;for(let cx=200;cx<215;cx++)for(let cy=-30;cy<-25;cy++){const c=L.getChunk(cx,cy);L.buildOverlayTest(c);n++;}return (performance.now()-t0)/n;});
  console.log('drawing one chunk’s terrain layer: '+r.toFixed(1)+' ms (done once per chunk, then reused)');
  // drive fast down a highway for 10 s and measure frame rate and worst frame
  const res=await page.evaluate(()=>new Promise(res=>{const L=window.__LT,G=L.G,c=G.cars.find(c=>c.id==='hero0');G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);G.encT=1e9;
    L.keys.ArrowUp=true;let frames=0,worst=0,last=performance.now();const t0=last;const f=()=>{const now=performance.now();worst=Math.max(worst,now-last);last=now;frames++;c.fuel=100;
      if(now-t0<10000)requestAnimationFrame(f);else{L.keys.ArrowUp=false;res({fps:frames/((now-t0)/1000),worst,km:Math.round(G.dist/1000)});}};requestAnimationFrame(f);}));
  console.log('driving 10 s in this software-only test browser: '+res.fps.toFixed(0)+' fps, worst frame '+res.worst.toFixed(0)+' ms');
  await page.evaluate(()=>{const L=window.__LT,o=window.__LT;});await b.close();})();
