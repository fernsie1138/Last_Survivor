// what an iPad in desktop mode can do: one tap arrives as a pointer press AND as a touch, both on the same button
const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const page=await ctx.newPage();
  await page.goto('file://'+__dirname+'/../dist/index.html');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
  await page.locator('#sBtns button',{hasText:'Start'}).first().tap();await page.waitForTimeout(200);await page.locator('#sBtns button',{hasText:'Head out'}).tap();await page.waitForTimeout(400);
  const res=await page.evaluate(()=>{const btn=[...document.querySelectorAll('#ctx button')].find(b=>b.textContent.startsWith('Get in'));const r=btn.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    btn.dispatchEvent(new PointerEvent('pointerdown',{pointerId:1,pointerType:'mouse',bubbles:true,cancelable:true,clientX:x,clientY:y}));
    const t=new Touch({identifier:1,target:btn,clientX:x,clientY:y});btn.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],targetTouches:[t],bubbles:true,cancelable:true}));
    btn.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[t],targetTouches:[],bubbles:true,cancelable:true}));return 'sent';});
  const trace=[];for(let i=0;i<6;i++){await page.waitForTimeout(100);trace.push(await page.evaluate(()=>window.__LT.G.hero.inCar?'in':'out'));}
  console.log('one tap delivered twice on Get in → in/out every 100 ms:',trace.join(' '));
  // stop, then a normal tap on Get out, also delivered twice
  await page.waitForTimeout(600);const r2=await page.evaluate(()=>{const btn=[...document.querySelectorAll('#ctx button')].find(b=>b.textContent.startsWith('Get out'));if(!btn)return 'no Get out button';
    const r=btn.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;btn.dispatchEvent(new PointerEvent('pointerdown',{pointerId:2,pointerType:'mouse',bubbles:true,cancelable:true,clientX:x,clientY:y}));
    const t=new Touch({identifier:2,target:btn,clientX:x,clientY:y});btn.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],targetTouches:[t],bubbles:true,cancelable:true}));
    btn.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[t],targetTouches:[],bubbles:true,cancelable:true}));return 'sent';});
  const tr2=[];for(let i=0;i<6;i++){await page.waitForTimeout(100);tr2.push(await page.evaluate(()=>window.__LT.G.hero.inCar?'in':'out'));}
  console.log('then Get out, delivered twice → in/out every 100 ms:',tr2.join(' '));
  // Sneak delivered twice should toggle once
  const sn=await page.evaluate(()=>{const btn=document.getElementById('bSneak'),r=btn.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    btn.dispatchEvent(new PointerEvent('pointerdown',{pointerId:3,pointerType:'mouse',bubbles:true,cancelable:true,clientX:x,clientY:y}));
    const t=new Touch({identifier:3,target:btn,clientX:x,clientY:y});btn.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],targetTouches:[t],bubbles:true,cancelable:true}));
    btn.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[t],targetTouches:[],bubbles:true,cancelable:true}));return window.__LT.G.hero.crouch;});
  console.log('Sneak tapped once (delivered twice) → sneaking:',sn);await b.close();})();
