const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const p=await ctx.newPage();await p.goto('file:///tmp/pe.html');
  const c=await ctx.newCDPSession(p);const T=(type,pts)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
  const S={x:800,y:400,id:1},B={x:95,y:375,id:2};
  async function variant(name,release){await p.evaluate(()=>log=[]);await T('touchStart',[S]);await T('touchMove',[{...S,x:820}]);
    for(let k=0;k<3;k++){await T('touchStart',[{...S,x:820},B]);await release();}await T('touchEnd',[]);console.log(name.padEnd(34),(await p.evaluate(()=>log)).filter(x=>x.startsWith('pointer')).join(' '));}
  await variant('release via touchMove [stick only]',()=>T('touchMove',[{...S,x:820}]));
  await variant('release via touchEnd [stick only]',()=>T('touchEnd',[{...S,x:820}]));
  await variant('release via touchEnd [] then restart',async()=>{await T('touchEnd',[]);await T('touchStart',[{...S,x:820}]);});
  await b.close();})();
