/* ===== drawing ===== */
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
function drawRock(k){
  const n=k.pts.length;
  const path=(ox,oy,s)=>{ctx.beginPath();for(let i=0;i<n;i++){const a=k.rot+i/n*TAU,r=k.r*k.pts[i]*s;
    const x=k.x+ox+Math.cos(a)*r,y=k.y+oy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();};
  ctx.fillStyle='rgba(90,45,15,.28)';path(9,11,1);ctx.fill();
  ctx.fillStyle='#8c5a32';path(0,0,1);ctx.fill();
  ctx.fillStyle='#b07a46';path(-k.r*0.15,-k.r*0.18,0.66);ctx.fill();
  ctx.strokeStyle='rgba(60,30,12,.35)';ctx.lineWidth=2;path(0,0,1);ctx.stroke();
}
function drawWreck(w){ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.rot);
  ctx.fillStyle='rgba(90,45,15,.28)';rr(-w.w/2+7,-w.h/2+9,w.w,w.h,6);ctx.fill();
  ctx.fillStyle=w.burnt?'#3b2c24':'#6e3b22';rr(-w.w/2,-w.h/2,w.w,w.h,6);ctx.fill();
  ctx.fillStyle=w.burnt?'#211913':'#4a2516';rr(-w.w*0.18,-w.h/2+5,w.w*0.42,w.h-10,3);ctx.fill();
  ctx.strokeStyle='rgba(30,15,8,.45)';ctx.lineWidth=2;rr(-w.w/2,-w.h/2,w.w,w.h,6);ctx.stroke();ctx.restore();}
const GLASS='#1c2226',DARK='#1a1512';
function wheels(L,Wd,big,steer,tw){const wl=L*(big?0.26:0.22),ww=Wd*(big?0.34:0.28);
  [[L*0.3,-Wd/2,1],[L*0.3,Wd/2,1],[-L*0.3,-Wd/2,0],[-L*0.3,Wd/2,0]].forEach(([x,y,f],i)=>{const flat=tw&&tw[i]<=0;
    ctx.save();ctx.translate(x,y);if(f)ctx.rotate(steer*0.4);
    if(flat){ctx.fillStyle='#55504a';ctx.fillRect(-wl*0.4,-ww*0.35,wl*0.8,ww*0.7);ctx.fillStyle=DARK;ctx.fillRect(-wl/2,-ww/2,wl,ww*0.25);}   // a flat: rim showing, rubber sagging
    else{ctx.fillStyle=DARK;ctx.fillRect(-wl/2,-ww/2,wl,ww);}ctx.restore();});}
function drawVehicle(c){
  const d=c.def,L=d.len,Wd=d.wid,st=d.style,col=c.wrecked?'#2a211b':d.col;
  ctx.save();ctx.translate(c.x+6,c.y+8);ctx.rotate(c.a);ctx.fillStyle='rgba(80,40,12,.3)';
  if(st==='bike'){ctx.beginPath();ctx.ellipse(0,0,L/2,Wd/2+2,0,0,TAU);ctx.fill();}else{rr(-L/2,-Wd/2,L,Wd,5);ctx.fill();}ctx.restore();
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);
  if(st==='bike'){
    ctx.fillStyle=DARK;ctx.fillRect(L*0.28,-2.5,L*0.24,5);ctx.fillRect(-L/2,-2.5,L*0.26,5);
    ctx.fillStyle=col;rr(-L*0.3,-Wd/2,L*0.62,Wd,4);ctx.fill();
    ctx.fillStyle='#c9c2b5';ctx.fillRect(L*0.24,-Wd/2-3,3,Wd+6);
    if(c.driver==='hero'){ctx.fillStyle='#5a3f2a';ctx.beginPath();ctx.ellipse(-L*0.05,0,6,8,0,0,TAU);ctx.fill();
      ctx.fillStyle='#2b2420';ctx.beginPath();ctx.arc(L*0.04,0,4.5,0,TAU);ctx.fill();}
  } else {
    wheels(L,Wd,st==='cruiser'||st==='brute'||hasUp(c,'offroad'),c.steer,c.tw);
    if(st==='buggy'){
      ctx.fillStyle=col;rr(-L/2,-Wd/2+3,L,Wd-6,4);ctx.fill();
      ctx.strokeStyle='#2a1a10';ctx.lineWidth=2.5;ctx.strokeRect(-L*0.2,-Wd/2+4,L*0.36,Wd-8);
      ctx.beginPath();ctx.moveTo(-L*0.2,-Wd/2+4);ctx.lineTo(L*0.16,Wd/2-4);ctx.stroke();
      ctx.fillStyle='#d8cdb5';for(const y of [-Wd*0.3,0,Wd*0.3]){ctx.beginPath();ctx.moveTo(L/2,y-3);ctx.lineTo(L/2+9,y);ctx.lineTo(L/2,y+3);ctx.fill();}
    } else if(st==='brute'){
      ctx.fillStyle=col;rr(-L/2,-Wd/2,L,Wd,4);ctx.fill();
      ctx.fillStyle='#43352a';ctx.fillRect(-L*0.45,-Wd*0.38,L*0.55,Wd*0.76);
      ctx.strokeStyle='#2b2018';ctx.lineWidth=2;for(let i=0;i<4;i++){const x=-L*0.42+i*L*0.14;ctx.beginPath();ctx.moveTo(x,-Wd*0.38);ctx.lineTo(x,Wd*0.38);ctx.stroke();}
      ctx.fillStyle='#9c958a';ctx.beginPath();ctx.moveTo(L/2,-Wd/2-3);ctx.lineTo(L/2+10,0);ctx.lineTo(L/2,Wd/2+3);ctx.closePath();ctx.fill();
    } else {
      ctx.fillStyle=col;rr(-L/2,-Wd/2+2,L,Wd-4,6);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.12)';
      if(st==='coupe'){ctx.fillStyle=GLASS;rr(-L*0.16,-Wd/2+5,L*0.32,Wd-10,3);ctx.fill();
        ctx.fillStyle=col;rr(-L*0.08,-Wd/2+6,L*0.18,Wd-12,2);ctx.fill();
        if(!c.wrecked){ctx.fillStyle=d.trim;ctx.fillRect(-L/2+2,-2.5,L*0.32,5);ctx.fillRect(L*0.2,-2.5,L*0.28,5);
          ctx.fillStyle='#c9c2b5';rr(L*0.2,-5,L*0.2,10,2);ctx.fill();ctx.fillStyle='#8d877c';ctx.fillRect(L*0.24,-7,3,14);ctx.fillRect(L*0.31,-7,3,14);}
      } else if(st==='sedan'||st==='wagon'){
        const back=st==='wagon'?-L*0.44:-L*0.3;
        ctx.fillStyle=GLASS;rr(back,-Wd/2+4,L*0.12-back+L*0.06,Wd-8,3);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.14)';rr(back+L*0.05,-Wd/2+5,L*0.12-back-L*0.06,Wd-10,2);ctx.fill();
        ctx.fillStyle=col;ctx.globalAlpha=0.92;rr(back+L*0.05,-Wd/2+5,L*0.12-back-L*0.06,Wd-10,2);ctx.fill();ctx.globalAlpha=1;
        ctx.fillStyle=d.trim;ctx.fillRect(L/2-3,-Wd/2+3,2,Wd-6);ctx.fillRect(-L/2+1,-Wd/2+3,2,Wd-6);
      } else if(st==='ute'){
        ctx.fillStyle=GLASS;rr(-L*0.06,-Wd/2+4,L*0.24,Wd-8,3);ctx.fill();ctx.fillStyle=col;rr(-L*0.02,-Wd/2+5,L*0.12,Wd-10,2);ctx.fill();
        ctx.fillStyle='#4a3b2c';ctx.fillRect(-L/2+3,-Wd/2+4,L*0.42,Wd-8);
        ctx.strokeStyle='rgba(30,20,12,.6)';ctx.lineWidth=1.5;for(let i=1;i<4;i++){const x=-L/2+3+i*L*0.105;ctx.beginPath();ctx.moveTo(x,-Wd/2+4);ctx.lineTo(x,Wd/2-4);ctx.stroke();}
      } else if(st==='van'){
        ctx.fillStyle=GLASS;ctx.fillRect(L*0.14,-Wd/2+4,L*0.1,Wd-8);
        ctx.fillStyle='rgba(255,255,255,.1)';rr(-L/2+3,-Wd/2+4,L*0.66,Wd-8,3);ctx.fill();
        if(!c.wrecked){ctx.fillStyle=d.trim;ctx.fillRect(-L/2+4,-Wd/2+2,L*0.6,3);ctx.fillRect(-L/2+4,Wd/2-5,L*0.6,3);}
      } else if(st==='cruiser'){
        ctx.fillStyle=GLASS;ctx.fillRect(L*0.1,-Wd/2+4,L*0.08,Wd-8);
        ctx.fillStyle='rgba(0,0,0,.1)';rr(-L*0.4,-Wd/2+4,L*0.5,Wd-8,2);ctx.fill();
        ctx.strokeStyle=d.trim;ctx.lineWidth=2;for(let i=0;i<4;i++){const x=-L*0.36+i*L*0.12;ctx.beginPath();ctx.moveTo(x,-Wd/2+5);ctx.lineTo(x,Wd/2-5);ctx.stroke();}
        ctx.fillStyle=DARK;ctx.beginPath();ctx.arc(-L/2-3,0,7,0,TAU);ctx.fill();
        ctx.fillStyle='#6b6258';ctx.fillRect(L/2-2,-Wd/2+2,4,Wd-4);
      }
    }
  }
  // fitted upgrades show on the car
  if(c.ups&&st!=='bike'){
    if(c.ups.roobar){ctx.strokeStyle='#c9c2b5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(L/2+2,-Wd/2+1);ctx.lineTo(L/2+6,-Wd*0.2);ctx.lineTo(L/2+6,Wd*0.2);ctx.lineTo(L/2+2,Wd/2-1);ctx.stroke();
      ctx.beginPath();ctx.moveTo(L/2+6,-Wd*0.2);ctx.lineTo(L/2+2,0);ctx.lineTo(L/2+6,Wd*0.2);ctx.stroke();}
    if(c.ups.armour){ctx.fillStyle='rgba(85,80,74,.9)';ctx.fillRect(-L*0.3,-Wd/2-1,L*0.55,4);ctx.fillRect(-L*0.3,Wd/2-3,L*0.55,4);
      ctx.fillStyle='#3b3026';for(let i=0;i<4;i++){ctx.fillRect(-L*0.28+i*L*0.14,-Wd/2,2,2);ctx.fillRect(-L*0.28+i*L*0.14,Wd/2-2,2,2);}}
    if(c.ups.spikes){ctx.fillStyle='#d8cdb5';for(const [x,y] of [[L*0.3,-Wd/2],[L*0.3,Wd/2],[-L*0.3,-Wd/2],[-L*0.3,Wd/2]]){const s2=y<0?-1:1;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x,y+s2*8);ctx.lineTo(x+3,y);ctx.fill();}}
    if(c.ups.blower&&st!=='coupe'){ctx.fillStyle='#c9c2b5';rr(L*0.18,-5,L*0.2,10,2);ctx.fill();}
    if(c.ups.longtank){ctx.fillStyle='#5a3f2a';rr(-L/2-5,-Wd*0.3,6,Wd*0.6,2);ctx.fill();}}
  if(c.driver&&!c.wrecked&&st!=='bike'){if(c.braking||c.vf<-5){ctx.fillStyle='#ff3a2a';ctx.fillRect(-L/2-1,-Wd/2+3,3,5);ctx.fillRect(-L/2-1,Wd/2-8,3,5);}
    if(headlightsOn()){ctx.fillStyle='#fff3c4';ctx.fillRect(L/2-2,-Wd/2+3,3,5);ctx.fillRect(L/2-2,Wd/2-8,3,5);}}
  if(c.cond<100&&!c.wrecked){ctx.globalAlpha=(1-c.cond/100)*0.4;ctx.fillStyle='#3a2416';rr(-L/2,-Wd/2+2,L,Wd-4,5);ctx.fill();ctx.globalAlpha=1;}
  if(c.flash>0){ctx.globalAlpha=c.flash*0.6;ctx.fillStyle='#fff';rr(-L/2,-Wd/2,L,Wd,5);ctx.fill();ctx.globalAlpha=1;}
  ctx.restore();
  if(c.driver==='raider'&&c.wipe<=0&&c.stab<c.maxStab){const w=c.r*2;ctx.fillStyle='rgba(35,29,24,.6)';ctx.fillRect(c.x-w/2,c.y-c.r-15,w,5);
    ctx.fillStyle=c.stab<c.maxStab*0.35?'#c2381f':'#f2a03d';ctx.fillRect(c.x-w/2,c.y-c.r-15,w*Math.max(0,c.stab/c.maxStab),5);}
}
function drawHero(){const h=G.hero;if(h.inCar)return;
  ctx.fillStyle='rgba(80,40,12,.3)';ctx.beginPath();ctx.ellipse(h.x+3,h.y+4,9,7,0,0,TAU);ctx.fill();
  ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.a);
  const sw=Math.sin(h.walk)*(h.speed>10?(h.crouch?2.5:5):0);if(h.crouch)ctx.scale(0.85,0.85);
  ctx.fillStyle='#3b3026';ctx.fillRect(sw-3,-6,7,4);ctx.fillRect(-sw-3,2,7,4);
  {const W=heroWeapon();if(W!==WEAPONS.fists){ctx.strokeStyle=W.gun?'#1a1512':W===WEAPONS.bat?'#c9a35a':'#9c958a';ctx.lineWidth=W.gun?3:3;
    const sa=h.swing>0?(0.2-h.swing)*12-1.2:0;ctx.save();ctx.translate(4,9);ctx.rotate(sa);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(W.gun?16:14,W.gun?-2:4);ctx.stroke();ctx.restore();}}
  ctx.fillStyle='#5a3f2a';ctx.beginPath();ctx.ellipse(0,0,5.5,9,0,0,TAU);ctx.fill();
  ctx.fillStyle='#d9b48c';ctx.beginPath();ctx.arc(-sw*0.4,-10,2.6,0,TAU);ctx.arc(sw*0.4,10,2.6,0,TAU);ctx.fill();
  ctx.fillStyle='#d9b48c';ctx.beginPath();ctx.arc(1.5,0,4.6,0,TAU);ctx.fill();
  ctx.fillStyle='#3b2a1c';ctx.beginPath();ctx.arc(0,0,4.6,Math.PI*0.55,Math.PI*1.45);ctx.fill();
  if(h.flash>0){ctx.globalAlpha=h.flash*0.7;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.globalAlpha=1;}
  ctx.restore();
  if(h.swing>0.08){const W=heroWeapon();if(W.melee){ctx.strokeStyle='rgba(255,255,255,'+(h.swing*2.5).toFixed(2)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(h.x,h.y,W.range+8,h.a-W.arc/2,h.a+W.arc/2);ctx.stroke();}}}
function drawPickup(k){const bob=Math.sin(k.t*3)*2.5,pulse=0.5+0.5*Math.sin(k.t*4),it=ITEMS[k.item];
  ctx.strokeStyle='rgba(242,160,61,'+(0.25+pulse*0.35)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(k.x,k.y,20+pulse*5,0,TAU);ctx.stroke();
  ctx.fillStyle='rgba(80,40,12,.3)';ctx.beginPath();ctx.ellipse(k.x+4,k.y+8,11,5,0,0,TAU);ctx.fill();
  ctx.save();ctx.translate(k.x,k.y+bob);
  if(k.item==='jerrycan'){ctx.fillStyle='#c2381f';rr(-9,-12,18,24,3);ctx.fill();ctx.fillStyle='#7a1f10';ctx.fillRect(-9,-2,18,3);
    ctx.strokeStyle='#efe2c4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(6,6);ctx.moveTo(6,-6);ctx.lineTo(-6,6);ctx.stroke();
    ctx.fillStyle='#3a2f28';ctx.fillRect(3,-16,5,5);}
  else if(k.item==='tyre'){ctx.strokeStyle='#2b2420';ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.stroke();}
  else{ctx.fillStyle=it.icon;rr(-8,-8,16,16,3);ctx.fill();ctx.strokeStyle='rgba(30,20,12,.6)';ctx.lineWidth=1.5;rr(-8,-8,16,16,3);ctx.stroke();}
  ctx.restore();}
function drawBox(bx){const empty=bx.items&&invCount(bx.items)===0;
  ctx.save();ctx.translate(bx.x,bx.y);ctx.fillStyle='rgba(80,40,12,.3)';ctx.fillRect(-12,-8,30,22);
  if(bx.kind==='crate'){ctx.fillStyle=empty?'#7d6a56':'#a8793f';ctx.fillRect(-15,-11,30,22);ctx.strokeStyle='#5c3f1e';ctx.lineWidth=2;ctx.strokeRect(-15,-11,30,22);
    ctx.beginPath();ctx.moveTo(-15,-11);ctx.lineTo(15,11);ctx.moveTo(15,-11);ctx.lineTo(-15,11);ctx.stroke();}
  else if(bx.kind==='rubble'){for(const [x,y,w,col] of [[-12,-4,14,'#6b5a48'],[0,2,16,empty?'#5a4c3e':'#7a6a56'],[8,-8,12,'#5a4a3a'],[-4,8,10,'#4e4034']]){ctx.fillStyle=col;ctx.fillRect(x-w/2,y-w/3,w,w*0.66);}}
  else if(bx.kind==='locker'){ctx.fillStyle=empty?'#55504a':'#6f7a73';ctx.fillRect(-11,-15,22,30);ctx.strokeStyle='#2f332f';ctx.lineWidth=2;ctx.strokeRect(-11,-15,22,30);
    ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(0,15);ctx.stroke();ctx.fillStyle='#c9c2b5';ctx.fillRect(2,-2,3,5);}
  else if(bx.kind==='esky'){ctx.fillStyle=empty?'#8f8a80':'#e8e3d6';rr(-15,-10,30,20,4);ctx.fill();ctx.fillStyle='#2f6f9a';ctx.fillRect(-15,-10,30,6);
    ctx.fillStyle='#c9c2b5';ctx.fillRect(-6,-12,12,3);}
  else{ctx.fillStyle=empty?'#5e5141':'#7f6a48';ctx.beginPath();ctx.ellipse(0,0,13,10,0.3,0,TAU);ctx.fill();ctx.fillStyle='#4a3b2c';ctx.beginPath();ctx.arc(-6,-6,4,0,TAU);ctx.fill();}
  if(!empty){const p=0.5+0.5*Math.sin(G.time*4+bx.x);ctx.strokeStyle='rgba(242,160,61,'+(0.2+p*0.3)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,24+p*4,0,TAU);ctx.stroke();}
  ctx.restore();}
// world -> screen, honouring zoom and the optional rotating camera
function w2s(x,y){const dx=(x-G.cam.x)*ZOOM,dy=(y-G.cam.y)*ZOOM,c=Math.cos(G.camRot),s=Math.sin(G.camRot);return [W/2+dx*c-dy*s,H/2+dx*s+dy*c];}
function drawDecor(d){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.scale(d.s,d.s);
  switch(d.kind){
    case 'tire':ctx.strokeStyle='rgba(40,30,24,.75)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.stroke();break;
    case 'bone':ctx.strokeStyle='rgba(239,226,196,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(10,0);ctx.stroke();
      ctx.fillStyle='rgba(239,226,196,.8)';for(const x of [-10,10]){ctx.beginPath();ctx.arc(x,-2,2.5,0,TAU);ctx.arc(x,2,2.5,0,TAU);ctx.fill();}break;
    case 'spinifex':ctx.strokeStyle='rgba(140,128,58,.85)';ctx.lineWidth=2.5;ctx.beginPath();
      for(let i=0;i<7;i++){const a=i/7*TAU;ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*13,Math.sin(a)*13);}ctx.stroke();
      ctx.fillStyle='rgba(120,110,48,.8)';ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill();break;
    case 'mound':ctx.fillStyle='rgba(90,45,15,.28)';ctx.beginPath();ctx.ellipse(5,6,10,7,0,0,TAU);ctx.fill();
      ctx.fillStyle='#a45f30';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.fillStyle='#bf7a44';ctx.beginPath();ctx.arc(-2,-2,4.5,0,TAU);ctx.fill();break;
    case 'crack':ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();
      ctx.moveTo(-30,-8);ctx.lineTo(-8,-12);ctx.lineTo(10,-2);ctx.lineTo(32,-10);ctx.moveTo(-8,-12);ctx.lineTo(-4,14);ctx.lineTo(18,22);ctx.moveTo(10,-2);ctx.lineTo(6,16);ctx.stroke();break;
    case 'bush':ctx.fillStyle='rgba(90,45,15,.25)';ctx.beginPath();ctx.ellipse(6,7,15,10,0,0,TAU);ctx.fill();
      ctx.fillStyle='#6d7040';for(const [x,y,r] of [[-6,-3,8],[5,-5,7],[2,5,8],[-8,6,6]]){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
      ctx.fillStyle='#878b52';ctx.beginPath();ctx.arc(-2,-4,5,0,TAU);ctx.fill();break;
    case 'gum':ctx.fillStyle='rgba(60,35,15,.25)';ctx.beginPath();ctx.ellipse(8,9,22,15,0,0,TAU);ctx.fill();
      for(const [x,y,r,col] of [[-7,-4,13,'#5b6b36'],[8,-6,12,'#667a3e'],[2,7,13,'#56662f'],[-9,8,9,'#6d8245'],[11,6,9,'#5f7139']]){ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}
      ctx.fillStyle='rgba(255,255,220,.12)';ctx.beginPath();ctx.arc(-4,-7,7,0,TAU);ctx.fill();break;
    case 'grass':ctx.strokeStyle='rgba(150,150,85,.85)';ctx.lineWidth=2;ctx.beginPath();
      for(let i=-3;i<=3;i++){ctx.moveTo(i*3,6);ctx.quadraticCurveTo(i*4,-2,i*6,-9);}ctx.stroke();break;
  }
  ctx.restore();}
function drawRoads(x0,y0,x1,y1){
  const per=new Map();
  for(let cx=Math.floor(x0/CELL);cx<=Math.floor(x1/CELL);cx++)for(let cy=Math.floor(y0/CELL);cy<=Math.floor(y1/CELL);cy++){
    const arr=grid.get(gkey(cx,cy));if(!arr)continue;
    for(let k=0;k<arr.length;k+=2){let s=per.get(arr[k]);if(!s){s=[];per.set(arr[k],s);}s.push(arr[k+1]);}}
  const runs={highway:[],gravel:[],dirt:[]};
  for(const [ri,idx] of per){idx.sort((a,b)=>a-b);let s=idx[0],e=idx[0];
    for(let k=1;k<=idx.length;k++){const v=idx[k];if(v!==undefined&&v<=e+2){e=v;continue;}runs[roads[ri].cls].push([ri,Math.max(0,s-1),Math.min(roads[ri].n-1,e+2)]);s=e=v;}}
  const stroke=(list,w,col,dash)=>{if(!list.length)return;ctx.lineWidth=w;ctx.strokeStyle=col;
    for(const [ri,s,e] of list){const R=roads[ri];if(dash){ctx.setLineDash(dash);ctx.lineDashOffset=-R.cum[s];}
      ctx.beginPath();ctx.moveTo(R.xs[s],R.ys[s]);for(let i=s+1;i<=e;i++)ctx.lineTo(R.xs[i],R.ys[i]);ctx.stroke();}
    if(dash)ctx.setLineDash([]);};
  ctx.lineJoin='round';ctx.lineCap='round';
  // dirt tracks: two wheel ruts with a crown of loose dirt between them
  stroke(runs.dirt,80+20,'rgba(150,100,55,.22)');stroke(runs.dirt,80,'#a07c52');stroke(runs.dirt,34,'rgba(206,176,126,.55)');
  // gravel: pale and wide, loose edges, no markings
  stroke(runs.gravel,108+30,'rgba(150,100,55,.25)');stroke(runs.gravel,108,'#ab8f6a');stroke(runs.gravel,70,'rgba(196,172,134,.5)');
  // highway: sealed bitumen, edge lines and a broken centre line
  const hw=runs.highway,w=130;
  stroke(hw,w+34,'rgba(150,100,55,.32)');stroke(hw,w,'#5d5046');stroke(hw,w-12,'rgba(221,204,170,.55)');stroke(hw,w-18,'#5d5046');
  stroke(hw,w-46,'rgba(70,58,50,.35)');stroke(hw,4,'rgba(230,196,110,.6)',[46,64]);
  return runs;
}
function drawLocGround(o){
  ctx.fillStyle=o.type==='ruin'?'rgba(110,80,50,.18)':'rgba(120,82,45,.25)';ctx.beginPath();ctx.arc(o.x,o.y,o.type==='city'?760:o.rad*0.75,0,TAU);ctx.fill();
  const wr=o.rad-40;
  for(const w of o.wall){const x=o.x+Math.cos(w.a)*(wr+w.j),y=o.y+Math.sin(w.a)*(wr+w.j);
    ctx.save();ctx.translate(x,y);ctx.rotate(w.a+Math.PI/2);ctx.fillStyle='rgba(80,40,12,.3)';ctx.fillRect(-26+6,-9+8,52,18);
    ctx.fillStyle=w.c;ctx.fillRect(-26,-9,52,18);ctx.strokeStyle='rgba(30,18,10,.5)';ctx.lineWidth=2;ctx.strokeRect(-26,-9,52,18);ctx.restore();}}
const FLOOR={house:'#8a7258',shed:'#6d6052',pub:'#7a5a3e',garage:'#5c5650',clinic:'#a9a291',servo:'#6a6258',store:'#856b4e',warehouse:'#5f5a52',barn:'#6e5a44',office:'#8a8478'};
function drawBuildingBase(b){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot);const hw=b.w/2,hh=b.h/2;
  if(b.struct){drawStruct(b);ctx.restore();return;}
  if(b.tank){ctx.fillStyle='rgba(80,40,12,.3)';ctx.beginPath();ctx.arc(8,10,32,0,TAU);ctx.fill();ctx.fillStyle='#9c958a';ctx.beginPath();ctx.arc(0,0,30,0,TAU);ctx.fill();
    ctx.strokeStyle='#6d665d';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,21,0,TAU);ctx.stroke();ctx.fillStyle='#c2381f';ctx.fillRect(-6,-6,12,12);ctx.restore();return;}
  ctx.fillStyle='rgba(80,40,12,.3)';ctx.fillRect(-hw+8,-hh+10,b.w,b.h);
  ctx.fillStyle=b.ruined?'#5e4c3c':FLOOR[b.kind];ctx.fillRect(-hw,-hh,b.w,b.h);
  ctx.strokeStyle='rgba(0,0,0,.08)';ctx.lineWidth=1;for(let x=-hw+12;x<hw;x+=12){ctx.beginPath();ctx.moveTo(x,-hh);ctx.lineTo(x,hh);ctx.stroke();}
  for(const f of b.furn){switch(f.k){
    case 'bed':ctx.fillStyle='#4a3b2c';ctx.fillRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);ctx.fillStyle='#c9c2b5';ctx.fillRect(f.x-f.w/2+2,f.y-f.h/2+2,f.w-4,f.h*0.3);ctx.fillStyle='#7c3a2a';ctx.fillRect(f.x-f.w/2+2,f.y-f.h/2+f.h*0.35,f.w-4,f.h*0.6);break;
    case 'table':ctx.fillStyle='#6b4a32';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,TAU);ctx.fill();ctx.fillStyle='#4a3424';for(const a of [0,2.1,4.2]){ctx.beginPath();ctx.arc(f.x+Math.cos(a)*(f.r+7),f.y+Math.sin(a)*(f.r+7),4,0,TAU);ctx.fill();}break;
    case 'bar':ctx.fillStyle='#5a3f2a';ctx.fillRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);ctx.fillStyle='#8a6a48';ctx.fillRect(f.x-f.w/2,f.y-f.h/2,f.w,4);break;
    case 'shelf':ctx.fillStyle='#4e3a2c';ctx.fillRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);break;
    case 'bench':ctx.fillStyle='#6d665d';ctx.fillRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);ctx.fillStyle='#b8862f';ctx.fillRect(f.x-3,f.y-3,6,6);break;
    case 'crate':ctx.fillStyle='#8a6438';ctx.fillRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);ctx.strokeStyle='#5c3f1e';ctx.lineWidth=2;ctx.strokeRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);break;
    case 'bale':ctx.fillStyle='#c9a85a';ctx.fillRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);ctx.strokeStyle='#8a6e34';ctx.lineWidth=1.5;ctx.strokeRect(f.x-f.w/2,f.y-f.h/2,f.w,f.h);break;
    case 'hoist':ctx.fillStyle='#b8862f';ctx.fillRect(f.x-f.w/2,f.y-f.h/2,6,f.h);ctx.fillRect(f.x+f.w/2-6,f.y-f.h/2,6,f.h);break;
    case 'drum':ctx.fillStyle='#3f5a6a';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,TAU);ctx.fill();ctx.strokeStyle='#2a3d48';ctx.lineWidth=2;ctx.stroke();break;
    case 'rubble':ctx.fillStyle='#7d6a56';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,TAU);ctx.fill();break;}}
  // walls, with the door gap at the front
  ctx.fillStyle=b.ruined?'#4a3b2e':'#3b3026';const t=4,g=b.door/2;
  ctx.fillRect(-hw-t,-hh-t,b.w+2*t,2*t);ctx.fillRect(-hw-t,-hh,2*t,b.h+t);ctx.fillRect(hw-t,-hh,2*t,b.h+t);ctx.fillRect(-hw-t,hh-t,hw-g+t,2*t);ctx.fillRect(g,hh-t,hw-g+t,2*t);
  if(b.ruined){ctx.fillStyle=FLOOR.house;ctx.fillRect(hw*0.3,-hh-t,hw*0.35,2*t);}
  ctx.restore();}
const ROOF={house:'#8f8a80',shed:'#a39d92',pub:'#7c3a2a',garage:'#6b6258',clinic:'#c9c2b5',servo:'#8a3b1e',store:'#5f6b45',warehouse:'#7d7a72',barn:'#8a3a26',office:'#a39d92'};
function drawRoof(b){if(b.tank||b.roofA<=0.02)return;ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rot);ctx.globalAlpha=b.roofA;const hw=b.w/2+5,hh=b.h/2+5;
  if(b.ruined){ctx.fillStyle='#6d665d';ctx.beginPath();ctx.moveTo(-hw,-hh);ctx.lineTo(hw*0.4,-hh);ctx.lineTo(-hw*0.1,hh*0.2);ctx.lineTo(-hw,hh*0.6);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(30,20,12,.5)';ctx.lineWidth=2;ctx.stroke();}
  else if(b.kind==='warehouse'){ctx.fillStyle=ROOF.warehouse;ctx.fillRect(-hw,-hh,hw*2,hh*2);   // sawtooth roof: bands lit on one side
    for(let x=-hw;x<hw;x+=34){ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(x,-hh,16,hh*2);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x+16,-hh,4,hh*2);}
    ctx.strokeStyle='rgba(30,20,12,.55)';ctx.lineWidth=3;ctx.strokeRect(-hw,-hh,hw*2,hh*2);}
  else if(b.kind==='barn'){ctx.fillStyle=ROOF.barn;ctx.fillRect(-hw,-hh,hw*2,hh*2);ctx.fillStyle='rgba(255,220,180,.14)';ctx.fillRect(-hw,-hh,hw*2,hh*0.9);   // curved iron roof
    ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1.5;for(let y=-hh+9;y<hh;y+=9){ctx.beginPath();ctx.moveTo(-hw,y);ctx.lineTo(hw,y);ctx.stroke();}ctx.strokeStyle='rgba(30,20,12,.55)';ctx.lineWidth=3;ctx.strokeRect(-hw,-hh,hw*2,hh*2);}
  else{ctx.fillStyle=ROOF[b.kind];ctx.fillRect(-hw,-hh,hw*2,hh*2);ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(-hw,-hh,hw*2,hh);
    ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=1.5;for(let x=-hw+10;x<hw;x+=10){ctx.beginPath();ctx.moveTo(x,-hh);ctx.lineTo(x,hh);ctx.stroke();}
    ctx.strokeStyle='rgba(30,20,12,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-hw,0);ctx.lineTo(hw,0);ctx.stroke();ctx.strokeRect(-hw,-hh,hw*2,hh*2);}
  ctx.restore();ctx.globalAlpha=1;}
// ---- night ----
// how dark it is (0 = full day, ~0.8 = deep night) and the colour of the dark
function darkness(){const h=hourNow(),lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);
  if(h>=7&&h<17)return 0;if(h>=17&&h<19.5)return lerp(0,0.38,(h-17)/2.5);if(h>=19.5&&h<21)return lerp(0.38,0.8,(h-19.5)/1.5);
  if(h>=21||h<4.5)return 0.8;if(h<6)return lerp(0.8,0.3,(h-4.5)/1.5);return lerp(0.3,0,(h-6));}
function headlightsOn(){return darkness()>0.22;}
let nightCv=null,nightCtx=null;
function drawNight(){const dk=darkness();if(dk<=0.01)return;
  if(!nightCv){nightCv=document.createElement('canvas');nightCtx=nightCv.getContext('2d');}
  if(nightCv.width!==cv.width||nightCv.height!==cv.height){nightCv.width=cv.width;nightCv.height=cv.height;}
  const n=nightCtx,h=hourNow(),dusk=h>=16&&h<21?clamp(1-(h-19)/2,0,1):h>=4&&h<7?clamp((h-4.5)/1.5,0,1)*0.6:0;
  n.setTransform(DPR,0,0,DPR,0,0);n.globalCompositeOperation='source-over';
  const r=Math.round(10+dusk*50),g=Math.round(14+dusk*14),b=Math.round(34-dusk*20);n.clearRect(0,0,W,H);n.fillStyle='rgba('+r+','+g+','+b+','+dk.toFixed(3)+')';n.fillRect(0,0,W,H);
  // lights cut holes in the dark
  n.globalCompositeOperation='destination-out';
  const glow=(wx,wy,rad,str)=>{const [sx,sy]=w2s(wx,wy),R=rad*ZOOM;if(sx<-R||sx>W+R||sy<-R||sy>H+R)return;
    const gr=n.createRadialGradient(sx,sy,0,sx,sy,R);gr.addColorStop(0,'rgba(0,0,0,'+str+')');gr.addColorStop(1,'rgba(0,0,0,0)');n.fillStyle=gr;n.beginPath();n.arc(sx,sy,R,0,TAU);n.fill();};
  const beam=(c)=>{const fx=Math.cos(c.a),fy=Math.sin(c.a),ox=c.x+fx*c.r,oy=c.y+fy*c.r,[sx,sy]=w2s(ox,oy),R=(c.def.style==='bike'?330:430)*ZOOM,a=c.a+G.camRot,sp=0.42;
    const gr=n.createRadialGradient(sx,sy,0,sx,sy,R);gr.addColorStop(0,'rgba(0,0,0,0.95)');gr.addColorStop(0.6,'rgba(0,0,0,0.55)');gr.addColorStop(1,'rgba(0,0,0,0)');
    n.fillStyle=gr;n.beginPath();n.moveTo(sx,sy);n.arc(sx,sy,R,a-sp,a+sp);n.closePath();n.fill();glow(ox,oy,60,0.6);};
  const hero=G.hero;
  if(!hero.inCar)glow(hero.x,hero.y,110,0.75);   // moonlight: enough to see your feet
  for(const c of G.cars){if(c.dead||c.wrecked)continue;if(c.driver)beam(c);if(c.driver==='hero')glow(c.x,c.y,90,0.6);if(c.burn>0)glow(c.x,c.y,160,0.9);}
  for(const o of LOCS){if(Math.abs(o.x-G.cam.x)>3000||Math.abs(o.y-G.cam.y)>3000)continue;
    if(o.service)for(const bd of o.bld){if(bd.tank||!bd.doorOut)continue;glow(bd.doorOut.x,bd.doorOut.y,bd.kind==='pub'?190:130,bd.kind==='pub'?0.9:0.7);
      if(bd.roofA<0.5)glow(bd.x,bd.y,Math.max(bd.w,bd.h)*0.7,0.85);}
    if(o.fire&&!G.flags['camp_'+o.id])glow(o.fire.x,o.fire.y,230+Math.sin(G.time*9)*12,0.95);}
  let fires=0;for(const q of G.parts)if(q.kind==='fire'&&fires++<40)glow(q.x,q.y,q.size*5,0.7*Math.max(0,q.life/q.max));
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(nightCv,0,0);ctx.restore();
  // warm glow on top of the brightest lights
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const o of LOCS){if(!o.fire||G.flags['camp_'+o.id])continue;const [sx,sy]=w2s(o.fire.x,o.fire.y);const R=120*ZOOM;if(sx<-R||sx>W+R||sy<-R||sy>H+R)continue;
    const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,R);gr.addColorStop(0,'rgba(255,140,50,'+(0.35*dk).toFixed(3)+')');gr.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(sx,sy,R,0,TAU);ctx.fill();}
  ctx.restore();}
function drawCampfire(f){const t=G.time;ctx.fillStyle='#3b3026';for(let i=0;i<6;i++){const a=i/6*TAU;ctx.beginPath();ctx.arc(f.x+Math.cos(a)*16,f.y+Math.sin(a)*16,5,0,TAU);ctx.fill();}
  ctx.fillStyle='#ff8c3a';ctx.beginPath();ctx.arc(f.x,f.y,9+Math.sin(t*11)*2,0,TAU);ctx.fill();ctx.fillStyle='#ffd27a';ctx.beginPath();ctx.arc(f.x+Math.sin(t*7)*2,f.y,5+Math.sin(t*13),0,TAU);ctx.fill();}
function drawFoe(f){
  if(f.dead){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a+1.4);ctx.globalAlpha=Math.min(1,f.deadT/5);ctx.fillStyle='rgba(90,20,10,.35)';ctx.beginPath();ctx.ellipse(0,0,14,9,0,0,TAU);ctx.fill();
    ctx.fillStyle=f.look.shirt;ctx.fillRect(-9,-4,16,8);ctx.fillStyle=f.look.skin;ctx.beginPath();ctx.arc(10,0,4,0,TAU);ctx.fill();ctx.restore();ctx.globalAlpha=1;return;}
  ctx.fillStyle='rgba(80,40,12,.3)';ctx.beginPath();ctx.ellipse(f.x+3,f.y+4,8,6,0,0,TAU);ctx.fill();
  ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.a);const sw=Math.sin(f.walk)*(f.speed>5?4.5:0),L=f.look,W=WEAPONS[f.weapon];
  ctx.fillStyle='#2b2420';ctx.fillRect(sw-3,-5,6,3.5);ctx.fillRect(-sw-3,1.5,6,3.5);
  ctx.fillStyle=L.shirt;ctx.beginPath();ctx.ellipse(0,0,5.5,9,0,0,TAU);ctx.fill();ctx.fillStyle='#8d877c';ctx.fillRect(-2,-8,3,4);   // shoulder spikes
  ctx.fillStyle=L.skin;ctx.beginPath();ctx.arc(-sw*0.4,-9.5,2.5,0,TAU);ctx.arc(sw*0.4,9.5,2.5,0,TAU);ctx.fill();ctx.beginPath();ctx.arc(1,0,4.4,0,TAU);ctx.fill();
  if(L.hair==='mohawk'){ctx.fillStyle='#c2381f';ctx.fillRect(-3,-1,8,2);}else if(L.hair==='bandana'){ctx.fillStyle='#8f3a17';ctx.beginPath();ctx.arc(0,0,4.6,Math.PI*0.5,Math.PI*1.5);ctx.fill();}
  ctx.strokeStyle=W.gun?'#1a1512':'#9c958a';ctx.lineWidth=W.gun?3:2.5;const wl=f.wind>0?-6:0;ctx.beginPath();ctx.moveTo(4,9);ctx.lineTo(W.gun?20:14+wl,W.gun?7:12);ctx.stroke();
  if(f.flash>0){ctx.globalAlpha=f.flash*0.7;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.fill();ctx.globalAlpha=1;}
  ctx.restore();}
function drawFoeCone(f){if(f.dead||f.state==='flee')return;const r=sightRange(G.hero);ctx.fillStyle=f.state==='alert'?'rgba(194,56,31,.14)':f.detect>0.3?'rgba(242,160,61,.12)':'rgba(239,226,196,.08)';
  ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.arc(f.x,f.y,r,f.a-0.95,f.a+0.95);ctx.closePath();ctx.fill();}
function drawNPC(n){ctx.fillStyle='rgba(80,40,12,.3)';ctx.beginPath();ctx.ellipse(n.x+3,n.y+4,8,6,0,0,TAU);ctx.fill();
  ctx.save();ctx.translate(n.x,n.y);ctx.rotate(n.a);const sw=Math.sin(n.walk)*(n.speed>5?4:0),L=n.look;
  ctx.fillStyle='#3b3026';ctx.fillRect(sw-3,-5,6,3.5);ctx.fillRect(-sw-3,1.5,6,3.5);
  ctx.fillStyle=L.shirt;ctx.beginPath();ctx.ellipse(0,0,5,8.5,0,0,TAU);ctx.fill();
  ctx.fillStyle=L.skin;ctx.beginPath();ctx.arc(-sw*0.4,-9,2.4,0,TAU);ctx.arc(sw*0.4,9,2.4,0,TAU);ctx.fill();
  ctx.beginPath();ctx.arc(1,0,4.3,0,TAU);ctx.fill();if(L.hat){ctx.fillStyle=L.hat;ctx.beginPath();ctx.arc(0,0,6,0,TAU);ctx.fill();ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.arc(0,0,3.5,0,TAU);ctx.fill();}
  if(n.def.role==='guard'){ctx.strokeStyle='#2b2420';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(2,5);ctx.lineTo(12,5);ctx.stroke();}
  ctx.restore();}
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(state==='map'){drawMap();return;}
  ctx.fillStyle='#d39a5c';ctx.fillRect(0,0,W,H);
  const cam=G.cam,sh=G.shake;
  ctx.save();ctx.translate(W/2+rand(-sh,sh)*0.5,H/2+rand(-sh,sh)*0.5);ctx.rotate(G.camRot);ctx.scale(ZOOM,ZOOM);ctx.translate(-cam.x,-cam.y);
  const rad=Math.hypot(W,H)/2/ZOOM+140,x0=cam.x-rad,x1=cam.x+rad,y0=cam.y-rad,y1=cam.y+rad;
  const vis=[];for(let i=Math.floor(x0/CH);i<=Math.floor(x1/CH);i++)for(let j=Math.floor(y0/CH);j<=Math.floor(y1/CH);j++)vis.push(getChunk(i,j));
  for(const c of vis){const ox=c.cx*CH,oy=c.cy*CH;for(let i=0;i<4;i++)for(let j=0;j<4;j++){ctx.fillStyle=c.cells[i*4+j];ctx.fillRect(ox+i*160-0.5,oy+j*160-0.5,161,161);}}
  for(const c of vis)for(const q of c.patches){ctx.fillStyle=q.light?c.biome.light:c.biome.dark;ctx.beginPath();ctx.ellipse(q.x,q.y,q.rx,q.ry,q.rot,0,TAU);ctx.fill();}
  ctx.strokeStyle='rgba(120,70,30,.14)';ctx.lineWidth=3;ctx.lineCap='round';
  for(const c of vis)for(const r of c.ripples){const dx=Math.cos(r.rot)*r.len/2,dy=Math.sin(r.rot)*r.len/2;
    ctx.beginPath();ctx.moveTo(r.x-dx,r.y-dy);ctx.quadraticCurveTo(r.x-dy*0.1,r.y-r.bend,r.x+dx,r.y+dy);ctx.stroke();}
  // terrain: hill shading, rivers, creek beds, canyons, mountains, mesas, cuttings
  // build at most a couple of terrain layers a frame (nearest first), so driving into new country doesn't stutter
  ctx.imageSmoothingEnabled=true;{const t0=performance.now(),camX=G.cam.x,camY=G.cam.y,need=vis.filter(c=>!c.ov).sort((a,b)=>Math.hypot(a.cx*CH+CH/2-camX,a.cy*CH+CH/2-camY)-Math.hypot(b.cx*CH+CH/2-camX,b.cy*CH+CH/2-camY));
    for(let k=0;k<need.length&&(k<1||performance.now()-t0<4);k++)buildOverlayFor(need[k]);
    // then, with any time to spare, get ahead: the ring of chunks just beyond the edge of the screen
    if(performance.now()-t0<3){const x0c=Math.floor(x0/CH)-1,x1c=Math.floor(x1/CH)+1,y0c=Math.floor(y0/CH)-1,y1c=Math.floor(y1/CH)+1;
      outer:for(let gy=y0c;gy<=y1c;gy++)for(let gx=x0c;gx<=x1c;gx++){if(gy>y0c&&gy<y1c&&gx>x0c&&gx<x1c)continue;const c=chunks.get(gx+','+gy);if(c&&!c.ov){buildOverlayFor(c);if(performance.now()-t0>4)break outer;}}}}
  for(const c of vis)if(c.ov&&c.ov!==EMPTY_OV)ctx.drawImage(c.ov,c.cx*CH,c.cy*CH,CH,CH);
  const locs=LOCS.filter(o=>o.x>x0-o.rad&&o.x<x1+o.rad&&o.y>y0-o.rad&&o.y<y1+o.rad);
  for(const o of locs)drawTownGround(o);
  const roadRuns=drawRoads(x0,y0,x1,y1);drawBridges(roadRuns);
  drawMesas(x0,y0,x1,y1);
  drawShells(x0,y0,x1,y1);
  ctx.fillStyle='rgba(222,184,120,.75)';
  for(const c of vis)for(const q of c.drifts){ctx.beginPath();ctx.ellipse(q.x,q.y,q.rx,q.ry,q.rot,0,TAU);ctx.fill();}
  ctx.lineWidth=5;
  for(const t of G.tracks){ctx.strokeStyle='rgba(70,45,25,'+(t.al*(1-t.age/9)).toFixed(3)+')';ctx.beginPath();ctx.moveTo(t.a,t.b);ctx.lineTo(t.c,t.d);ctx.stroke();}
  for(const o of locs){drawLocGround(o);for(const bd of o.bld)drawBuildingBase(bd);if(o.fire&&!G.flags['camp_'+o.id])drawCampfire(o.fire);}
  for(const c of vis)for(const d of c.decor)drawDecor(d);
  for(const q of G.parts)if(q.kind==='dust'){ctx.globalAlpha=Math.max(0,q.life/q.max)*0.5;ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,TAU);ctx.fill();}
  ctx.globalAlpha=1;
  for(const bx of G.boxes)if(bx.x>x0&&bx.x<x1&&bx.y>y0&&bx.y<y1)drawBox(bx);
  for(const k of G.pickups)drawPickup(k);
  for(const c of vis){for(const w of c.wrecks)drawWreck(w);for(const k of c.rocks)drawRock(k);}
  for(const c of G.cars)if(c.x>x0-80&&c.x<x1+80&&c.y>y0-80&&c.y<y1+80)drawVehicle(c);
  for(const m of G.markers){if(m.x<x0||m.x>x1||m.y<y0||m.y>y1)continue;   // your markers stand as flags on the ground
    ctx.fillStyle='rgba(80,40,12,.3)';ctx.beginPath();ctx.ellipse(m.x+4,m.y+3,6,3,0,0,TAU);ctx.fill();ctx.strokeStyle='#3b3026';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x,m.y-46);ctx.stroke();
    const wv=Math.sin(G.time*3+m.id)*3;ctx.fillStyle=G.waypoint===m.id?'#f2a03d':'#c2381f';ctx.beginPath();ctx.moveTo(m.x,m.y-46);ctx.lineTo(m.x+26,m.y-40+wv);ctx.lineTo(m.x,m.y-32);ctx.closePath();ctx.fill();}
  for(const a of G.animals)if(a.x>x0-40&&a.x<x1+40&&a.y>y0-40&&a.y<y1+40)drawAnimal(a);
  for(const n of G.npcs)if(n.x>x0&&n.x<x1&&n.y>y0&&n.y<y1)drawNPC(n);
  if(G.hero.crouch&&!G.hero.inCar)for(const f of G.foes)if(Math.hypot(f.x-G.hero.x,f.y-G.hero.y)<600)drawFoeCone(f);
  for(const f of G.foes)if(f.x>x0&&f.x<x1&&f.y>y0&&f.y<y1)drawFoe(f);
  if(G.comp&&!G.comp.inCar){const p=G.comp;
    if(p.state==='down'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a+1.4);ctx.fillStyle=p.look.shirt;ctx.fillRect(-9,-4,16,8);ctx.fillStyle=p.look.skin;ctx.beginPath();ctx.arc(10,0,4,0,TAU);ctx.fill();ctx.restore();
      ctx.strokeStyle='rgba(194,56,31,'+(0.5+0.4*Math.sin(G.time*6)).toFixed(2)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,20,0,TAU);ctx.stroke();}
    else{ctx.strokeStyle='rgba(185,210,122,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,14,0,TAU);ctx.stroke();drawNPC(p);
      if(p.flash>0){ctx.globalAlpha=p.flash*0.7;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y,9,0,TAU);ctx.fill();ctx.globalAlpha=1;}}}
  drawHero();
  for(const o of locs)for(const bd of o.bld)drawRoof(bd);
  for(const q of G.parts){if(q.kind==='dust')continue;const a=Math.max(0,q.life/q.max);
    if(q.kind==='spark'){ctx.strokeStyle=q.col;ctx.globalAlpha=a;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x-q.vx*0.03,q.y-q.vy*0.03);ctx.stroke();}
    else if(q.kind==='smoke'){ctx.globalAlpha=a*0.55;ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,TAU);ctx.fill();}
    else{ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.fillStyle=a>0.5?q.col:'#c2381f';ctx.beginPath();ctx.arc(q.x,q.y,q.size,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over';}}
  ctx.globalAlpha=1;
  ctx.lineWidth=2.5;for(const b of G.bullets){const l=Math.hypot(b.vx,b.vy);ctx.strokeStyle=b.owner==='hero'?'#ffe08a':'#ff7a4a';ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx/l*16,b.y-b.vy/l*16);ctx.stroke();}
  ctx.restore();
  drawNight();   // darkness goes over the world but under the labels, so text stays readable
  // labels are drawn upright in screen space so they stay readable when the world turns
  ctx.textAlign='center';
  const label=(wx,wy,t,font,col)=>{const [sx,sy]=w2s(wx,wy);if(sx<-200||sx>W+200||sy<-50||sy>H+50)return;ctx.font=font;
    ctx.fillStyle='rgba(35,29,24,.6)';ctx.fillText(t,sx+2,sy+2);ctx.fillStyle=col;ctx.fillText(t,sx,sy);};
  for(const o of locs)label(o.x,o.y-o.rad*0.62-30,o.name,'400 '+Math.round((o.type==='city'?40:o.type==='outpost'?32:24)*Math.max(0.7,ZOOM))+'px "Saira Stencil One", Impact, sans-serif',o.type==='ruin'?'#d8cdb5':'#efe2c4');
  if(state==='play'&&!G.hero.inCar){const c=nearestCar(160);if(c)label(c.x,c.y-c.r-14,c.def.name,'700 17px "Barlow Condensed", Arial, sans-serif','#efe2c4');
    for(const n of G.npcs){const d=Math.hypot(n.x-G.hero.x,n.y-G.hero.y);const hidden=n.loc.bld.some(bd=>!bd.tank&&bd.roofA>0.5&&bInside(bd,n.x,n.y,0));
      if(d<170&&!hidden)label(n.x,n.y-18,n.def.name+', '+ROLE_LABEL[n.def.role],'700 15px "Barlow Condensed", Arial, sans-serif','#efe2c4');}}
  // raider awareness: a filling ? while they're suspicious, a red ! once they've spotted you
  for(const f of G.foes){if(f.dead||f.state==='flee')continue;const [sx,sy]=w2s(f.x,f.y-46);if(sx<0||sx>W||sy<0||sy>H)continue;
    if(f.state==='alert'){ctx.font='400 22px "Saira Stencil One", Impact, sans-serif';ctx.fillStyle='#c2381f';ctx.fillText('!',sx,sy);}
    else if(f.detect>0.05){ctx.strokeStyle='rgba(35,29,24,.6)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(sx,sy-6,9,0,TAU);ctx.stroke();
      ctx.strokeStyle='#f2a03d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy-6,9,-Math.PI/2,-Math.PI/2+TAU*f.detect);ctx.stroke();
      ctx.font='700 13px "Barlow Condensed", Arial, sans-serif';ctx.fillStyle='#f2a03d';ctx.fillText('?',sx,sy-1);}}
  for(const m of G.markers)label(m.x+8,m.y-54,m.text,'700 17px "Barlow Condensed", Arial, sans-serif',G.waypoint===m.id?'#f2a03d':'#efe2c4');
  if(G.comp&&!G.comp.inCar)label(G.comp.x,G.comp.y-40,G.comp.def.name+(G.comp.state==='down'?' (down)':''),'700 15px "Barlow Condensed", Arial, sans-serif',G.comp.state==='down'?'#ff7a5a':'#b9d27a');
  // health bars: every raider on foot, you (on foot), and your companion
  const hbar=(wx,wy,frac,col,w)=>{const [sx,sy]=w2s(wx,wy);if(sx<-40||sx>W+40||sy<-40||sy>H+40)return;w=w||30;
    ctx.fillStyle='rgba(20,15,12,.7)';ctx.fillRect(sx-w/2-1,sy-1,w+2,6);ctx.fillStyle=col;ctx.fillRect(sx-w/2,sy,w*clamp(frac,0,1),4);};
  for(const f of G.foes){if(f.dead)continue;const fr=f.hp/f.maxHp;hbar(f.x,f.y-34,fr,fr<0.35?'#ff5a3a':'#e0603a');}
  if(!G.hero.inCar)hbar(G.hero.x,G.hero.y-30,G.hero.hp/100,G.hero.hp<30?'#ff5a3a':'#b9d27a',34);
  if(G.comp&&!G.comp.inCar&&G.comp.state!=='down')hbar(G.comp.x,G.comp.y-34,G.comp.hp/G.comp.maxHp,'#8fd0c0');
  for(const t of G.texts){ctx.globalAlpha=Math.min(1,t.life*2);label(t.x,t.y,t.t,'700 20px "Barlow Condensed", Arial, sans-serif',t.col);}
  ctx.globalAlpha=1;
  ctx.fillStyle=heat;ctx.globalAlpha=1-darkness();ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
  if(G.hurt>0){ctx.fillStyle='rgba(194,56,31,'+(G.hurt*0.3).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
  if(G.hero.rest<20){const k=(20-G.hero.rest)/20*(0.55+0.25*Math.sin(G.time*1.7));const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.15,W/2,H/2,Math.max(W,H)*0.6);
    g.addColorStop(0,'rgba(10,6,4,0)');g.addColorStop(1,'rgba(10,6,4,'+k.toFixed(3)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  if(state==='play')drawGuide();
}
function edgeArrow(wx,wy,label,col){
  const [sx,sy]=w2s(wx,wy);if(sx>40&&sx<W-40&&sy>150&&sy<H-40)return;
  const a=Math.atan2(sy-H/2,sx-W/2),m=60,ex=clamp(W/2+Math.cos(a)*W,m,W-m),ey=clamp(H/2+Math.sin(a)*H,m+110,H-m);
  ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.globalAlpha=0.6+0.4*Math.sin(G.time*6);ctx.fillStyle=col;ctx.strokeStyle='#efe2c4';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-10,-12);ctx.lineTo(-4,0);ctx.lineTo(-10,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  ctx.globalAlpha=1;ctx.font='700 15px "Barlow Condensed", Arial, sans-serif';ctx.textAlign='center';ctx.fillStyle='#efe2c4';
  ctx.fillText(label,ex-Math.cos(a)*36,ey-Math.sin(a)*36+5);}
function drawGuide(){const b=body(),h=G.hero;
  const wp=G.waypoint!=null?G.markers.find(m=>m.id===G.waypoint):null;if(wp)edgeArrow(wp.x,wp.y,wp.text+', '+km(Math.hypot(wp.x-b.x,wp.y-b.y)).toFixed(1)+' km','#f2a03d');
  if(G.leg&&!G.onLeg&&G.legNear)edgeArrow(G.legNear.x,G.legNear.y,'road','#f2a03d');
  if(!h.inCar){const lc=carById(G.lastCar);if(lc&&!lc.wrecked)edgeArrow(lc.x,lc.y,'your car','#efe2c4');}
}
// ---- world map ----
let mapImg=null;
const MAP_BIOME={red:[154,90,52],salt:[201,191,174],mallee:[141,122,74],ranges:[122,69,41],coast:[182,156,108]};
function buildMapImage(){const RES=Math.max(25,Math.round(WX*2/400)),w=Math.ceil(WX*2/RES),h=Math.ceil(WY*2/RES);
  const cnv=document.createElement('canvas');cnv.width=w;cnv.height=h;const c2=cnv.getContext('2d');const img=c2.createImageData(w,h);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const x=-WX+(i+0.5)*RES,y=-WY+(j+0.5)*RES,lv=landValue(x,y),k=(j*w+i)*4;
    let col=lv<0?[31,44,48]:MAP_BIOME[zoneAt(x,y).biome];if(lv>=0&&lv<0.015)col=[214,190,140];
    if(lv>=0){const f=terrainFactors(x,y),tt=terrainRaw(x,y,f);   // features too narrow for a map pixel are widened so you can see them
      const rv=ridge(nRiv,x,y,70000,3),cv=f.can>0.3&&fbm(nCanM,x/90000,y/90000,2)>0.56?ridge(nCan,x,y,45000,3):0;
      if(rv>0.985)col=fbm(nRivF,x/90000,y/90000,2)>f.flow?[79,138,168]:[201,180,138];else if(cv>0.985)col=[42,29,22];}
    if(img.data){img.data[k]=col[0];img.data[k+1]=col[1];img.data[k+2]=col[2];img.data[k+3]=255;}}
  // every mesa and butte, listed once, so the map can draw each one crisply at any zoom
  allMesas=[];for(let j=Math.floor(-WY/MESA_CELL);j<=Math.ceil(WY/MESA_CELL);j++)for(let i=Math.floor(-WX/MESA_CELL);i<=Math.ceil(WX/MESA_CELL);i++){
    if(terrainFactors((i+0.5)*MESA_CELL,(j+0.5)*MESA_CELL).mesa<=0)continue;const m=mesaAt(i,j);if(m)allMesas.push(m);}
  c2.putImageData(img,0,0);return cnv;}
function drawMap(){
  if(!mapImg)mapImg=buildMapImage();
  ctx.fillStyle='#1f2c30';ctx.fillRect(0,0,W,H);
  const sc=mapView.sc,X=x=>W/2+(x-mapView.cx)*sc,Y=y=>H/2+(y-mapView.cy)*sc;
  ctx.imageSmoothingEnabled=true;ctx.drawImage(mapImg,X(-WX),Y(-WY),WX*2*sc,WY*2*sc);
  ctx.lineCap='round';ctx.lineJoin='round';
  // roads you know about (at least one end known)
  const zoom=sc*WX;
  roads.forEach(R=>{if(!G.known.has(R.a)&&!G.known.has(R.b))return;
    ctx.strokeStyle=R.cls==='highway'?'rgba(239,226,196,.9)':R.cls==='gravel'?'rgba(239,226,196,.6)':'rgba(239,226,196,.45)';
    ctx.lineWidth=R.cls==='highway'?3:R.cls==='gravel'?2:1.5;if(R.cls==='dirt')ctx.setLineDash([5,4]);
    const step=zoom>2500?1:zoom>1200?2:4;ctx.beginPath();ctx.moveTo(X(R.sx[0]),Y(R.sy[0]));for(let i=step;i<R.sx.length;i+=step)ctx.lineTo(X(R.sx[i]),Y(R.sy[i]));
    ctx.lineTo(X(R.sx[R.sx.length-1]),Y(R.sy[R.sy.length-1]));ctx.stroke();ctx.setLineDash([]);});
  // planned route
  if(G.dest!==null){const p=routePath(G.lastNode,G.dest);if(p){ctx.strokeStyle='#f2a03d';ctx.lineWidth=5;
    for(const L of p.legs){const R=roads[L.road];ctx.beginPath();ctx.moveTo(X(R.sx[0]),Y(R.sy[0]));for(let i=1;i<R.sx.length;i++)ctx.lineTo(X(R.sx[i]),Y(R.sy[i]));ctx.stroke();}}}
  // zone names when zoomed out
  if(zoom<1600){ctx.font='italic 500 '+Math.round(clamp(zoom/45,14,22))+'px "Barlow Condensed", Arial, sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(239,226,196,.45)';
    for(const z of ZONES)if(!z.coast)ctx.fillText(z.name,X(z.x),Y(z.y));}
  // places
  for(const l of LOCS){if(!G.known.has(l.id))continue;const x=X(l.x),y=Y(l.y);if(x<-60||x>W+60||y<-60||y>H+60)continue;
    const seen=G.visited.has(l.id),sel=mapSel===l.id;
    ctx.strokeStyle=l.faction==='fuelkings'?'#ff9d5c':'#efe2c4';ctx.lineWidth=2;ctx.fillStyle=seen?'#f2a03d':'#2a221c';
    if(l.type==='city'){ctx.fillRect(x-7,y-7,14,14);ctx.strokeRect(x-7,y-7,14,14);}
    else if(l.type==='outpost'){ctx.beginPath();ctx.arc(x,y,6,0,TAU);ctx.fill();ctx.stroke();}
    else{const camp=l.camp&&!G.flags['camp_'+l.id];ctx.beginPath();ctx.moveTo(x-5,y-5);ctx.lineTo(x+5,y+5);ctx.moveTo(x+5,y-5);ctx.lineTo(x-5,y+5);ctx.strokeStyle=camp?'#ff5a3a':seen?'#f2a03d':'#d8cdb5';ctx.lineWidth=camp?3:2;ctx.stroke();ctx.lineWidth=2;}
    if(l.goal){ctx.strokeStyle='#efe2c4';ctx.beginPath();ctx.arc(x,y,15,0,TAU);ctx.stroke();}
    if(sel){ctx.strokeStyle='#f2a03d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,20,0,TAU);ctx.stroke();}
    const show=l.type==='city'||sel||(l.type==='outpost'&&zoom>900)||(l.type==='ruin'&&zoom>2200);
    if(show){ctx.font=(l.type==='city'?'700 20px':'700 16px')+' "Barlow Condensed", Arial, sans-serif';ctx.textAlign='center';
      ctx.fillStyle='rgba(20,15,12,.7)';ctx.fillText(l.name,x+1,y+(l.type==='city'?26:22)+1);ctx.fillStyle='#efe2c4';ctx.fillText(l.name,x,y+(l.type==='city'?26:22));}}
  drawMapMesas(X,Y,mapView.sc);
  for(const m of G.markers){const x=X(m.x),y=Y(m.y);if(x<-60||x>W+60||y<-60||y>H+60)continue;const sel=mapMarker===m.id,guide=G.waypoint===m.id;
    ctx.strokeStyle='#efe2c4';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-20);ctx.stroke();
    ctx.fillStyle=guide?'#f2a03d':'#c2381f';ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(x+14,y-15);ctx.lineTo(x,y-10);ctx.closePath();ctx.fill();
    if(sel){ctx.strokeStyle='#f2a03d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y-12,18,0,TAU);ctx.stroke();}
    ctx.font='700 16px "Barlow Condensed", Arial, sans-serif';ctx.textAlign='left';ctx.fillStyle='rgba(20,15,12,.7)';ctx.fillText(m.text,x+17,y-11);ctx.fillStyle='#efe2c4';ctx.fillText(m.text,x+16,y-12);}
  if(mapDrop){const x=X(mapDrop.x),y=Y(mapDrop.y);ctx.strokeStyle='#f2a03d';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,10,0,TAU);ctx.moveTo(x-16,y);ctx.lineTo(x+16,y);ctx.moveTo(x,y-16);ctx.lineTo(x,y+16);ctx.stroke();}
  const lc=carById(G.lastCar);
  if(lc&&!G.hero.inCar&&!lc.wrecked){ctx.fillStyle='#efe2c4';ctx.fillRect(X(lc.x)-4,Y(lc.y)-4,8,8);}
  const b=body();ctx.save();ctx.translate(X(b.x),Y(b.y));ctx.rotate(b.a);ctx.fillStyle='#efe2c4';ctx.strokeStyle='#c2381f';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(-8,-9);ctx.lineTo(-4,0);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  // title and scale bar
  ctx.font='400 32px "Saira Stencil One", Impact, sans-serif';ctx.textAlign='left';ctx.fillStyle='#f2a03d';ctx.fillText('The wasteland',22,48);
  const kmPx=10000*sc,kms=[1,2,5,10,20,50].find(k=>k*kmPx>70)||50;
  ctx.fillStyle='#efe2c4';ctx.fillRect(22,64,kms*kmPx,4);ctx.font='700 15px "Barlow Condensed", Arial, sans-serif';ctx.fillText(kms+' km',22,86);
}

// ---- terrain layer for one chunk: drawn once, pixel by pixel at quarter resolution, and reused ----
// Each pixel blends the four nearest terrain cells, so edges come out as smooth curves rather than 32 px steps.
function pnoise(x,y){let h=(x*374761393+y*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function extTerrain(c){const E=TN+2,ext=new Uint8Array(E*E);
  for(let j=-1;j<=TN;j++)for(let i=-1;i<=TN;i++){let t;
    if(i>=0&&j>=0&&i<TN&&j<TN)t=c.terr[j*TN+i];
    else{const ncx=c.cx+(i<0?-1:i>=TN?1:0),ncy=c.cy+(j<0?-1:j>=TN?1:0),nc=getChunk(ncx,ncy);t=nc.terr[((j+TN)%TN)*TN+((i+TN)%TN)];}
    ext[(j+1)*E+(i+1)]=t;}return ext;}
const EMPTY_OV={};
function buildOverlayFor(c){c.ov=buildOverlay(c);}
function buildOverlay(c){const P=160,K=CH/P,cnv=document.createElement('canvas');cnv.width=P;cnv.height=P;const g=cnv.getContext('2d'),img=g.createImageData(P,P),d=img.data;
  const ext=extTerrain(c),E=TN+2,h=c.hgt,R=TN+1;
  const hAt=(x,y)=>{const fx=clamp(x/32,0,TN-1e-6),fy=clamp(y/32,0,TN-1e-6),i=Math.floor(fx),j=Math.floor(fy),tx=fx-i,ty=fy-j;
    return h[j*R+i]*(1-tx)*(1-ty)+h[j*R+i+1]*tx*(1-ty)+h[(j+1)*R+i]*(1-tx)*ty+h[(j+1)*R+i+1]*tx*ty;};
  const w=[0,0,0,0,0,0,0,0,0,0];
  // which terrain a point is (in chunk-local px), and how far from its edge (0 = deep inside, 0.5 = on the boundary)
  const pick=(x,y)=>{const fx=x/32-0.5,fy=y/32-0.5,i0=Math.floor(fx),j0=Math.floor(fy),tx=fx-i0,ty=fy-j0;
    const a=ext[(j0+1)*E+i0+1],b=ext[(j0+1)*E+i0+2],cc=ext[(j0+2)*E+i0+1],dd=ext[(j0+2)*E+i0+2];
    w[a]=0;w[b]=0;w[cc]=0;w[dd]=0;w[a]+=(1-tx)*(1-ty);w[b]+=tx*(1-ty);w[cc]+=(1-tx)*ty;w[dd]+=tx*ty;
    let best=a;for(const k of [b,cc,dd])if(w[k]>w[best])best=k;return [best,1-w[best]];};
  const gx0=c.cx*P,gy0=c.cy*P;
  for(let py=0;py<P;py++)for(let px=0;px<P;px++){const x=(px+0.5)*K,y=(py+0.5)*K,o=(py*P+px)*4,[t,e]=pick(x,y),n=pnoise(gx0+px,gy0+py);
    const sh=clamp(-((hAt(x+K,y)-hAt(x-K,y))+(hAt(x,y+K)-hAt(x,y-K)))/(2*K)*0.7*4,-0.45,0.35);
    let r,gg,b,al=255;
    if(t===T.GROUND){   // plain ground: just light and shadow, plus shadows cast by cliffs to the north-west
      const v=sh;if(Math.abs(v)<0.02){d[o+3]=0;continue;}if(v>0){r=255;gg=238;b=205;al=Math.round(v*255);}else{r=55;gg=28;b=10;al=Math.round(-v*255);}}
    else if(t===T.SEA){const m=Math.min(1,e*3);r=47+46*m;gg=90+50*m;b=98+42*m;}
    else if(t===T.RIVER||t===T.BRIDGE_W){const m=Math.min(1,e*3);r=60+50*m;gg=118+44*m;b=144+30*m;if(n>0.92){r+=30;gg+=30;b+=30;}}
    else if(t===T.DRY){const bank=e>0.25?1:0;r=bank?168:204;gg=bank?140:181;b=bank?98:136;if(n>0.9){r-=40;gg-=38;b-=34;}else if(n<0.06){r+=18;gg+=16;b+=12;}}
    else if(t===T.CANYON||t===T.BRIDGE_C){const m=Math.min(1,e*2.6);r=30+80*m;gg=20+48*m;b=12+30*m;r+=(n-0.5)*14;gg+=(n-0.5)*10;}
    if(t!==T.GROUND){const m=1+sh*0.8;r*=m;gg*=m;b*=m;}
    d[o]=clamp(r,0,255);d[o+1]=clamp(gg,0,255);d[o+2]=clamp(b,0,255);d[o+3]=al;}
  let any=false;for(let o=3;o<d.length;o+=4)if(d[o]){any=true;break;}if(!any)return EMPTY_OV;   // nothing to draw: skip it every frame
  g.putImageData(img,0,0);return cnv;}
// bridges where a road crosses a flowing river or a canyon
function roadTerrain(R,i){if(!R.tt)R.tt=new Uint8Array(R.n);if(!R.tt[i]){const r=terrainRaw(R.xs[i],R.ys[i]);R.tt[i]=r===T.RIVER?2:r===T.CANYON?3:1;}return R.tt[i];}
function drawBridges(runs){if(!runs)return;for(const cls in runs)for(const [ri,s,e] of runs[cls]){const R=roads[ri];let a=-1;
  for(let i=s;i<=e+1;i++){const on=i<=e&&roadTerrain(R,i)>1;if(on&&a<0)a=Math.max(s,i-1);if(!on&&a>=0){drawBridge(R,a,Math.min(e,i));a=-1;}}}}
function drawBridge(R,a,b){const pts=[];for(let i=a;i<=b;i++)pts.push([R.xs[i],R.ys[i]]);if(pts.length<2)return;
  const path=(off)=>{ctx.beginPath();for(let k=0;k<pts.length;k++){const p=pts[k],q=pts[Math.min(k+1,pts.length-1)],o=pts[Math.max(k-1,0)],dx=q[0]-o[0],dy=q[1]-o[1],l=Math.hypot(dx,dy)||1;
      const x=p[0]-dy/l*off,y=p[1]+dx/l*off;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();};
  ctx.lineCap='butt';ctx.strokeStyle='rgba(30,20,12,.35)';ctx.lineWidth=R.w+40;path(8);
  ctx.strokeStyle='#8a6a48';ctx.lineWidth=R.w+26;path(0);
  ctx.strokeStyle='rgba(60,40,25,.45)';ctx.lineWidth=R.w+26;ctx.setLineDash([3,11]);path(0);ctx.setLineDash([]);   // planks
  ctx.strokeStyle='#3b2a1c';ctx.lineWidth=5;path(R.w/2+11);path(-R.w/2-11);
  ctx.lineWidth=9;ctx.setLineDash([4,36]);path(R.w/2+11);path(-R.w/2-11);ctx.setLineDash([]);ctx.lineCap='round';}

// ---- mesas and buttes, drawn the way shaded relief shows them: lit from the north-west ----
const mesaArt=new Map();
function mesaPath(g,m,off,ox,oy,s){g.beginPath();for(let i=0;i<=MESA_N;i++){const a=i/MESA_N*TAU,r=Math.max(4,m.rad[i%MESA_N]+off);const x=ox+Math.cos(a)*r*s,y=oy+Math.sin(a)*r*s;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();}
function buildMesaArt(m){const S=0.5,pad=110,size=Math.ceil((m.maxR+pad)*2*S),cnv=document.createElement('canvas');cnv.width=size;cnv.height=size;const g=cnv.getContext('2d'),c=size/2,rnd=rng(m.seed+7);
  const cw=Math.min(22,Math.max(9,m.R*0.16));   // how wide the cliffs look from above
  // cast shadow to the south-east
  g.fillStyle='rgba(45,22,8,.33)';mesaPath(g,m,4,c+26*S,c+26*S,S);g.fill();
  // scree apron: fallen rock fanning out from the base
  g.fillStyle='rgba(150,98,66,.55)';mesaPath(g,m,40,c,c,S);g.fill();
  for(let k=0;k<(m.butte?60:140);k++){const a=rnd()*TAU,d=mesaR(m,a)+rnd()*40;g.fillStyle=['#7a5440','#8f6a52','#6a4634','#a07a5e'][k%4];g.beginPath();g.arc(c+Math.cos(a)*d*S,c+Math.sin(a)*d*S,(1+rnd()*2.2)*S*2,0,TAU);g.fill();}
  // cliffs stepped into benches (cliff-and-bench): darkest at the foot
  const benches=[[0,'#5e2a14'],[cw*0.34,'#74361b'],[cw*0.67,'#8a4322']];for(const [o,col] of benches){g.fillStyle=col;mesaPath(g,m,-o,c,c,S);g.fill();}
  // the cliffs catch the light on the north-west and fall into shadow on the south-east
  g.save();mesaPath(g,m,0,c,c,S);mesaPath(g,m,-cw,c,c,S);g.clip('evenodd');
  const gr=g.createLinearGradient(c-m.maxR*S,c-m.maxR*S,c+m.maxR*S,c+m.maxR*S);gr.addColorStop(0,'rgba(255,215,170,.32)');gr.addColorStop(0.5,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(20,6,0,.5)');
  g.fillStyle=gr;g.fillRect(0,0,size,size);
  g.strokeStyle='rgba(40,15,5,.35)';g.lineWidth=1;for(let i=0;i<MESA_N*3;i++){const a=i/(MESA_N*3)*TAU,r0=mesaR(m,a),r1=r0-cw;g.beginPath();g.moveTo(c+Math.cos(a)*r0*S,c+Math.sin(a)*r0*S);g.lineTo(c+Math.cos(a)*r1*S,c+Math.sin(a)*r1*S);g.stroke();}   // vertical fractures
  g.restore();
  // the flat caprock top
  const tg=g.createLinearGradient(c-m.maxR*S,c-m.maxR*S,c+m.maxR*S,c+m.maxR*S);tg.addColorStop(0,'#cd7f4c');tg.addColorStop(1,'#a85c33');
  g.fillStyle=tg;mesaPath(g,m,-cw,c,c,S);g.fill();
  g.save();mesaPath(g,m,-cw,c,c,S);g.clip();for(let k=0;k<(m.butte?6:18);k++){g.fillStyle=k%3?'rgba(90,110,50,.35)':'rgba(60,30,15,.18)';const a=rnd()*TAU,d=rnd()*mesaR(m,a)*0.75;g.beginPath();g.arc(c+Math.cos(a)*d*S,c+Math.sin(a)*d*S,(2+rnd()*4)*S*2,0,TAU);g.fill();}g.restore();   // a little scrub on top
  // a pale rim where the caprock edge faces the sun
  g.lineWidth=2.5*S*2;g.strokeStyle='rgba(240,190,140,.75)';g.save();g.beginPath();g.rect(0,0,c+m.maxR*0.25*S,c+m.maxR*0.25*S);g.clip();mesaPath(g,m,-cw,c,c,S);g.stroke();g.restore();
  return {cnv,size:size/S};}
function drawMesas(x0,y0,x1,y1){const cx=(x0+x1)/2,cy=(y0+y1)/2,range=Math.max(x1-x0,y1-y0)/2+600;
  for(const m of mesasNear(cx,cy,range)){if(m.x+m.maxR+120<x0||m.x-m.maxR-120>x1||m.y+m.maxR+120<y0||m.y-m.maxR-120>y1)continue;
    let art=mesaArt.get(m.id);if(!art){art=buildMesaArt(m);mesaArt.set(m.id,art);if(mesaArt.size>40)mesaArt.delete(mesaArt.keys().next().value);}
    ctx.drawImage(art.cnv,m.x-art.size/2,m.y-art.size/2,art.size,art.size);}}
// on the map: a rust tint ringed with hachures, the cartographer's mark for cliffs (darker on the shadowed side)
let allMesas=null;
function drawMapMesas(X,Y,sc){if(!allMesas)return;const pad=40;
  for(const m of allMesas){const px=X(m.x),py=Y(m.y);if(px<-pad||py<-pad||px>W+pad||py>H+pad)continue;const r0=m.R*sc;
    if(r0<1.6){ctx.fillStyle='#4a1e0c';ctx.fillRect(px-1.5,py-1.5,3,3);continue;}   // far out: a small dark dot
    const grow=Math.max(1,3.2/r0);   // never smaller than a mark you can see
    ctx.beginPath();for(let k=0;k<=MESA_N;k++){const a=k/MESA_N*TAU,r=m.rad[k%MESA_N]*sc*grow;k?ctx.lineTo(px+Math.cos(a)*r,py+Math.sin(a)*r):ctx.moveTo(px+Math.cos(a)*r,py+Math.sin(a)*r);}
    ctx.fillStyle='#d9955d';ctx.fill();ctx.strokeStyle='#3c1a0a';ctx.lineWidth=1.5;ctx.stroke();if(r0<5)continue;
    // hachures: short strokes down the cliffs, heavier on the shadowed south-east
    ctx.lineWidth=1;for(let k=0;k<MESA_N;k++){const a=k/MESA_N*TAU,r=m.rad[k]*sc,l=Math.max(2,Math.min(7,r0*0.3)),lit=Math.cos(a-Math.PI*1.25)>0;
      ctx.strokeStyle=lit?'rgba(70,35,15,.55)':'rgba(40,15,5,.95)';ctx.beginPath();ctx.moveTo(px+Math.cos(a)*r,py+Math.sin(a)*r);ctx.lineTo(px+Math.cos(a)*(r+l),py+Math.sin(a)*(r+l));ctx.stroke();}}}

// ---- wildlife, top-down ----
function drawAnimal(a){const dead=a.state==='dead',mv=Math.hypot(a.vx,a.vy);ctx.save();ctx.translate(a.x,a.y);
  if(dead&&!a.butchered){ctx.fillStyle='rgba(110,12,8,.55)';ctx.beginPath();ctx.ellipse(3,2,a.r*1.5,a.r*1.05,a.a,0,TAU);ctx.fill();}
  if(dead&&a.butchered){ctx.rotate(a.a);ctx.strokeStyle='#e8dcc0';ctx.lineWidth=2;for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(-a.r*0.6,k*3);ctx.lineTo(a.r*0.6,k*3.4);ctx.stroke();}ctx.restore();return;}   // picked over: a few bones
  ctx.rotate(a.a);if(dead)ctx.globalAlpha=0.85;
  ctx.fillStyle='rgba(40,20,8,.25)';ctx.beginPath();ctx.ellipse(3,4,a.r*1.15,a.r*0.7,0,0,TAU);ctx.fill();   // shadow
  const sp=a.sp,col=dead?0.7:1,shade=c=>c;
  if(sp==='roo'){const s=1+(mv>30?0.18*Math.abs(Math.sin(a.hop*2)):0);ctx.scale(s,1/s*1.05);
    ctx.fillStyle='#8a6e54';ctx.beginPath();ctx.moveTo(-10,-3);ctx.quadraticCurveTo(-26,-2,-30,0);ctx.quadraticCurveTo(-26,2,-10,3);ctx.fill();   // tail
    ctx.fillStyle=dead?'#7a6048':'#a5876a';ctx.beginPath();ctx.ellipse(0,0,13,8,0,0,TAU);ctx.fill();
    ctx.fillStyle='#b8987a';ctx.beginPath();ctx.ellipse(11,0,6,4.2,0,0,TAU);ctx.fill();   // head
    ctx.fillStyle='#8a6e54';ctx.beginPath();ctx.moveTo(10,-3);ctx.lineTo(6,-8);ctx.lineTo(9,-3);ctx.fill();ctx.beginPath();ctx.moveTo(10,3);ctx.lineTo(6,8);ctx.lineTo(9,3);ctx.fill();   // ears
    ctx.fillStyle='#2a1e14';ctx.beginPath();ctx.arc(16,0,1.2,0,TAU);ctx.fill();}
  else if(sp==='rabbit'){ctx.fillStyle=dead?'#6e6252':'#8d806c';ctx.beginPath();ctx.ellipse(0,0,7,4.6,0,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(6,0,3.6,3,0,0,TAU);ctx.fill();ctx.strokeStyle='#7a6e5c';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(5,-1.5);ctx.lineTo(0,-5);ctx.moveTo(5,1.5);ctx.lineTo(0,5);ctx.stroke();
    ctx.fillStyle='#f2ead8';ctx.beginPath();ctx.arc(-7,0,2,0,TAU);ctx.fill();}
  else if(sp==='dingo'){const leg=mv>20?Math.sin(a.hop*3)*3:0;ctx.strokeStyle='#a8703a';ctx.lineWidth=2.4;
    for(const [x,y,p] of [[6,-4,1],[6,4,-1],[-7,-4,-1],[-7,4,1]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+leg*p,y+Math.sign(y)*3);ctx.stroke();}
    ctx.strokeStyle='#c58a4a';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-10,0);ctx.quadraticCurveTo(-16,-4,-20,-1);ctx.stroke();   // tail
    ctx.fillStyle=dead?'#9a6a38':'#c98d4c';ctx.beginPath();ctx.ellipse(0,0,11,5.5,0,0,TAU);ctx.fill();
    ctx.beginPath();ctx.ellipse(12,0,5,4,0,0,TAU);ctx.fill();ctx.fillStyle='#e8c89a';ctx.beginPath();ctx.ellipse(16,0,3,2.2,0,0,TAU);ctx.fill();   // head, pale muzzle
    ctx.fillStyle='#a8703a';ctx.beginPath();ctx.moveTo(11,-3);ctx.lineTo(9,-7);ctx.lineTo(13,-4);ctx.fill();ctx.beginPath();ctx.moveTo(11,3);ctx.lineTo(9,7);ctx.lineTo(13,4);ctx.fill();}
  else if(sp==='snake'){const ph=G.time*(mv>5?9:1.5)+a.hop,pts=[];for(let k=0;k<10;k++){const x=6-k*3.4,y=Math.sin(ph-k*0.8)*(mv>5?3.5:2.2)*(k/10+0.3);pts.push([x,y]);}
    ctx.lineCap='round';ctx.strokeStyle=dead?'#5e5030':'#7d6a3a';ctx.lineWidth=4.2;ctx.beginPath();pts.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
    ctx.strokeStyle='rgba(40,30,15,.6)';ctx.lineWidth=4.2;ctx.setLineDash([2,4]);ctx.beginPath();pts.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#4a3e22';ctx.beginPath();ctx.ellipse(7,pts[0][1],3.4,2.6,0,0,TAU);ctx.fill();}
  if(a.flash>0){ctx.globalAlpha=a.flash*0.6;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(0,0,a.r,a.r*0.6,0,0,TAU);ctx.fill();}
  ctx.restore();}

// ---- city ground: streets, the square, farm paddocks, refinery pipework ----
function drawTownGround(o){
  if(o.paddocks)for(const p of o.paddocks){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);const hw=p.w/2,hh=p.h/2;
    ctx.fillStyle=p.crop==='wheat'?'rgba(196,160,84,.55)':'rgba(120,80,48,.45)';ctx.fillRect(-hw,-hh,p.w,p.h);
    ctx.strokeStyle=p.crop==='wheat'?'rgba(150,118,50,.6)':'rgba(80,52,30,.5)';ctx.lineWidth=3;for(let y=-hh+10;y<hh;y+=14){ctx.beginPath();ctx.moveTo(-hw+6,y);ctx.lineTo(hw-6,y);ctx.stroke();}   // crop rows
    ctx.strokeStyle='#6b5a44';ctx.lineWidth=1.5;ctx.strokeRect(-hw,-hh,p.w,p.h);ctx.fillStyle='#4e3a2c';   // fence: wire and posts
    for(let x=-hw;x<=hw;x+=30){ctx.fillRect(x-1.5,-hh-1.5,3,3);ctx.fillRect(x-1.5,hh-1.5,3,3);}for(let y=-hh;y<=hh;y+=30){ctx.fillRect(-hw-1.5,y-1.5,3,3);ctx.fillRect(hw-1.5,y-1.5,3,3);}
    ctx.restore();}
  if(o.streets&&o.streets.length){ctx.lineCap='butt';ctx.strokeStyle='rgba(70,55,40,.35)';ctx.lineWidth=STREET+10;for(const t of o.streets){ctx.beginPath();ctx.moveTo(t.x1,t.y1);ctx.lineTo(t.x2,t.y2);ctx.stroke();}
    ctx.strokeStyle='#8c7a62';ctx.lineWidth=STREET;for(const t of o.streets){ctx.beginPath();ctx.moveTo(t.x1,t.y1);ctx.lineTo(t.x2,t.y2);ctx.stroke();}
    ctx.strokeStyle='rgba(60,45,30,.18)';ctx.lineWidth=STREET*0.5;for(const t of o.streets){ctx.beginPath();ctx.moveTo(t.x1,t.y1);ctx.lineTo(t.x2,t.y2);ctx.stroke();}   // worn wheel tracks
    ctx.lineCap='round';}
  if(o.square){ctx.save();ctx.translate(o.square.x,o.square.y);ctx.rotate(o.square.rot);const h=o.square.size/2;ctx.fillStyle='#9a876c';ctx.fillRect(-h,-h,h*2,h*2);
    ctx.strokeStyle='rgba(60,45,30,.25)';ctx.lineWidth=1;for(let x=-h;x<h;x+=24){ctx.beginPath();ctx.moveTo(x,-h);ctx.lineTo(x,h);ctx.stroke();ctx.beginPath();ctx.moveTo(-h,x);ctx.lineTo(h,x);ctx.stroke();}   // flagstones
    ctx.fillStyle='#6b5a44';ctx.beginPath();ctx.arc(0,0,26,0,TAU);ctx.fill();ctx.fillStyle='#4f8aa8';ctx.beginPath();ctx.arc(0,0,18,0,TAU);ctx.fill();ctx.restore();}   // the old town well
  if(o.pipes)for(const pp of o.pipes){for(const [w,col] of [[12,'rgba(40,30,20,.5)'],[8,'#8d877c'],[3,'#b8b2a6']]){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();pp.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}}}
// ---- structures: tanks, towers, columns, the flare, windmills (drawn in their own local frame) ----
function drawStruct(b){const r=b.w/2;
  const shadow=(len)=>{ctx.fillStyle='rgba(80,40,12,.3)';ctx.beginPath();ctx.ellipse(len*0.6,len*0.8,r,r*0.85,0,0,TAU);ctx.fill();};
  if(b.kind==='oiltank'){shadow(16);ctx.fillStyle='#c9c5bc';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.strokeStyle='#8d877c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r-8,0,TAU);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,r*0.35,0,TAU);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(-r*0.3,-r*0.3,r*0.45,0,TAU);ctx.fill();
    ctx.fillStyle='#c2381f';ctx.font='700 '+Math.round(r*0.35)+'px "Saira Stencil One",Impact,sans-serif';ctx.textAlign='center';ctx.fillText('FK',0,r*0.12);
    ctx.strokeStyle='#5a544c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r*0.7,-r*0.7);ctx.lineTo(r*0.95,-r*0.3);ctx.stroke();}   // spiral stair
  else if(b.kind==='column'){shadow(60);ctx.fillStyle='rgba(60,30,10,.35)';ctx.fillRect(0,0,r*0.8,70);ctx.fillStyle='#8d877c';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();
    ctx.strokeStyle='#5a544c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r-5,0,TAU);ctx.stroke();ctx.fillStyle='#b8b2a6';ctx.beginPath();ctx.arc(-4,-4,r*0.35,0,TAU);ctx.fill();}
  else if(b.kind==='flare'){ctx.fillStyle='rgba(60,30,10,.35)';ctx.fillRect(0,0,6,90);ctx.fillStyle='#5a544c';ctx.beginPath();ctx.arc(0,0,r*0.6,0,TAU);ctx.fill();
    const f=0.8+0.3*Math.sin(G.time*13+b.x)+0.15*Math.sin(G.time*29);ctx.fillStyle='rgba(255,140,40,.55)';ctx.beginPath();ctx.arc(0,0,r*1.1*f,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,220,120,.9)';ctx.beginPath();ctx.arc(0,0,r*0.5*f,0,TAU);ctx.fill();}
  else if(b.kind==='watertower'){ctx.fillStyle='rgba(60,30,10,.3)';ctx.beginPath();ctx.ellipse(30,40,r,r*0.8,0,0,TAU);ctx.fill();
    ctx.strokeStyle='#4e3a2c';ctx.lineWidth=4;for(const [x,y] of [[-r*0.7,-r*0.7],[r*0.7,-r*0.7],[-r*0.7,r*0.7],[r*0.7,r*0.7]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x*0.4,y*0.4);ctx.stroke();}   // legs
    ctx.fillStyle='#8a9a96';ctx.beginPath();ctx.arc(0,0,r*0.82,0,TAU);ctx.fill();ctx.strokeStyle='#5d6d6a';ctx.lineWidth=2;for(let k=1;k<4;k++){ctx.beginPath();ctx.arc(0,0,r*0.82*k/4,0,TAU);ctx.stroke();}
    ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(-r*0.25,-r*0.25,r*0.35,0,TAU);ctx.fill();}
  else if(b.kind==='raintank'){shadow(10);ctx.fillStyle='#a3aaa4';ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.strokeStyle='#6f7772';ctx.lineWidth=1.5;   // corrugated iron
    for(let k=1;k<6;k++){ctx.beginPath();ctx.arc(0,0,r*k/6,0,TAU);ctx.stroke();}ctx.fillStyle='#5d6560';ctx.fillRect(-4,-4,8,8);}
  else if(b.kind==='windmill'){ctx.fillStyle='rgba(60,30,10,.3)';ctx.beginPath();ctx.ellipse(20,26,r,r*0.7,0,0,TAU);ctx.fill();ctx.strokeStyle='#4e3a2c';ctx.lineWidth=3;
    for(const [x,y] of [[-r*0.6,-r*0.6],[r*0.6,-r*0.6],[-r*0.6,r*0.6],[r*0.6,r*0.6]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(0,0);ctx.stroke();}
    ctx.save();ctx.rotate(G.time*2.2+b.x);ctx.strokeStyle='#b8b2a6';ctx.lineWidth=2;for(let k=0;k<12;k++){const a=k/12*TAU;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r*1.3,Math.sin(a)*r*1.3);ctx.stroke();}ctx.restore();
    ctx.fillStyle='#6d665d';ctx.beginPath();ctx.arc(0,0,5,0,TAU);ctx.fill();}}
