// 3D view: switch it on, drive to a bridge, a mesa, a city, ruins, by night and on foot; screenshot each and check for errors
const {chromium,devices}=require('playwright');const fs=require('fs');
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',LOCAL='/home/claude/vendor/three.r128.min.js';
(async()=>{const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});
  if(!process.env.LIVE)await ctx.route(THREE_URL,r=>r.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(LOCAL)}));
  await ctx.addInitScript(()=>{try{localStorage.setItem('lastsurvivor.settings',JSON.stringify({view:'3d'}));}catch(e){}});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push('console: '+m.text());});
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.waitForTimeout(1500);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(300);await page.locator('#sBtns button',{hasText:'Head out'}).tap();
  await page.waitForFunction(()=>window.__LT.V3.status==='ready'||window.__LT.V3.status==='failed',null,{timeout:20000});
  console.log('3D status:',await page.evaluate(()=>window.__LT.V3.status));
  await page.waitForTimeout(800);await page.evaluate(()=>{const L=window.__LT;L.G.swapT=-99;L.enterCar(L.nearestCar(300));});
  console.log('in the car:',await page.evaluate(()=>!!window.__LT.heroCar()));
  const stats=async(tag)=>{const s=await page.evaluate(()=>{const V=window.__LT.V3,i=V.R.info;return {tris:i.render.triangles,calls:i.render.calls,chunks:V.chunks.size,mesas:V.mesas.size,locs:V.locs.size,shells:V.shells.size,cars:V.cars.size,people:V.people.size,geos:i.memory.geometries};});console.log(tag,JSON.stringify(s));};
  const settle=async(ms)=>{await page.waitForTimeout(ms||2500);};
  const place=async(x,y,a,hour)=>{await page.evaluate(([x,y,a,hour])=>{const L=window.__LT,G=L.G,c=L.heroCar();if(c){c.x=x;c.y=y;c.a=a;c.vx=c.vy=0;c.speed=0;c.vf=0;}else{G.hero.x=x;G.hero.y=y;G.hero.a=a;}G.cam.x=x;G.cam.y=y;G.clock=Math.floor(G.clock/1440)*1440+hour*60;},[x,y,a,hour]);};
  await page.evaluate(()=>{const G=window.__LT.G;G.clock=Math.floor(G.clock/1440)*1440+11*60;});await settle(3500);
  await page.screenshot({path:'/tmp/v3_start.png'});await stats('start');
  // a bridge over a canyon, and one over a river
  const br=await page.evaluate(()=>{const L=window.__LT,out={};for(const R of L.roads){for(let i=5;i<R.n-5;i+=3){const t=L.roadTerrain(R,i);if(t>1&&!out[t]){const k=Math.max(0,i-9);out[t]={x:R.xs[k],y:R.ys[k],a:Math.atan2(R.ys[i]-R.ys[k],R.xs[i]-R.xs[k])};}}if(out[2]&&out[3])break;}return out;});
  for(const [t,nm] of [[3,'canyon'],[2,'river']])if(br[t]){await place(br[t].x,br[t].y,br[t].a,10);await settle();await page.screenshot({path:'/tmp/v3_bridge_'+nm+'.png'});await stats('bridge '+nm);}
  // the biggest mesa near a road, seen from the road
  const ms=await page.evaluate(()=>{const L=window.__LT;let best=null;for(let j=-90;j<90;j+=1)for(let i=-130;i<130;i+=1){const m=L.mesaAt(i,j);if(!m||m.butte)continue;const ri=L.roadInfo(m.x,m.y);if(ri.d<m.maxR+1200&&(!best||m.maxR>best.m.maxR))best={m,ri};}
    const m=best.m,ri=best.ri,dx=ri.px-m.x,dy=ri.py-m.y,l=Math.hypot(dx,dy)||1,d=m.maxR+800;return {x:m.x+dx/l*d,y:m.y+dy/l*d,a:Math.atan2(-dy,-dx),mx:m.x,my:m.y,r:m.maxR};});
  await place(ms.x,ms.y,ms.a,15.5);await settle();await page.screenshot({path:'/tmp/v3_mesa_road.png'});await stats('mesa road');
  await place(ms.mx+(ms.r+420),ms.my+60,Math.PI,9);await settle();await page.screenshot({path:'/tmp/v3_mesa_close.png'});
  // ruins (a ruined settlement), and a lone ruin out in the scrub
  const ru=await page.evaluate(()=>{const L=window.__LT,r=L.LOCS.find(l=>l.type==='ruin'&&l.links.length&&!l.camp)||L.LOCS.find(l=>l.type==='ruin');return {x:r.x-520,y:r.y+200,a:Math.atan2(-200,520)};});
  await place(ru.x,ru.y,ru.a,8);await settle();await page.screenshot({path:'/tmp/v3_ruins.png'});await stats('ruins');
  const sh=await page.evaluate(()=>{const L=window.__LT,G=L.G,b=L.body();let best=null;for(const s of L.shellsNear(b.x,b.y,40000)){if(!best||s.chimney)best=s;if(s.chimney)break;}return {x:best.x-260,y:best.y+90,a:Math.atan2(-90,260)};});
  await place(sh.x,sh.y,sh.a,17.5);await settle();await page.screenshot({path:'/tmp/v3_shell.png'});
  // night on the open road, headlights on
  await place(br[3]?br[3].x:ms.x,br[3]?br[3].y:ms.y,br[3]?br[3].a:ms.a,22.5);await page.evaluate(()=>{const c=window.__LT.heroCar();c.fuel=80;});await settle();await page.screenshot({path:'/tmp/v3_night.png'});
  // a city: on the road just outside a gate, then in the middle
  const city=await page.evaluate(()=>{const L=window.__LT,c=L.LOCS.find(l=>l.type==='city'&&l.links.length);const lk=c.links[0],R=L.roads[lk.road];let i=lk.dir>0?0:R.n-1;
    while(Math.hypot(R.xs[i]-c.x,R.ys[i]-c.y)<c.rad+450)i+=lk.dir;return {x:R.xs[i],y:R.ys[i],a:Math.atan2(c.y-R.ys[i],c.x-R.xs[i]),cx:c.x,cy:c.y,name:c.name};});
  await place(city.x,city.y,city.a,12);await settle(4000);await page.screenshot({path:'/tmp/v3_city_gate.png'});await stats('city gate '+city.name);
  const st=await page.evaluate(([cx,cy])=>{const c=window.__LT.LOCS.find(l=>Math.abs(l.x-cx)<1&&Math.abs(l.y-cy)<1);const s=c.streets[Math.floor(c.streets.length/2)];return {x:s.x1+(s.x2-s.x1)*0.42,y:s.y1+(s.y2-s.y1)*0.42,a:Math.atan2(s.y2-s.y1,s.x2-s.x1)};},[city.cx,city.cy]);
  await page.evaluate(([cx,cy])=>{const L=window.__LT;L.G.inside=L.LOCS.find(l=>Math.abs(l.x-cx)<1&&Math.abs(l.y-cy)<1).id;},[city.cx,city.cy]);await place(st.x,st.y,st.a,16);await settle(3000);await page.screenshot({path:'/tmp/v3_city_street.png'});await stats('city street');
  // drive for real for a few seconds with the throttle down (keyboard), and measure frame time
  await page.evaluate(()=>{const L=window.__LT;L.G.inside=-1;});await place(city.x,city.y,city.a+Math.PI,11);await settle(1500);await page.keyboard.down('KeyW');const t0=await page.evaluate(()=>performance.now());await page.waitForTimeout(4000);await page.keyboard.up('KeyW');
  const drv=await page.evaluate(([cx,cy])=>{const c=window.__LT.heroCar();return {speed:Math.round(c.speed),moved:Math.round(Math.hypot(c.x-cx,c.y-cy))};},[city.x,city.y]);console.log('drove:',JSON.stringify(drv));
  await page.screenshot({path:'/tmp/v3_driving.png'});
  // on foot: get out
  await page.evaluate(()=>{const L=window.__LT,c=L.heroCar();c.vx=c.vy=c.speed=c.vf=0;L.exitCar();});await settle(1500);await page.screenshot({path:'/tmp/v3_onfoot.png'});
  await page.evaluate(()=>{const L=window.__LT,G=L.G,h=G.hero,f=[Math.cos(L.V3.yaw),Math.sin(L.V3.yaw)];G.markers.push({id:999,x:h.x-f[1]*6000,y:h.y+f[0]*6000,text:'Test marker'});G.waypoint=999;});
  await page.waitForTimeout(600);await page.screenshot({path:'/tmp/v3_arrow.png'});
  // the canyon bridge from the side, with a free camera
  if(br[3]){await page.evaluate(([x,y,a])=>{const L=window.__LT,G=L.G,c=L.heroCar();G.hero.x=x;G.hero.y=y;G.cam.x=x;G.cam.y=y;G.clock=Math.floor(G.clock/1440)*1440+10*60;},[br[3].x,br[3].y,br[3].a]);await settle(3500);
    await page.evaluate(([x,y,a])=>{const L=window.__LT,h=L.heightAt(x,y),k=9*40,px=x+Math.cos(a)*k,py=y+Math.sin(a)*k,nx=-Math.sin(a),ny=Math.cos(a);L.V3.camOverride={x:px+nx*420,y:h+90,z:py+ny*420,tx:px,ty:h-60,tz:py};},[br[3].x,br[3].y,br[3].a]);
    await page.waitForTimeout(800);await page.screenshot({path:'/tmp/v3_canyon_side.png'});await page.evaluate(()=>{window.__LT.V3.camOverride=null;});}
  console.log('hero on foot:',await page.evaluate(()=>!window.__LT.G.hero.inCar));
  // the map still opens in 2D and the 3D canvas hides; back to 2D in settings
  await page.locator('#mapBtn').tap();await page.waitForTimeout(600);console.log('map: 3D canvas hidden =',await page.evaluate(()=>getComputedStyle(document.getElementById('c3d')).display==='none'));await page.screenshot({path:'/tmp/v3_map.png'});
  await page.locator('#mapClose').tap();await page.waitForTimeout(400);
  // back to 2D from the Settings panel: the 3D canvas must hide and the 2D world draw again
  await page.locator('#pauseBtn').tap();await page.waitForTimeout(300);await page.locator('#sBtns button',{hasText:'Settings'}).tap();await page.waitForTimeout(300);
  await page.locator('#sBtns button',{hasText:'View: 3D'}).tap();await page.waitForTimeout(300);
  console.log('settings buttons now:',(await page.locator('#sBtns button').allTextContents()).join(' | '));
  await page.locator('#sBtns button',{hasText:'Back'}).tap();await page.waitForTimeout(300);await page.locator('#sBtns button',{hasText:'Resume'}).first().tap().catch(()=>{});await page.waitForTimeout(800);
  console.log('after switching to 2D: 3D canvas hidden =',await page.evaluate(()=>getComputedStyle(document.getElementById('c3d')).display==='none'),', saved setting =',await page.evaluate(()=>JSON.parse(localStorage.getItem('lastsurvivor.settings')).view));
  await page.screenshot({path:'/tmp/v3_back_to_2d.png'});
  console.log('errors:',errors.length?errors.join(' | '):'none');await b.close();})();
