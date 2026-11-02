// load the real page (the game and the test range) and make sure each starts: title buttons appear and no script errors
const {chromium,devices}=require('playwright');(async()=>{const b=await chromium.launch();
for(const [name,hash] of [['game',''],['test range','#testrange']]){const p=await (await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true})).newPage();
  const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/../dist/index.html'+hash);await p.waitForTimeout(1200);
  console.log(name+' title buttons:',(await p.locator('#sBtns button').allTextContents()).join(' | '),'| errors:',errs.join(' | ')||'none');}
await b.close();})();
