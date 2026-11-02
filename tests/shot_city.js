const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const page=await (await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true})).newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///mnt/user-data/outputs/index.html');await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  const spots=await page.evaluate(()=>{const L=window.__LT,fk=L.LOCS.find(l=>l.type==='city'&&l.faction==='fuelkings');const farm=fk.bld.find(b=>b.kind==='barn');
    let sh=null;for(let j=-90;j<90&&!sh;j++)for(let i=-130;i<130&&!sh;i++){const s=L.shellAt(i,j);if(s&&s.chimney&&s.walls.length>=2&&L.roadInfo(s.x,s.y).d<1200)sh=s;}
    return {grid:{x:fk.square.x,y:fk.square.y,z:0.45},refinery:{x:fk.refinery.x,y:fk.refinery.y,z:0.45},farm:{x:farm.x,y:farm.y,z:0.55},ruin:{x:sh.x,y:sh.y,z:1.1},name:fk.name};});
  console.log('city:',spots.name);
  for(const k of ['grid','refinery','farm','ruin']){const s=spots[k];
    await page.evaluate(([x,y,z])=>{const L=window.__LT,G=L.G;G.hero.x=x+(window.__k==='ruin'?120:0);G.hero.y=y+(window.__k==='ruin'?120:0);G.cam.x=x;G.cam.y=y;L.setZoom(z);G.clock=10*60;G.animals=[];},[s.x,s.y,s.z]);
    await page.waitForTimeout(900);await page.screenshot({path:'/tmp/city_'+k+'.png'});}
  // frame rate standing in the middle of the city, compared with open country
  for(const [where,dx] of [['city centre',0],['open country',60000]]){await page.evaluate(([x,y])=>{const L=window.__LT,G=L.G;G.hero.x=x;G.hero.y=y;G.cam.x=x;G.cam.y=y;L.setZoom(1);},[spots.grid.x+dx,spots.grid.y]);await page.waitForTimeout(800);
    const fps=await page.evaluate(()=>new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;if(performance.now()-t0<2500)requestAnimationFrame(f);else r(n/((performance.now()-t0)/1000));};requestAnimationFrame(f);}));
    console.log('frame rate in '+where+': '+fps.toFixed(0)+' fps (software-only test browser)');}
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
