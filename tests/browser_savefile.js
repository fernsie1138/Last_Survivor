const {chromium,devices}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const errors=[];
  // ---- device A: play a bit, then Pause → Save game → Download a save file
  const ctxA=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true,acceptDownloads:true});const A=await ctxA.newPage();A.on('pageerror',e=>errors.push('A: '+e.message));
  await A.goto('file://'+__dirname+'/../dist/index.html');await A.evaluate(()=>localStorage.clear());await A.reload();await A.waitForTimeout(700);
  await A.locator('#sBtns button',{hasText:'Start'}).first().tap();await A.waitForTimeout(200);await A.locator('#sBtns button',{hasText:'Head out'}).tap();await A.waitForTimeout(300);
  await A.evaluate(()=>{const L=window.__LT,G=L.G;G.hero.inv={watch:3,hose:1};G.clock=2*1440+16*60;G.kills=5;G.markers.push({id:1,x:G.hero.x+3000,y:G.hero.y,text:'Dam'});G.markerSeq=2;});
  await A.locator('#pauseBtn').tap();await A.waitForTimeout(150);const [dl]=await Promise.all([A.waitForEvent('download'),A.locator('#sBtns button',{hasText:'Save to a file'}).tap()]);
  const path='/tmp/'+dl.suggestedFilename();await dl.saveAs(path);await A.waitForTimeout(200);
  console.log('device A downloaded:',dl.suggestedFilename(),'('+fs.statSync(path).size+' bytes) | screen says:',await A.locator('#sTitle').textContent());
  // ---- device B: brand new, nothing stored. Title → Load a save file → Open a save file
  const ctxB=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const B=await ctxB.newPage();B.on('pageerror',e=>errors.push('B: '+e.message));
  await B.goto('file://'+__dirname+'/../dist/index.html');await B.waitForTimeout(700);
  console.log('device B title buttons:',(await B.locator('#sBtns button').allTextContents()).join(' | '));
  await B.locator('#sBtns button',{hasText:'Load a save file'}).tap();await B.waitForTimeout(150);
  const [fc]=await Promise.all([B.waitForEvent('filechooser'),B.locator('#sBtns button',{hasText:'Open a save file'}).tap()]);await fc.setFiles(path);await B.waitForTimeout(500);
  console.log('device B after opening the file:',await B.evaluate(()=>{const G=window.__LT.G;return JSON.stringify({state:window.__LT.state,clock:window.__LT.fmtClock(G.clock),inv:G.hero.inv,kills:G.kills,markers:G.markers.map(m=>m.text)});}));
  // ---- device C: the paste route
  const ctxC=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const C=await ctxC.newPage();C.on('pageerror',e=>errors.push('C: '+e.message));
  await C.goto('file://'+__dirname+'/../dist/index.html');await C.waitForTimeout(700);await C.locator('#sBtns button',{hasText:'Load a save file'}).tap();await C.waitForTimeout(150);
  await C.locator('#sBtns button',{hasText:'Paste a save'}).tap();await C.waitForTimeout(150);await C.locator('#pasteText').fill(fs.readFileSync(path,'utf8'));
  await C.locator('#pasteLoad').tap();await C.waitForTimeout(400);
  console.log('device C after pasting:',await C.evaluate(()=>JSON.stringify({state:window.__LT.state,kills:window.__LT.G.kills,markers:window.__LT.G.markers.map(m=>m.text)})));
  // ---- and a wrong file on device C, mid-game
  fs.writeFileSync('/tmp/notasave.json','{"hello":"world"}');await C.locator('#pauseBtn').tap();await C.waitForTimeout(150);await C.locator('#sBtns button',{hasText:'Load a save file'}).tap();await C.waitForTimeout(150);
  const [fc2]=await Promise.all([C.waitForEvent('filechooser'),C.locator('#sBtns button',{hasText:'Open a save file'}).tap()]);await fc2.setFiles('/tmp/notasave.json');await C.waitForTimeout(400);
  console.log('wrong file:',await C.locator('#sTitle').textContent(),'—',await C.locator('#sSub').textContent(),'| game still has its kills:',await C.evaluate(()=>window.__LT.G.kills));
  console.log('page errors:',errors.length?errors.join(' | '):'none');await b.close();})();
