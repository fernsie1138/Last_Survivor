const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  // a big mesa, and a spot with a cluster of buttes
  const spots=await page.evaluate(()=>{const L=window.__LT,C=L.MESA_CELL;let big=null,cluster=null,bc=0;
    for(let j=-90;j<90;j++)for(let i=-130;i<130;i++){const m=L.mesaAt(i,j);if(!m)continue;if(!m.butte&&(!big||m.maxR>big.maxR))big=m;
      const n=L.mesasNear(m.x,m.y,900).length;if(n>bc){bc=n;cluster=m;}}return {big:{x:big.x,y:big.y,r:big.maxR},cluster:{x:cluster.x,y:cluster.y,n:bc,r:cluster.maxR}};});
  console.log('largest mesa',Math.round(spots.big.r*2),'px across; densest cluster',spots.cluster.n,'within ~90 m');
  for(const [k,s,z] of [['big',spots.big,0.4],['cluster',spots.cluster,0.6]]){await page.evaluate(r=>{window.__r=r+170;},s.r||300);
    await page.evaluate(([x,y,z])=>{const L=window.__LT,G=L.G,c=G.cars.find(c=>c.id==='hero0');G.hero.x=x+(window.__r||0);G.hero.y=y;G.cam.x=x;G.cam.y=y;c.x=x+9000;c.y=y;G.clock=10*60;L.setZoom(z);},[s.x,s.y,z]);
    await page.waitForTimeout(800);await page.screenshot({path:'/tmp/mesa_'+k+'.png'});}
  // the map, zoomed in on mesa country
  await page.locator('#mapBtn').tap();await page.waitForTimeout(800);
  await page.evaluate(([x,y])=>{const L=window.__LT;L.mapView.cx=x;L.mapView.cy=y;L.mapView.sc=0.03;},[spots.cluster.x,spots.cluster.y]);await page.waitForTimeout(400);
  await page.screenshot({path:'/tmp/mesa_map.png'});
  await page.evaluate(()=>{const L=window.__LT;L.mapView.sc=0.0016;});await page.waitForTimeout(400);await page.screenshot({path:'/tmp/mesa_mapwide.png'});
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
