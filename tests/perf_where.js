const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  const res=await page.evaluate(()=>new Promise(res=>{const L=window.__LT,G=L.G,c=G.cars.find(c=>c.id==='hero0');G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);G.encT=1e9;L.keys.ArrowUp=true;
    // time the pieces: chunk generation, terrain layers, update, render
    const P=window.__perf={chunk:0,ov:0};const frames=[];let last=performance.now();const t0=last;
    const f=()=>{const now=performance.now();frames.push({dt:now-last,chunk:P.chunk,ov:P.ov,upd:P.upd||0,ren:P.ren||0});P.chunk=0;P.ov=0;last=now;c.fuel=100;
      if(now-t0<10000)requestAnimationFrame(f);else{L.keys.ArrowUp=false;frames.sort((a,b)=>b.dt-a.dt);res(frames.slice(0,6));}};requestAnimationFrame(f);}));
  console.log('the six slowest frames (ms):');for(const r of res)console.log('  frame '+r.dt.toFixed(0)+': chunk generation '+r.chunk.toFixed(0)+', terrain layers '+r.ov.toFixed(0)+', update '+r.upd.toFixed(0)+', render '+r.ren.toFixed(0));
  await b.close();})();
