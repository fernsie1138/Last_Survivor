const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPad (gen 7) landscape'],hasTouch:true});const p=await ctx.newPage();await p.goto('about:blank');
  console.log(await p.evaluate(()=>{let o=window,chain=[];while(o){if(Object.prototype.hasOwnProperty.call(o,'ontouchstart'))chain.push((o.constructor&&o.constructor.name)||String(o));o=Object.getPrototypeOf(o);}return 'ontouchstart owned by: '+chain.join(', ');}));
  await p.addInitScript(()=>{let o=window;while(o){if(Object.prototype.hasOwnProperty.call(o,'ontouchstart')){try{delete o.ontouchstart;}catch(e){}}o=Object.getPrototypeOf(o);}});
  await p.goto('about:blank');console.log('after removing at the owner: in window =',await p.evaluate(()=>'ontouchstart' in window));await b.close();})();
