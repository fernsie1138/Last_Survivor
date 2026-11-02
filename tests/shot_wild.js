const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const page=await (await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true})).newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  // close up: one of each, plus a carcass, on open ground
  await page.evaluate(()=>{const L=window.__LT,G=L.G,h=G.hero;h.x+=4000;h.y+=4000;G.cam.x=h.x;G.cam.y=h.y;G.animals=[];G.wildT=1e9;G.clock=11*60;L.setZoom(1.5);
    L.spawnAnimal('snake',h.x+90,h.y-50);L.spawnAnimal('rabbit',h.x-110,h.y-60);const d=L.spawnAnimal('dingo',h.x+120,h.y+70);d.state='idle';
    const mob={};for(let i=0;i<3;i++){const r=L.spawnAnimal('roo',h.x-160+i*45,h.y+90+i*15,{mob});r.state='idle';}const dead=L.spawnAnimal('roo',h.x+20,h.y+150);L.killAnimal(dead);});
  await page.waitForTimeout(400);await page.screenshot({path:'/tmp/wild_close.png'});
  // driving: a mob on the verge ahead
  await page.evaluate(()=>{const L=window.__LT,G=L.G,R=L.roads.find(r=>r.cls==='highway'&&r.len>150000),i=400,c=G.cars.find(c=>c.id==='hero0');G.animals=[];
    c.x=R.xs[i];c.y=R.ys[i];c.a=Math.atan2(R.ys[i+1]-R.ys[i],R.xs[i+1]-R.xs[i]);G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.setZoom(0.8);G.cam.x=c.x;G.cam.y=c.y;
    const j=i+9,nx=-(R.ys[j+1]-R.ys[j]),ny=R.xs[j+1]-R.xs[j],l=Math.hypot(nx,ny),mob={};for(let k=0;k<4;k++){const r=L.spawnAnimal('roo',R.xs[j]+nx/l*(R.w/2+70+k*22),R.ys[j]+ny/l*(R.w/2+70+k*22)+k*15,{mob});r.state='idle';}});
  await page.waitForTimeout(600);
  console.log('roos now:',await page.evaluate(()=>{const L=window.__LT,G=L.G,c=L.heroCar();return G.animals.map(a=>Math.round(Math.hypot(a.x-c.x,a.y-c.y))+'px '+a.state).join(', ')+' | zoom '+L.SETTINGS.zoom+' | camera '+Math.round(G.cam.x-c.x)+','+Math.round(G.cam.y-c.y);}));
  await page.screenshot({path:'/tmp/wild_road.png'});
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
