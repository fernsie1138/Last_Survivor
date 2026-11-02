// 2D must draw exactly as v1.0 did: render the same frames in both builds (seeded random, no animation loop) and compare every pixel
const {chromium,devices}=require('playwright');
async function frames(file){const b=await chromium.launch();const p=await (await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true})).newPage();
  await p.addInitScript(()=>{window.__TEST=true;let s=12345;Math.random=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff;};const t0=1000;performance.now=()=>t0;try{localStorage.clear();}catch(e){}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+file);await p.waitForTimeout(500);
  const out=[];for(const [x,y,hour,zoom,mode] of [[null,null,11,1,'start'],[null,null,22,1,'start'],[3000,-9000,15,0.6,'drive'],[0,0,9,1.4,'drive']]){
    out.push(await p.evaluate(([x,y,hour,zoom,mode])=>{const L=window.__LT;L.newGame();const G=L.G;if(mode==='drive'){const c=L.nearestCar(400)||G.cars[0];L.enterCar(c);}
      if(x!==null){const b=L.body();b.x+=x;b.y+=y;}const b=L.body();G.cam.x=b.x;G.cam.y=b.y;G.clock=hour*60;G.shake=0;L.setZoom(zoom);
      for(let i=0;i<3;i++)L.render();const c=document.getElementById('c');return c.toDataURL();},[x,y,hour,zoom,mode]));}
  await b.close();return {out,errs};}
(async()=>{const a=await frames('/tmp/v10_original.html'),b=await frames(__dirname+'/../dist/index.html');let same=0;
  for(let i=0;i<a.out.length;i++){const eq=a.out[i]===b.out[i];if(eq)same++;console.log('frame',i,eq?'identical':'DIFFERENT',a.out[i].length);}
  console.log(same+' of '+a.out.length+' frames pixel-identical; errors:',a.errs.concat(b.errs).join(' | ')||'none');})();
