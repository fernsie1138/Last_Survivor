const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const p=await ctx.newPage();
  await p.goto('file://'+__dirname+'/../dist/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(700);
  await p.locator('#sBtns button',{hasText:'Start'}).first().tap();await p.waitForTimeout(200);await p.locator('#sBtns button',{hasText:'Head out'}).tap();
  await p.evaluate(()=>{const L=window.__LT,h=L.G.hero;h.x+=900;h.y+=600;h.hp=72;h.inv={bat:1};h.weapon='bat';L.recruit({def:{id:'c_gunhand',comp:'gunhand'},x:h.x-50,y:h.y+30});
    for(const [dx,dy,w,hp] of [[90,-20,'knife',70],[120,50,'bat',30],[-110,-60,'revolver',55]]){const f=L.makeFoe({id:'s'+dx,weapon:w,post:{x:h.x,y:h.y},patrol:[{x:h.x,y:h.y}],seed:dx,brave:true},null,h.x+dx,h.y+dy);
      f.loose=true;f.state='alert';f.detect=1;f.lastSeen={x:h.x,y:h.y};f.cd=99;f.hp=hp;L.G.foes.push(f);}L.G.cam.x=h.x;L.G.cam.y=h.y;});
  await p.waitForTimeout(900);await p.screenshot({path:'/mnt/user-data/outputs/fight.png'});await b.close();})();
