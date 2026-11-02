/* ===== the outback's oldest ruins: lone buildings reduced to a few broken walls =====
   Strung along the roads and scattered through open country. Most hold nothing at all;
   a few have a pile of debris worth sifting for a scrap or two. Nothing here to strip. */
const SHELL_CELL=4500,shellCache=new Map();
LOOT.shell=[['scrap',6,1,2],['cloth',4,1,1],['wire',3,1,1],['beans',1,1,1],['bullets',0.8,1,3],['bandage',0.8,1,1],['water',0.6,1,1],['hose',0.4,1,1],['durries',0.6,1,1]];
const SHELL_BIOME={salt:0.35,red:0.8,ranges:0.7,mallee:1,coast:1};
function shellAt(ix,iy){const key=ix*100003+iy;if(shellCache.has(key))return shellCache.get(key);let sh=null;
  const r=rng(hash2(ix*11+7,iy*17+3));let x=(ix+0.15+0.7*r())*SHELL_CELL,y=(iy+0.15+0.7*r())*SHELL_CELL;
  const ri=roadInfo(x,y),roadside=ri.r>=0&&ri.d<1100,z=landValue(x,y)>0.05?zoneAt(x,y).biome:null;
  if(z&&r()<(roadside?0.85:0.045)*SHELL_BIOME[z]){
    if(roadside){const R=roads[ri.r],side=r()<0.5?-1:1,off=ri.w/2+160+r()*320;x=ri.px-ri.ty*side*off;y=ri.py+ri.tx*side*off;}   // set back from the road
    const w=80+r()*90,h=70+r()*70,rot=r()*TAU,c=Math.cos(rot),s=Math.sin(rot),W=(lx,ly)=>({x:x+lx*c-ly*s,y:y+lx*s+ly*c});
    const corners=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]],walls=[];
    for(let e=0;e<4;e++){if(r()>0.6&&!(e===3&&!walls.length))continue;const a=corners[e],b=corners[(e+1)%4],len=0.25+r()*0.6,t0=r()*(1-len),t1=t0+len;
      const p=W(a[0]+(b[0]-a[0])*t0,a[1]+(b[1]-a[1])*t0),q=W(a[0]+(b[0]-a[0])*t1,a[1]+(b[1]-a[1])*t1);walls.push({x1:p.x,y1:p.y,x2:q.x,y2:q.y});if(walls.length>=3)break;}
    const chimney=r()<0.3?W(-w/2+12,-h/2+12):null;   // the brick chimney is often all that's left of a bush hut
    const ok=terrainRaw(x,y)===T.GROUND&&!insideMesa(x,y,140)&&!nearLoc(x,y,600)&&roadInfo(x,y).d>(ri.w||20)/2+120&&landValue(x,y)>0.05;
    if(ok){const rub=[];for(let k=0;k<10;k++)rub.push({x:x+(r()-0.5)*w*1.1,y:y+(r()-0.5)*h*1.1,s:3+r()*7,rot:r()*TAU,col:['#6b5a48','#5a4a3a','#7a6a56','#4e4034'][k%4]});
      const box=r()<0.3?{id:'sh'+ix+'_'+iy,kind:'rubble',x:x+(r()-0.5)*w*0.4,y:y+(r()-0.5)*h*0.4,table:'shell',rolls:1,seed:hash2(ix*5+1,iy*3+2),biome:z,persist:true}:null;
      sh={id:'sh'+ix+'_'+iy,x,y,w,h,rot,walls,chimney,rub,box,R:Math.hypot(w,h)/2+20,mat:r()<0.5?'stone':'timber'};}}
  shellCache.set(key,sh);return sh;}
function shellsNear(x,y,range){const out=[],i0=Math.floor((x-range)/SHELL_CELL),i1=Math.floor((x+range)/SHELL_CELL),j0=Math.floor((y-range)/SHELL_CELL),j1=Math.floor((y+range)/SHELL_CELL);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const s=shellAt(i,j);if(s)out.push(s);}return out;}
const SHELL_T=9;   // wall thickness
function shellSegDist(px,py,w){const dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy||1,t=clamp(((px-w.x1)*dx+(py-w.y1)*dy)/l2,0,1),cx=w.x1+dx*t,cy=w.y1+dy*t;return [Math.hypot(px-cx,py-cy),cx,cy];}
// is this point in (or within pad of) a ruined wall or chimney?
function inShellWall(x,y,pad){pad=pad||0;for(const s of shellsNear(x,y,300)){if(Math.hypot(x-s.x,y-s.y)>s.R+pad)continue;
    for(const w of s.walls)if(shellSegDist(x,y,w)[0]<SHELL_T/2+pad)return true;if(s.chimney&&Math.abs(x-s.chimney.x)<11+pad&&Math.abs(y-s.chimney.y)<11+pad)return true;}return false;}
function collideShells(b){for(const s of shellsNear(b.x,b.y,300)){if(Math.hypot(b.x-s.x,b.y-s.y)>s.R+b.r)continue;
    const parts=s.walls.slice();if(s.chimney)parts.push({x1:s.chimney.x,y1:s.chimney.y,x2:s.chimney.x,y2:s.chimney.y,fat:11});
    for(const w of parts){const [d,cx,cy]=shellSegDist(b.x,b.y,w),need=(w.fat||SHELL_T/2)+b.r*0.9;if(d>=need)continue;
      const nx=(b.x-cx)/(d||1),ny=(b.y-cy)/(d||1);b.x=cx+nx*need;b.y=cy+ny*need;if(b.kind==='car')bounce(b,nx,ny);else{const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=vn*nx;b.vy-=vn*ny;}}}}}
function drawShells(x0,y0,x1,y1){for(const s of shellsNear((x0+x1)/2,(y0+y1)/2,Math.max(x1-x0,y1-y0)/2+400)){if(s.x+s.R<x0||s.x-s.R>x1||s.y+s.R<y0||s.y-s.R>y1)continue;
    // the old floor, mostly buried, and rubble everywhere
    ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.fillStyle='rgba(90,70,50,.22)';ctx.fillRect(-s.w/2,-s.h/2,s.w,s.h);ctx.restore();
    for(const q of s.rub){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.rot);ctx.fillStyle=q.col;ctx.fillRect(-q.s/2,-q.s/2,q.s,q.s*0.7);ctx.restore();}
    const col=s.mat==='stone'?['#8a7a66','#6a5a48']:['#7a5a3c','#5a4028'];
    ctx.lineCap='butt';for(const [wd,cl] of [[SHELL_T+5,'rgba(50,35,20,.35)'],[SHELL_T,col[1]],[SHELL_T-4,col[0]]]){ctx.strokeStyle=cl;ctx.lineWidth=wd;for(const w of s.walls){ctx.beginPath();ctx.moveTo(w.x1,w.y1);ctx.lineTo(w.x2,w.y2);ctx.stroke();}}
    ctx.lineCap='round';
    if(s.chimney){ctx.save();ctx.translate(s.chimney.x,s.chimney.y);ctx.rotate(s.rot);ctx.fillStyle='rgba(50,30,15,.4)';ctx.fillRect(-8,-6,26,26);ctx.fillStyle='#8a4a32';ctx.fillRect(-11,-11,22,22);
      ctx.strokeStyle='#5e2e1c';ctx.lineWidth=1;for(let k=-7;k<11;k+=6){ctx.beginPath();ctx.moveTo(-11,k);ctx.lineTo(11,k);ctx.stroke();}ctx.fillStyle='#2a1a10';ctx.fillRect(-5,-5,10,10);ctx.restore();}}}
