const {chromium,devices}=require('playwright');
(async()=>{
  let browser;try{browser=await chromium.launch();}catch(e){console.log('LAUNCH FAILED:',e.message.split('\n')[0]);process.exit(2);}
  const ctx=await browser.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.waitForTimeout(800);
  const vp=page.viewportSize();console.log('viewport',vp.width+'x'+vp.height);
  // start a fresh game and leave the intro panel
  await page.evaluate(()=>{localStorage.clear();});await page.reload();await page.waitForTimeout(800);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(300);
  await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(300);
  const st=()=>page.evaluate(()=>({state:window.__LT.state,stick:window.__LT.stick.active,hx:window.__LT.G.hero.x,hy:window.__LT.G.hero.y,inCar:!!window.__LT.G.hero.inCar,
    car:(()=>{const c=window.__LT.heroCar();return c?{x:c.x,y:c.y,speed:c.speed}:null;})()}));
  console.log('state after intro:',(await st()).state);
  // drag with a real touch pointer on the right side: CDP touch events become pointer events in the page
  const cdp=await ctx.newCDPSession(page);
  async function drag(x0,y0,dx,dy,ms){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0,id:1}]});
    const steps=Math.round(ms/50);for(let i=1;i<=steps;i++){const k=Math.min(1,i/4);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+dx*k,y:y0+dy*k,id:1}]});await page.waitForTimeout(50);}
    return async()=>cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  let a=await st();const end1=await drag(vp.width*0.75,vp.height*0.6,0,-60,1500);const mid=await st();await end1();await page.waitForTimeout(200);let b=await st();
  console.log('on foot: stick active while dragging =',mid.stick,', hero moved',Math.round(Math.hypot(b.hx-a.hx,b.hy-a.hy)),'px, stick released =',!b.stick);
  // a touch on the left side should NOT start the joystick (that's where the buttons live)
  const endL=await drag(vp.width*0.2,vp.height*0.45,0,-60,300);const left=await st();await endL();console.log('touch on left side starts joystick?',left.stick);
  // get in the car with the on-screen button, then steer and drive with the joystick
  await page.evaluate(()=>{const L=window.__LT,c=L.G.cars.find(c=>c.id==='hero0');L.G.hero.x=c.x-Math.sin(c.a)*34;L.G.hero.y=c.y+Math.cos(c.a)*34;});
  await page.waitForTimeout(200);const getIn=page.locator('#ctx button',{hasText:'Get in'});console.log('Get in button on the left:',await getIn.count()>0?Math.round((await getIn.boundingBox()).x)+'px from left':'missing');
  await getIn.dispatchEvent('pointerdown');await page.waitForTimeout(300);
  a=await st();const end2=await drag(vp.width*0.75,vp.height*0.6,0,-60,2500);const drv=await st();await end2();await page.waitForTimeout(100);
  console.log('in car:',a.inCar,'→ speed while pushing the stick',Math.round((drv.car?drv.car.speed:0)*0.36),'km/h, moved',drv.car?Math.round(Math.hypot(drv.car.x-a.car.x,drv.car.y-a.car.y)):0,'px');
  // brake button (left side) brings it to a stop
  const brake=page.locator('#bBrake');const bb=await brake.boundingBox();console.log('Brake button at',Math.round(bb.x)+'px from left,',Math.round(vp.height-bb.y-bb.height)+'px from bottom');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bb.x+bb.width/2,y:bb.y+bb.height/2,id:2}]});await page.waitForTimeout(2500);
  const stopped=await st();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});console.log('after holding Brake: speed',Math.round(stopped.car.speed*0.36),'km/h');
  // reverse button (left side): hold it and the car backs up
  const rv=page.locator('#bReverse');const rb=await rv.boundingBox();console.log('Reverse button at',Math.round(rb.x)+'px from left');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rb.x+rb.width/2,y:rb.y+rb.height/2,id:3}]});await page.waitForTimeout(1500);
  const rev=await page.evaluate(()=>window.__LT.heroCar().vf);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  console.log('holding Reverse: moving',rev<0?'backwards at '+Math.round(-rev*0.36)+' km/h':'NOT backwards ('+rev.toFixed(0)+')');
  // two thumbs at once: hold Reverse with the left while steering with the right
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rb.x+rb.width/2,y:rb.y+rb.height/2,id:4},{x:vp.width*0.75,y:vp.height*0.6,id:5}]});
  const a0=await page.evaluate(()=>window.__LT.heroCar().a);
  for(let i=0;i<20;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rb.x+rb.width/2,y:rb.y+rb.height/2,id:4},{x:vp.width*0.75+50,y:vp.height*0.6+40,id:5}]});await page.waitForTimeout(50);}
  const a1=await page.evaluate(()=>window.__LT.heroCar().a);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  console.log('reversing while steering with the other thumb: car turned',(Math.abs(a1-a0)*57.3).toFixed(0),'degrees');
  // both at once: steer with the right thumb while holding boost with the left
  // two-finger pinch: fingers move apart = zoom in, together = zoom out; Reset zoom appears and works
  const zoomOf=()=>page.evaluate(()=>window.__LT.SETTINGS.zoom);const cx=vp.width*0.6,cy=vp.height*0.5;
  async function pinchTo(d0,d1){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-d0,y:cy,id:7},{x:cx+d0,y:cy,id:8}]});
    for(let i=1;i<=10;i++){const d=d0+(d1-d0)*i/10;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-d,y:cy,id:7},{x:cx+d,y:cy,id:8}]});await page.waitForTimeout(30);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);}
  const z0=await zoomOf();await pinchTo(200,90);const zOut=await zoomOf();const btnShown=await page.locator('#zoomBtn').isVisible();
  const stickDuringPinch=await page.evaluate(()=>window.__LT.stick.active);
  console.log('pinch fingers together: zoom',z0,'→',zOut.toFixed(2),'(lower = see further); Reset zoom button visible:',btnShown,'; joystick stayed off:',!stickDuringPinch);
  await pinchTo(60,180);console.log('pinch fingers apart: zoom →',(await zoomOf()).toFixed(2));
  await page.locator('#zoomBtn').tap();await page.waitForTimeout(200);console.log('after tapping Reset zoom:',await zoomOf(),'; button hidden:',!(await page.locator('#zoomBtn').isVisible()));
  const sb=await page.locator('#stickBase').evaluate(e=>getComputedStyle(e).width);console.log('joystick base size:',sb);
  // (attacking while walking is covered by browser_fingers.js, which can lift one finger while the other stays down)
  console.log('page errors:',errors.length?errors.join(' | '):'none');
  await page.screenshot({path:'/mnt/user-data/outputs/touch-test.png'});await browser.close();
})();
