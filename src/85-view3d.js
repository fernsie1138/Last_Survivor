/* ===== 3D view (prototype): the same world, seen from a chase camera =====
   Opt-in from Settings ("View: 2D / 3D"). three.js is only fetched once 3D is switched on, so the 2D game
   never loads it and draws exactly as before. If three.js can't load or WebGL isn't there, the game stays in 2D.
   Units: one three.js unit is one world pixel (10 to the metre). World (x, y) maps to three (x, z); height is three's y.
   Everything is built from the game's own world data (terrain chunks, roads, mesas, ruins, towns), streamed in
   round the player and thrown away behind them. Geometry is kept local to each chunk or object, so the huge world
   coordinates never reach the GPU and nothing jitters out on the far side of the continent. */
const V3={status:'off',canvas:null,R:null,scene:null,cam:null,mats:null,sun:null,hemi:null,head:null,headT:null,blob:null,
  chunks:new Map(),mesas:new Map(),shells:new Map(),locs:new Map(),cars:new Map(),people:new Map(),shadows:[],
  yaw:0,last:0,scanT:0,w:0,h:0,dpr:0};
const V3_RAD=4,V3_FOG_NEAR=650,V3_FOG_FAR=2750,V3_TS=16,V3_TV=CH/V3_TS+1;
function want3d(){return SETTINGS.view==='3d';}
function load3D(){if(V3.status!=='off')return;if(window.THREE){try{init3D();}catch(e){fail3D(e);}return;}
  V3.status='loading';const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  s.onload=()=>{try{init3D();}catch(e){fail3D(e);}};s.onerror=()=>fail3D('three.js did not load');document.head.appendChild(s);}
function fail3D(e){V3.status='failed';if(V3.canvas)V3.canvas.style.display='none';try{console.warn('3D view unavailable:',e);}catch(_){}
  showMsg('The 3D view couldn’t start here, so you’re in 2D',2.8);}
// what the main loop calls instead of render(): 3D when it's switched on and ready, the 2D renderer otherwise (and always for the map)
function renderView(){
  if(want3d()&&state!=='map'&&G){if(V3.status==='off')load3D();if(V3.status==='ready'){try{render3D();return;}catch(e){fail3D(e);}}}
  if(V3.canvas&&V3.canvas.style.display!=='none')V3.canvas.style.display='none';
  render();}

function init3D(){
  const cnv=document.createElement('canvas');cnv.id='c3d';cnv.style.cssText='position:fixed;inset:0;display:none;touch-action:none';
  cv.parentNode.insertBefore(cnv,cv);V3.canvas=cnv;   // under the 2D canvas, which stays on top (clear) for overlays
  const R=new THREE.WebGLRenderer({canvas:cnv,antialias:true,powerPreference:'high-performance'});
  if(!R.getContext())throw new Error('no WebGL');V3.R=R;
  const scene=new THREE.Scene();V3.scene=scene;scene.fog=new THREE.Fog(0xe8c79a,V3_FOG_NEAR,V3_FOG_FAR);scene.background=new THREE.Color(0xe8c79a);
  V3.cam=new THREE.PerspectiveCamera(60,W/H,2,V3_FOG_FAR+400);
  V3.hemi=new THREE.HemisphereLight(0xfff1dc,0xb88a62,0.55);scene.add(V3.hemi);
  V3.sun=new THREE.DirectionalLight(0xfff0d6,0.55);scene.add(V3.sun);scene.add(V3.sun.target);   // from the north-west, like the 2D shading
  V3.head=new THREE.SpotLight(0xfff2cc,0,1100,0.5,0.55,1);V3.headT=new THREE.Object3D();V3.head.target=V3.headT;scene.add(V3.head,V3.headT);
  V3.mats={vc:new THREE.MeshLambertMaterial({vertexColors:true}),
    road:new THREE.MeshLambertMaterial({vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),
    water:new THREE.MeshLambertMaterial({color:0x4a8aa0,transparent:true,opacity:0.86}),
    shadow:new THREE.MeshBasicMaterial({color:0x2a1408,transparent:true,opacity:0.3,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8})};
  V3.blob=new THREE.CircleGeometry(1,14);V3.blob.rotateX(-Math.PI/2);
  V3.status='ready';
}

/* ---- geometry builder: triangles with a colour each; faces are turned to point the way they should ---- */
const C3=new Map();
function col3(hex,k){const key=hex+(k||1);let c=C3.get(key);if(!c){const n=parseInt(hex.slice(1),16),m=k||1;c=[clamp(((n>>16)&255)/255*m,0,1),clamp(((n>>8)&255)/255*m,0,1),clamp((n&255)/255*m,0,1)];C3.set(key,c);}return c;}
function mix3(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function GB(){this.p=[];this.c=[];}
// h is the direction the face should look (it gets flipped if the winding says otherwise)
GB.prototype.tri=function(a,b,c,col,hx,hy,hz){
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
  if((uy*vz-uz*vy)*hx+(uz*vx-ux*vz)*hy+(ux*vy-uy*vx)*hz<0){const t=b;b=c;c=t;}
  const p=this.p,cc=this.c;p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);for(let i=0;i<3;i++)cc.push(col[0],col[1],col[2]);};
// a flat-ish quad a-b-c-d (in order round it), facing away from the point ref
GB.prototype.quad=function(a,b,c,d,col,ref){const mx=(a[0]+b[0]+c[0]+d[0])/4-ref[0],my=(a[1]+b[1]+c[1]+d[1])/4-ref[1],mz=(a[2]+b[2]+c[2]+d[2])/4-ref[2];
  this.tri(a,b,c,col,mx,my,mz);this.tri(a,c,d,col,mx,my,mz);};
GB.prototype.quadUp=function(a,b,c,d,col){this.tri(a,b,c,col,0,1,0);this.tri(a,c,d,col,0,1,0);};
// a box: x,z its centre on the ground, y its base, sx along its own x (after turning by rot, as the 2D game turns things), sz across
GB.prototype.box=function(x,y,z,sx,sy,sz,rot,col,top){const c=Math.cos(rot),s=Math.sin(rot),hx=sx/2,hz=sz/2,P=[];
  for(const [lx,lz] of [[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]])P.push([x+lx*c-lz*s,z+lx*s+lz*c]);
  const B=P.map(q=>[q[0],y,q[1]]),Tp=P.map(q=>[q[0],y+sy,q[1]]),ref=[x,y+sy/2,z];
  for(let i=0;i<4;i++){const j=(i+1)%4;this.quad(B[i],B[j],Tp[j],Tp[i],col,ref);}
  this.quad(Tp[0],Tp[1],Tp[2],Tp[3],top||col,ref);};
// a box placed in a building's own frame (lx along its width, lz along its depth, +lz is the front with the door)
GB.prototype.lbox=function(b,lx,lz,y,sx,sy,sz,col,top){const c=Math.cos(b.rot),s=Math.sin(b.rot);this.box(b.x+lx*c-lz*s,y,b.y+lx*s+lz*c,sx,sy,sz,b.rot,col,top);};
// an upright cylinder (n sides) with a lid
GB.prototype.cyl=function(x,y,z,r,h,n,col,top){const ref=[x,y+h/2,z];let pa=null,pb=null;
  for(let i=0;i<=n;i++){const a=i/n*TAU,qa=[x+Math.cos(a)*r,y,z+Math.sin(a)*r],qb=[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r];
    if(pa){this.quad(pa,qa,qb,pb,col,ref);this.tri([x,y+h,z],pb,qb,top||col,0,1,0);}pa=qa;pb=qb;}};
// a cylinder lying on its side (wheels, the windmill's fan), its axis across rot
GB.prototype.wheel=function(x,y,z,r,w,rot,n,col,hub){const ax=-Math.sin(rot),az=Math.cos(rot),fx=Math.cos(rot),fz=Math.sin(rot),ring=[];
  for(let i=0;i<n;i++){const a=i/n*TAU,u=Math.cos(a)*r,v=Math.sin(a)*r;ring.push([x+fx*u,y+v,z+fz*u]);}
  const side=k=>ring.map(q=>[q[0]+ax*w/2*k,q[1],q[2]+az*w/2*k]),L=side(-1),Rr=side(1),ref=[x,y,z];
  for(let i=0;i<n;i++){const j=(i+1)%n;this.quad(L[i],L[j],Rr[j],Rr[i],col,ref);
    this.tri([x+ax*w/2,y,z+az*w/2],Rr[i],Rr[j],hub||col,ax,0,az);this.tri([x-ax*w/2,y,z-az*w/2],L[i],L[j],hub||col,-ax,0,-az);}};
// a lumpy low-poly rock or bush: a ring at the base, a smaller turned ring higher up, a cap
GB.prototype.lump=function(x,y,z,r,h,rot,col,pts,cap){const n=7,lo=[],mid=[];
  for(let i=0;i<n;i++){const k=pts?pts[i%pts.length]:1,a=rot+i/n*TAU,b=rot+(i+0.5)/n*TAU;lo.push([x+Math.cos(a)*r*k,y,z+Math.sin(a)*r*k]);mid.push([x+Math.cos(b)*r*0.78*k,y+h*0.58,z+Math.sin(b)*r*0.78*k]);}
  const top=[x+r*0.08,y+h,z-r*0.05],dark=[col[0]*0.86,col[1]*0.86,col[2]*0.86];
  for(let i=0;i<n;i++){const j=(i+1)%n;this.tri(lo[i],lo[j],mid[i],dark,lo[i][0]+lo[j][0]-2*x,0.3*r,lo[i][2]+lo[j][2]-2*z);this.tri(lo[j],mid[j],mid[i],col,mid[j][0]+mid[i][0]-2*x,0.3*r,mid[j][2]+mid[i][2]-2*z);
    this.tri(mid[i],mid[j],top,cap||col,mid[i][0]+mid[j][0]-2*x,r,mid[i][2]+mid[j][2]-2*z);}};
// a draped patch of ground (four corners in world x,y), lifted a little off the terrain
GB.prototype.drape=function(q,lift,col,n){const P=(u,v)=>{const x=(q[0][0]*(1-u)+q[1][0]*u)*(1-v)+(q[3][0]*(1-u)+q[2][0]*u)*v,y=(q[0][1]*(1-u)+q[1][1]*u)*(1-v)+(q[3][1]*(1-u)+q[2][1]*u)*v;return [x,heightAt(x,y)+lift,y];};
  for(let j=0;j<n;j++)for(let i=0;i<n;i++)this.quadUp(P(i/n,j/n),P((i+1)/n,j/n),P((i+1)/n,(j+1)/n),P(i/n,(j+1)/n),col);};
GB.prototype.mesh=function(mat,ox,oz){if(!this.p.length)return null;const g=new THREE.BufferGeometry(),p=new Float32Array(this.p.length);ox=ox||0;oz=oz||0;
  for(let i=0;i<p.length;i+=3){p[i]=this.p[i]-ox;p[i+1]=this.p[i+1];p[i+2]=this.p[i+2]-oz;}   // keep the numbers small: positions relative to the object
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(this.c),3));
  g.computeVertexNormals();g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.position.set(ox,0,oz);m.matrixAutoUpdate=false;m.updateMatrix();return m;};
function drop3(o){if(!o)return;V3.scene.remove(o);o.traverse(k=>{if(k.geometry&&k.geometry!==V3.blob)k.geometry.dispose();});}

/* ---- terrain: one mesh per 640 px chunk, a vertex every 16 px ---- */
// how far each kind of ground sits below the land around it: ground, sea, river, creek bed, canyon, -, -, -, river bridge, canyon bridge
const SINK3=[0,70,42,11,165,0,0,0,42,165];
const n3Patch=vnoise(211);
function blockCol3(bi,bj){const c=getChunk(Math.floor(bi/4),Math.floor(bj/4));return col3(c.cells[(((bi%4)+4)%4)*4+(((bj%4)+4)%4)]);}
// the biome's ground colour, blended smoothly between the 160 px blocks the 2D view paints in
function groundCol3(x,y){const fx=x/160-0.5,fy=y/160-0.5,i=Math.floor(fx),j=Math.floor(fy),tx=fx-i,ty=fy-j;
  const a=blockCol3(i,j),b=blockCol3(i+1,j),c=blockCol3(i,j+1),d=blockCol3(i+1,j+1);
  return mix3(mix3(a,b,tx),mix3(c,d,tx),ty);}
function sinkAt3(x,y){let s=0;for(const [dx,dy] of [[-8,-8],[8,-8],[-8,8],[8,8]]){const t=terrainAt(x+dx,y+dy);let k=SINK3[t];
    if(t===T.DRY){const ri=roadInfo(x+dx,y+dy);if(ri.r>=0&&ri.d<ri.w/2+26)k=0;}s+=k;}return s/4;}   // creek beds don't dip under a road: it fords them
function buildChunk3(c){const ox=c.cx*CH,oy=c.cy*CH,N=V3_TV,E=N+2,hs=new Float32Array(E*E),pos=new Float32Array(N*N*3),nor=new Float32Array(N*N*3),colr=new Float32Array(N*N*3);
  for(let j=-1;j<=N;j++)for(let i=-1;i<=N;i++){const x=ox+i*V3_TS,y=oy+j*V3_TS;hs[(j+1)*E+i+1]=heightAt(x,y)-sinkAt3(x,y);}
  const near=LOCS.filter(l=>Math.hypot(l.x-ox-CH/2,l.y-oy-CH/2)<l.rad+CH);
  const canyonC=col3('#5c2814'),bankC=col3('#a8865e'),bedC=col3('#6d6250'),dryC=col3('#cdb68a'),seaC=col3('#5f7268'),townC=col3('#a8784a');
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,x=ox+i*V3_TS,y=oy+j*V3_TS,h=hs[(j+1)*E+i+1],o=k*3;
    pos[o]=i*V3_TS;pos[o+1]=h;pos[o+2]=j*V3_TS;
    const nx=-(hs[(j+1)*E+i+2]-hs[(j+1)*E+i])/(2*V3_TS),nz=-(hs[(j+2)*E+i+1]-hs[j*E+i+1])/(2*V3_TS),l=Math.hypot(nx,1,nz);nor[o]=nx/l;nor[o+1]=1/l;nor[o+2]=nz/l;
    let cl=groundCol3(x,y);const sink=heightAt(x,y)-h;
    if(sink>0.5){const t=terrainAt(x,y);
      if(t===T.CANYON||t===T.BRIDGE_C)cl=mix3(cl,canyonC,clamp(sink/120,0,1));
      else if(t===T.SEA)cl=mix3(bankC,seaC,clamp(sink/50,0,1));
      else if(t===T.RIVER||t===T.BRIDGE_W)cl=mix3(bankC,bedC,clamp(sink/30,0,1));
      else if(t===T.DRY)cl=mix3(cl,dryC,clamp(sink/6,0,1));
      else cl=mix3(cl,sink>60?canyonC:bankC,clamp(sink/40,0,0.8));}
    for(const lc of near){const d=Math.hypot(x-lc.x,y-lc.y),R=lc.type==='city'?lc.rad-120:lc.rad*0.8;if(d<R)cl=mix3(cl,townC,(lc.type==='ruin'?0.12:0.22)*clamp((R-d)/150,0,1));}
    const v=0.92+0.16*fbm(n3Patch,x/700,y/700,2)+(pnoise(x>>3,y>>3)-0.5)*0.05;colr[o]=clamp(cl[0]*v,0,1);colr[o+1]=clamp(cl[1]*v,0,1);colr[o+2]=clamp(cl[2]*v,0,1);}
  const idx=[];for(let j=0;j<N-1;j++)for(let i=0;i<N-1;i++){const a=j*N+i,b=a+1,d=a+N,cc=d+1;idx.push(a,d,b,b,d,cc);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  g.setAttribute('color',new THREE.BufferAttribute(colr,3));g.setIndex(idx);g.computeBoundingSphere();
  const grp=new THREE.Group(),m=new THREE.Mesh(g,V3.mats.vc);m.position.set(ox,0,oy);m.matrixAutoUpdate=false;m.updateMatrix();grp.add(m);
  // water: a sheet over each river and sea cell
  const wb=new GB();for(let j=0;j<TN;j++)for(let i=0;i<TN;i++){const t=c.terr[j*TN+i];if(t!==T.RIVER&&t!==T.SEA&&t!==T.BRIDGE_W)continue;
    const x0=ox+i*32,y0=oy+j*32,dp=t===T.SEA?16:13,W3=(x,y)=>[x,heightAt(x,y)-dp,y];wb.quadUp(W3(x0,y0),W3(x0+32,y0),W3(x0+32,y0+32),W3(x0,y0+32),[1,1,1]);}   // corners shared with the next cell: one unbroken sheet down the slope
  const wm=wb.mesh(V3.mats.water,ox,oy);if(wm)grp.add(wm);
  // roads, bridges, rocks, trees and scrub, wrecks
  const rm=roadsMesh3(c);if(rm)grp.add(rm);
  const ob=objectsMesh3(c);if(ob)grp.add(ob);
  grp.matrixAutoUpdate=false;return grp;}

/* ---- roads: ribbons laid along the road's own line, a few px above the ground; bridges where they cross rivers and canyons ---- */
const ROAD3={highway:{base:'#5d5046',lift:2.6},gravel:{base:'#ab8f6a',lift:2.3,crown:'#bea47c',cw:0.6},dirt:{base:'#a07c52',lift:2.0,crown:'#c0a072',cw:0.42}};
function roadH3(R,i){if(!R.h3)R.h3=new Float32Array(R.n).fill(NaN);let h=R.h3[i];if(h!==h){h=heightAt(R.xs[i],R.ys[i]);R.h3[i]=h;}return h;}
function roadN3(R,i){const a=Math.max(0,i-1),b=Math.min(R.n-1,i+1),dx=R.xs[b]-R.xs[a],dy=R.ys[b]-R.ys[a],l=Math.hypot(dx,dy)||1;return [-dy/l,dx/l];}
function roadsMesh3(c){const ox=c.cx*CH,oy=c.cy*CH,gb=new GB(),seen=new Set();
  for(let gx=Math.floor(ox/CELL)-1;gx<=Math.floor((ox+CH)/CELL)+1;gx++)for(let gy=Math.floor(oy/CELL)-1;gy<=Math.floor((oy+CH)/CELL)+1;gy++){const arr=grid.get(gkey(gx,gy));if(!arr)continue;
    for(let k=0;k<arr.length;k+=2){const ri=arr[k],s=arr[k+1],R=roads[ri],x=R.xs[s],y=R.ys[s];if(x<ox||x>=ox+CH||y<oy||y>=oy+CH)continue;const key=ri*1e7+s;if(seen.has(key))continue;seen.add(key);roadSeg3(gb,R,s);}}
  return gb.mesh(V3.mats.road,ox,oy);}
function roadSeg3(gb,R,s){const S=ROAD3[R.cls],w=R.w,n0=roadN3(R,s),n1=roadN3(R,s+1),bridge=roadTerrain(R,s)>1||roadTerrain(R,s+1)>1;
  const h0=roadH3(R,s),h1=roadH3(R,s+1),x0=R.xs[s],y0=R.ys[s],x1=R.xs[s+1],y1=R.ys[s+1];
  const P=(k,off,lift)=>k?[x1+n1[0]*off,h1+lift,y1+n1[1]*off]:[x0+n0[0]*off,h0+lift,y0+n0[1]*off];
  const strip=(a,b,lift,col)=>gb.quadUp(P(0,a,lift),P(0,b,lift),P(1,b,lift),P(1,a,lift),col);
  if(bridge){const half=w/2+14,deck=col3('#8a6a48'),rail=col3('#3b2a1c'),mx=(x0+x1)/2,my=(y0+y1)/2;
    strip(-half,half,S.lift,col3('#7d5f40'));
    for(const sg of [-1,1]){const a=P(0,sg*half,S.lift),b=P(1,sg*half,S.lift),a2=P(0,sg*half,S.lift-14),b2=P(1,sg*half,S.lift-14);gb.quad(a,b,b2,a2,deck,[mx,h0-6,my]);   // the deck's edge
      const ra=P(0,sg*(half-3),S.lift+9),rb=P(1,sg*(half-3),S.lift+9),la=P(0,sg*(half-3),S.lift),lb=P(1,sg*(half-3),S.lift);
      gb.quad(la,lb,rb,ra,rail,[mx-n0[0]*sg*400,h0,my-n0[1]*sg*400]);gb.quad(la,lb,rb,ra,rail,[mx+n0[0]*sg*400,h0,my+n0[1]*sg*400]);   // railings, seen from both sides
      gb.box(ra[0],h0+S.lift,ra[2],4,12,4,0,rail);}
    if(s%2===0)gb.box(x0,h0-230,y0,w*0.7,230+S.lift-12,16,Math.atan2(n0[1],n0[0]),col3('#6a5038'));   // a pier down into the gorge
    return;}
  strip(-w/2,w/2,S.lift,col3(S.base));
  if(R.cls==='highway'){const ln=col3('#d8c8a8');strip(-w/2+7,-w/2+11,S.lift+0.25,ln);strip(w/2-11,w/2-7,S.lift+0.25,ln);
    if(Math.floor(R.cum[s]/55)%2===0)strip(-2,2,S.lift+0.25,col3('#e2c272'));}
  else strip(-w*S.cw/2,w*S.cw/2,S.lift+0.2,col3(S.crown));}

/* ---- what stands on the ground in a chunk: rocks, scrub and trees, wrecks ---- */
const ROCK3={red:'#8a5236',ranges:'#70402a',salt:'#b1a38e',mallee:'#7d6e58',coast:'#9a8a70'};
function objectsMesh3(c){const ox=c.cx*CH,oy=c.cy*CH,gb=new GB(),rc=col3(ROCK3[c.zone.biome]||'#806048');
  for(const k of c.rocks){const y=heightAt(k.x,k.y);gb.lump(k.x,y-k.r*0.12,k.y,k.r,k.r*0.85,k.rot,rc,k.pts);}
  for(const w of c.wrecks){const y=heightAt(w.x,w.y),cl=col3(w.burnt?'#3a2c24':'#7a4a2a');gb.box(w.x,y,w.y,w.w,11,w.h,w.rot,cl);gb.box(w.x-Math.cos(w.rot)*6,y+11,w.y-Math.sin(w.rot)*6,w.w*0.45,8,w.h*0.8,w.rot+0.08,col3(w.burnt?'#2a201a':'#5a3a24'));}
  for(const d of c.decor){const y=heightAt(d.x,d.y),s=d.s;
    if(d.kind==='spinifex')gb.lump(d.x,y-1,d.y,11*s,7*s,d.rot,col3('#b4a04e'),null,col3('#c8b866'));
    else if(d.kind==='bush')gb.lump(d.x,y-1,d.y,15*s,15*s,d.rot,col3('#6c7440'),null,col3('#7f8a4c'));
    else if(d.kind==='grass')gb.lump(d.x,y-1,d.y,8*s,10*s,d.rot,col3('#c4ae6a'));
    else if(d.kind==='mound')gb.lump(d.x,y-3,d.y,20*s,8*s,d.rot,col3('#a0643c'));
    else if(d.kind==='tire')gb.cyl(d.x,y,d.y,7,3.5,8,col3('#2a2420'));
    else if(d.kind==='gum'){gb.cyl(d.x,y-2,d.y,3.6*s,62*s,6,col3('#ded6c4'));   // a ghost gum: pale trunk, a few clumps of grey-green leaves
      for(let k=0;k<3;k++){const a=d.rot+k*2.1,r=12*s;gb.lump(d.x+Math.cos(a)*r,y+(46+k*9)*s,d.y+Math.sin(a)*r,20*s,22*s,a,col3(k===1?'#6d7a52':'#5f6c48'),null,col3('#7c8a5c'));}}}
  return gb.mesh(V3.mats.vc,ox,oy);}

/* ---- mesas and buttes: a scree apron, cliffs stepped into benches, a flat caprock top ---- */
function buildMesa3(m){const gb=new GB(),N=64,H=m.butte?110+m.R*0.7:170+m.R*0.45,cw=m.R*0.15;
  let base=1e9;for(let k=0;k<16;k++){const a=k/16*TAU,r=mesaR(m,a)+40;base=Math.min(base,heightAt(m.x+Math.cos(a)*r,m.y+Math.sin(a)*r));}base-=6;
  // rings out from the middle: [how far outside the cliff line, how high up (share of H), colour of the band below it]
  const rings=[[52,0,null],[14,0.03,'#9a7056'],[0,0.065,'#83583e'],[-cw*0.12,0.5,'#5e2a14'],[-cw*0.42,0.53,'#9a5a34'],[-cw*0.5,0.84,'#74361b'],[-cw*0.78,0.86,'#a8643a'],[-cw*0.86,1,'#8a4322']];
  const rnd=rng(m.seed+11),pts=rings.map(([off,f])=>{const row=[];for(let i=0;i<=N;i++){const a=i/N*TAU,r=Math.max(6,mesaR(m,a)+off);row.push([m.x+Math.cos(a)*r,base+f*H,m.y+Math.sin(a)*r]);}return row;});
  for(let k=1;k<rings.length;k++){const cl=col3(rings[k][2]);for(let i=0;i<N;i++){const a=(i+0.5)/N*TAU,v=0.9+rnd()*0.2,c=[cl[0]*v,cl[1]*v,cl[2]*v];
    const A=pts[k-1][i],B=pts[k-1][i+1],Cc=pts[k][i+1],D=pts[k][i];gb.tri(A,B,Cc,c,Math.cos(a),0.6,Math.sin(a));gb.tri(A,Cc,D,c,Math.cos(a),0.6,Math.sin(a));}}
  const top=pts[rings.length-1],ctr=[m.x,base+H,m.y];for(let i=0;i<N;i++){const v=0.95+rnd()*0.1,cl=col3('#c47a48',v);gb.tri(ctr,top[i],top[i+1],cl,0,1,0);}
  for(let k=0;k<(m.butte?3:9);k++){const a=rnd()*TAU,d=rnd()*mesaR(m,a)*0.6;gb.lump(m.x+Math.cos(a)*d,base+H-1,m.y+Math.sin(a)*d,8+rnd()*8,6+rnd()*5,rnd()*TAU,col3('#7a7a48'));}   // scrub on top
  return gb.mesh(V3.mats.vc,m.x,m.y);}

/* ---- the outback's lone ruined buildings: a few broken walls and maybe a chimney ---- */
function buildShell3(s){const gb=new GB(),y=heightAt(s.x,s.y)-3,r=rng(hash2(Math.round(s.x),Math.round(s.y))),col=col3(s.mat==='stone'?'#8a7a66':'#7a5a3c'),top=col3(s.mat==='stone'?'#a09078':'#8e6c4a');
  for(const w of s.walls){const len=Math.hypot(w.x2-w.x1,w.y2-w.y1),a=Math.atan2(w.y2-w.y1,w.x2-w.x1),n=Math.max(1,Math.round(len/26));
    for(let i=0;i<n;i++){const t=(i+0.5)/n,h=14+r()*30;gb.box(w.x1+(w.x2-w.x1)*t,y,w.y1+(w.y2-w.y1)*t,len/n+0.5,h,SHELL_T,a,col,top);}}   // walls broken off at different heights
  if(s.chimney)gb.box(s.chimney.x,y,s.chimney.y,22,50+r()*14,22,s.rot,col3('#8a4a32'),col3('#2a1a10'));
  for(const q of s.rub)gb.box(q.x,heightAt(q.x,q.y)-1,q.y,q.s,q.s*0.5,q.s*0.7,q.rot,col3(q.col));
  return gb.mesh(V3.mats.vc,s.x,s.y);}

/* ---- towns, cities and ruins: buildings with walls, a door and a roof; the town wall; streets, the square, paddocks, tanks and towers ---- */
const WALLH3={house:34,shed:30,pub:46,garage:40,clinic:34,servo:32,store:36,warehouse:56,barn:58,office:42};
const WALLC3={house:'#c9b79a',shed:'#9a948a',pub:'#a0623e',garage:'#8a8278',clinic:'#d8d2c4',servo:'#c8b8a0',store:'#b89a70',warehouse:'#8f8a80',barn:'#8a4a30',office:'#b0a898'};
function building3(gb,rb,b){const y=heightAt(b.x,b.y),hw=b.w/2,hh=b.h/2,t=6,g=b.door/2,r=rng(hash2(Math.round(b.x),Math.round(b.y)));
  const WH=WALLH3[b.kind]||34,wc=col3(b.ruined?'#6e5c4a':WALLC3[b.kind]||'#b0a090'),top=col3(b.ruined?'#5a4a3a':'#6a5a4a'),glass=col3('#1c2226');
  gb.lbox(b,0,0,y-4,b.w,6.5,b.h,col3(b.ruined?'#5e4c3c':FLOOR[b.kind]||'#7a6a58'));   // the floor
  // walls: the back, both sides, and the front either side of the door; a ruin's walls are broken off at uneven heights
  const wall=(lx,lz,sx,sz,parts,along)=>{for(let i=0;i<parts;i++){const f=(i+0.5)/parts-0.5,h=b.ruined?WH*(0.25+r()*0.6):WH;
      gb.lbox(b,along?lx+f*sx:lx,along?lz:lz+f*sz,y-3,along?sx/parts+0.3:sx,h+3,along?sz:sz/parts+0.3,wc,top);}};
  const P=b.ruined?3:1;
  wall(0,-hh+t/2,b.w,t,P,true);wall(-hw+t/2,0,t,b.h-2*t,P,false);wall(hw-t/2,0,t,b.h-2*t,P,false);
  wall((-hw-g)/2,hh-t/2,hw-g,t,P,true);wall((hw+g)/2,hh-t/2,hw-g,t,P,true);
  if(!b.ruined){gb.lbox(b,0,hh-t/2,y+26,b.door+1,WH-26,t,wc,top);   // over the door
    if(hw-g>30)for(const sg of [-1,1])gb.lbox(b,sg*(g+(hw-g)/2),hh-t/2,y+13,Math.min(22,(hw-g)*0.5),12,t+1.2,glass);   // front windows
    if(b.h>70)for(const sg of [-1,1])gb.lbox(b,sg*(hw-t/2),0,y+13,t+1.2,12,Math.min(26,b.h*0.3),glass);}   // side windows
  if(b.ruined)return;
  // the roof
  const rc=col3(ROOF[b.kind]||'#8f8a80'),ey=y+WH,o=5,c=Math.cos(b.rot),s=Math.sin(b.rot),L=(lx,ly,lz)=>[b.x+lx*c-lz*s,ly,b.y+lx*s+lz*c];
  if(b.kind==='house'||b.kind==='shed'||b.kind==='pub'||b.kind==='barn'){const along=b.w>=b.h,X=hw+o,Z=hh+o,rh=Math.min(b.w,b.h)*(b.kind==='pub'?0.24:0.3),ref=L(0,ey,0),dk=[rc[0]*0.8,rc[1]*0.8,rc[2]*0.8];
    if(along){rb.quad(L(-X,ey,Z),L(X,ey,Z),L(X,ey+rh,0),L(-X,ey+rh,0),rc,ref);rb.quad(L(-X,ey,-Z),L(X,ey,-Z),L(X,ey+rh,0),L(-X,ey+rh,0),dk,ref);
      for(const sg of [-1,1]){const a=L(sg*hw,ey,hh),bb=L(sg*hw,ey,-hh),tp=L(sg*hw,ey+rh,0),m=L(sg*hw*2,ey,0);rb.tri(a,bb,tp,wc,m[0]-ref[0],0,m[2]-ref[2]);}}
    else{rb.quad(L(X,ey,-Z),L(X,ey,Z),L(0,ey+rh,Z),L(0,ey+rh,-Z),rc,ref);rb.quad(L(-X,ey,-Z),L(-X,ey,Z),L(0,ey+rh,Z),L(0,ey+rh,-Z),dk,ref);
      for(const sg of [-1,1]){const a=L(hw,ey,sg*hh),bb=L(-hw,ey,sg*hh),tp=L(0,ey+rh,sg*hh),m=L(0,ey,sg*hh*2);rb.tri(a,bb,tp,wc,m[0]-ref[0],0,m[2]-ref[2]);}}}
  else{rb.lbox(b,0,0,ey,b.w+2*o,4,b.h+2*o,rc);   // flat iron roof, with a parapet on the shopfronts
    if(b.kind==='warehouse')for(let x=-hw+20;x<hw-10;x+=40)rb.lbox(b,x,0,ey+4,14,10,b.h,col3('#9a978e'),col3('#b8b5ac'));
    else if(b.kind!=='garage')rb.lbox(b,0,hh+o-2,ey,b.w+2*o,10,4,wc,top);}}
function struct3(gb,b){const y=heightAt(b.x,b.y)-2,r=b.w/2;
  if(b.kind==='oiltank'){gb.cyl(b.x,y,b.y,r,82,16,col3('#c9c5bc'),col3('#b8b2a6'));gb.cyl(b.x,y+82,b.y,r*0.3,6,10,col3('#a8a296'));}
  else if(b.kind==='column'){gb.cyl(b.x,y,b.y,r,210,10,col3('#8d877c'),col3('#6d675c'));for(let k=1;k<4;k++)gb.cyl(b.x,y+k*52,b.y,r+3,4,10,col3('#5a544c'));}
  else if(b.kind==='flare'){gb.cyl(b.x,y,b.y,5,240,6,col3('#5a544c'));gb.lump(b.x,y+238,b.y,10,30,0,col3('#ffb040'),null,col3('#ffe08a'));}
  else if(b.kind==='watertower'){const k=r*0.6,leg=col3('#4e3a2c');for(const [dx,dz] of [[-k,-k],[k,-k],[k,k],[-k,k]])gb.box(b.x+dx,y,b.y+dz,5,92,5,0,leg);
    gb.box(b.x,y+90,b.y,r*1.7,3,r*1.7,0,leg);gb.cyl(b.x,y+93,b.y,r*0.82,46,14,col3('#8a9a96'),col3('#6d7d79'));}
  else if(b.kind==='raintank')gb.cyl(b.x,y,b.y,r,48,14,col3('#a3aaa4'),col3('#8a918b'));
  else if(b.kind==='windmill'){const leg=col3('#4e3a2c');for(const [dx,dz] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const a=[b.x+dx*r*0.6,y,b.y+dz*r*0.6],tp=[b.x+dx*2,y+120,b.y+dz*2],a2=[a[0]+3,y,a[2]+3];gb.tri(a,a2,tp,leg,dx,0,dz);gb.tri(a,tp,a2,leg,-dx,0,-dz);}
    gb.wheel(b.x,y+124,b.y,30,3,b.rot,12,col3('#b8b2a6'),col3('#8d877c'));gb.box(b.x,y+118,b.y,24,6,4,b.rot+Math.PI/2,col3('#6d665d'));}}
function buildLoc3(o){const gb=new GB(),rb=new GB(),wr=o.rad-40;
  if(o.paddocks)for(const p of o.paddocks){const c=Math.cos(p.rot),s=Math.sin(p.rot),hw=p.w/2,hh=p.h/2,Q=(u,v)=>[p.x+u*c-v*s,p.y+u*s+v*c];
    gb.drape([Q(-hw,-hh),Q(hw,-hh),Q(hw,hh),Q(-hw,hh)],1.4,col3(p.crop==='wheat'?'#c4a054':'#7a5030'),6);
    for(let u=-hw;u<=hw+1;u+=30)for(const v of [-hh,hh]){const q=Q(u,v);gb.box(q[0],heightAt(q[0],q[1])-1,q[1],3,11,3,p.rot,col3('#4e3a2c'));}
    for(let v=-hh+30;v<hh;v+=30)for(const u of [-hw,hw]){const q=Q(u,v);gb.box(q[0],heightAt(q[0],q[1])-1,q[1],3,11,3,p.rot,col3('#4e3a2c'));}}
  if(o.streets)for(const t of o.streets){const len=Math.hypot(t.x2-t.x1,t.y2-t.y1),n=Math.ceil(len/40),ux=(t.x2-t.x1)/len,uy=(t.y2-t.y1)/len,px=-uy*t.w/2,py=ux*t.w/2;
    for(let i=0;i<n;i++){const a=[t.x1+ux*len*i/n,t.y1+uy*len*i/n],b=[t.x1+ux*len*(i+1)/n,t.y1+uy*len*(i+1)/n];
      gb.drape([[a[0]+px,a[1]+py],[b[0]+px,b[1]+py],[b[0]-px,b[1]-py],[a[0]-px,a[1]-py]],1.7,col3('#8c7a62'),1);}}
  if(o.square){const q=o.square,c=Math.cos(q.rot),s=Math.sin(q.rot),h=q.size/2,Q=(u,v)=>[q.x+u*c-v*s,q.y+u*s+v*c];
    gb.drape([Q(-h,-h),Q(h,-h),Q(h,h),Q(-h,h)],2.0,col3('#9a876c'),6);const y=heightAt(q.x,q.y);gb.cyl(q.x,y,q.y,26,10,14,col3('#6b5a44'));gb.cyl(q.x,y,q.y,18,10.6,14,col3('#4f8aa8'));}
  if(o.pipes)for(const pp of o.pipes)for(let i=1;i<pp.length;i++){const a=pp[i-1],b=pp[i],len=Math.hypot(b.x-a.x,b.y-a.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;gb.box(mx,heightAt(mx,my)+8,my,len,7,7,Math.atan2(b.y-a.y,b.x-a.x),col3('#8d877c'));}
  for(const w of o.wall){const x=o.x+Math.cos(w.a)*(wr+w.j),y=o.y+Math.sin(w.a)*(wr+w.j);gb.box(x,heightAt(x,y)-4,y,53,40,18,w.a+Math.PI/2,col3(w.c),col3(w.c,0.8));}
  for(const b of o.bld){if(b.struct)struct3(gb,b);else if(b.tank){const y=heightAt(b.x,b.y);gb.cyl(b.x,y-2,b.y,29,34,14,col3('#9c958a'),col3('#7d766c'));}else building3(gb,rb,b);}
  const grp=new THREE.Group(),m=gb.mesh(V3.mats.vc,o.x,o.y),roofs=rb.mesh(V3.mats.vc,o.x,o.y);if(m)grp.add(m);if(roofs){grp.add(roofs);grp.userData.roofs=roofs;}
  grp.matrixAutoUpdate=false;return grp;}

/* ---- vehicles and people: models built once each, moved every frame ---- */
function carModel3(c){const d=c.def,L=d.len,Wd=d.wid,st=d.style,gb=new GB(),body=col3(c.wrecked?'#2a211b':d.col),trim=col3(c.wrecked?'#2a211b':d.trim),glass=col3('#1c2226'),tyre=col3('#1a1512'),hub=col3('#6d665d');
  const big=st==='cruiser'||st==='brute'||hasUp(c,'offroad'),wr=big?5.6:4.6,box=(x,y,sx,sy,sz,col,top,z)=>gb.box(x,y,z||0,sx,sy,sz,0,col,top);
  if(st==='bike'){gb.wheel(L*0.36,5,0,5,3,0,10,tyre,hub);gb.wheel(-L*0.36,5,0,5,3,0,10,tyre,hub);box(-L*0.05,5,L*0.62,5,Wd*0.55,body);box(L*0.2,10,L*0.22,3,Wd*0.4,col3('#c9c2b5'));
    if(c.driver==='hero'){box(-L*0.08,10,8,11,8,col3('#5a3f2a'));box(-L*0.06,21,6,6,6,col3('#2b2420'));}else box(-L*0.08,10,L*0.25,3,Wd*0.5,col3('#2a211b'));return gb;}
  const hb=st==='cruiser'||st==='brute'?10:st==='van'?9:8,y0=wr*0.75;
  for(const sx of [1,-1])for(const sz of [1,-1])gb.wheel(sx*L*0.31,wr,sz*(Wd/2-2),wr,4,0,10,tyre,hub);
  box(0,y0,L,hb,Wd,body,body);box(0,y0+hb*0.45,L+0.4,1.4,Wd+0.4,trim);   // body and a trim stripe
  const cab=(x,len,h,w)=>{box(x,y0+hb,len,h,w||Wd*0.86,glass);box(x,y0+hb+h,len+1,1.6,(w||Wd*0.86)+1,body);};
  if(st==='coupe')cab(-L*0.1,L*0.38,6);
  else if(st==='sedan')cab(-L*0.05,L*0.46,7);
  else if(st==='wagon')cab(-L*0.1,L*0.66,7);
  else if(st==='van'){cab(L*0.18,L*0.22,8);box(-L*0.14,y0+hb,L*0.6,9.6,Wd*0.92,body,body);}
  else if(st==='ute'){cab(L*0.08,L*0.28,7);for(const sz of [1,-1])box(-L*0.28,y0+hb,L*0.42,4,1.6,body,body,sz*(Wd/2-0.8));box(-L/2+0.8,y0+hb,1.6,4,Wd,body,body);}
  else if(st==='cruiser'){cab(-L*0.06,L*0.56,9,Wd*0.9);box(-L*0.05,y0+hb+10.6,L*0.4,1.2,Wd*0.7,trim);}
  else if(st==='buggy'){const bar=col3('#2a1a10');for(const sx of [-0.2,0.16])for(const sz of [1,-1])box(L*sx,y0+hb,1.6,10,1.6,bar,bar,sz*(Wd/2-4));box(-L*0.02,y0+hb+10,L*0.38,1.4,Wd-7,bar);box(-L*0.05,y0+hb,7,6,7,col3('#3a2f28'));}
  else if(st==='brute'){cab(-L*0.12,L*0.3,7,Wd*0.7);box(L*0.4,y0+1,4,hb+3,Wd+3,trim);for(const sz of [1,-1])box(0,y0+2,L*0.7,hb,1.5,trim,trim,sz*(Wd/2+0.8));box(-L*0.32,y0+hb,L*0.22,5,Wd*0.8,col3('#3a2f28'));}
  if(st!=='buggy')for(const sz of [1,-1]){box(L/2,y0+hb*0.5,0.8,2.4,3.4,col3('#f0e6c0'),null,sz*(Wd/2-4));box(-L/2,y0+hb*0.5,0.8,2.2,3.4,col3('#a02818'),null,sz*(Wd/2-4));}
  return gb;}
function personModel3(look,kind){const gb=new GB(),shirt=col3(look&&look.shirt||'#5a3f2a'),skin=col3(look&&look.skin||'#d9b48c'),pants=col3(kind==='foe'?'#2b2420':'#3b3026');
  gb.box(0,0,-2.4,3.6,8,3.4,0,pants);gb.box(0,0,2.4,3.6,8,3.4,0,pants);gb.box(0,8,0,5.5,7.5,9,0,shirt);gb.box(0,8.5,-5.6,3,6.5,2.4,0,skin);gb.box(0,8.5,5.6,3,6.5,2.4,0,skin);
  gb.box(0.5,15.5,0,5,4.8,4.8,0,skin);if(look&&look.hat){gb.box(0.5,19.6,0,8.5,1,8.5,0,col3(look.hat));gb.box(0.5,20.4,0,5,2.6,5,0,col3(look.hat));}
  else gb.box(-0.4,19.8,0,5.4,1.6,5.4,0,col3('#3b2a1c'));return gb;}
// the height things sit at: the hills, less a creek bed's dip (roads keep you up on the road)
function groundY3(x,y){const h=heightAt(x,y),t=terrainAt(x,y);if(t===T.DRY){const ri=roadInfo(x,y);if(!(ri.r>=0&&ri.d<ri.w/2+26))return h-9;}return h;}
function syncDynamic3(){const sc=V3.scene,seen=new Set(),b=body();
  for(const c of G.cars){if(Math.abs(c.x-b.x)>V3_FOG_FAR+200||Math.abs(c.y-b.y)>V3_FOG_FAR+200)continue;
    let e=V3.cars.get(c);if(!e||e.wrecked!==c.wrecked||e.hero!==(c.driver==='hero')){if(e)drop3(e.m);const m=carModel3(c).mesh(V3.mats.vc);m.matrixAutoUpdate=true;sc.add(m);
      e={m,wrecked:c.wrecked,hero:c.driver==='hero'};V3.cars.set(c,e);}seen.add(c);
    const L=c.def.len,W2=c.def.wid,fx=Math.cos(c.a),fy=Math.sin(c.a),gy=groundY3(c.x,c.y);
    const hf=groundY3(c.x+fx*L*0.4,c.y+fy*L*0.4),hbk=groundY3(c.x-fx*L*0.4,c.y-fy*L*0.4),hr=groundY3(c.x-fy*W2*0.45,c.y+fx*W2*0.45),hl=groundY3(c.x+fy*W2*0.45,c.y-fx*W2*0.45);
    e.m.position.set(c.x,Math.max(gy,(hf+hbk)/2),c.y);e.m.rotation.set(-Math.atan2(hr-hl,W2*0.9),-c.a,Math.atan2(hf-hbk,L*0.8),'YZX');}
  for(const [c,e] of V3.cars)if(!seen.has(c)){drop3(e.m);V3.cars.delete(c);}
  // people: you on foot, townsfolk, raiders on foot, your companion
  const h=G.hero,folk=[];if(!h.inCar)folk.push([h,null,'hero']);for(const n of G.npcs)folk.push([n,n.look,'npc']);for(const f of G.foes)folk.push([f,f.look,'foe']);if(G.comp&&!G.comp.inCar)folk.push([G.comp,G.comp.look,'npc']);
  const pseen=new Set();
  for(const [p,look,kind] of folk){if(Math.abs(p.x-b.x)>2600||Math.abs(p.y-b.y)>2600)continue;let m=V3.people.get(p);if(!m){m=personModel3(look,kind).mesh(V3.mats.vc);m.matrixAutoUpdate=true;sc.add(m);V3.people.set(p,m);}pseen.add(p);
    const indoors=p!==h&&p.loc&&p.loc.bld&&p.loc.bld.some(bd=>!bd.tank&&bd.roofA>0.5&&bInside(bd,p.x,p.y,0)),down=p.dead||p.state==='down';
    m.visible=!indoors;m.position.set(p.x,groundY3(p.x,p.y)+(down?2:0),p.y);m.rotation.set(down?Math.PI/2:0,-(p.a||0),0,'YZX');m.scale.set(1,p.crouch?0.8:1,1);}
  for(const [p,m] of V3.people)if(!pseen.has(p)){drop3(m);V3.people.delete(p);}
  // soft shadows under everything that moves
  let si=0;const shadow=(x,y,rx,rz,a)=>{let s=V3.shadows[si];if(!s){s=new THREE.Mesh(V3.blob,V3.mats.shadow);V3.shadows.push(s);sc.add(s);}si++;s.visible=true;s.position.set(x,groundY3(x,y)+3.4,y);s.rotation.y=-a;s.scale.set(rx,1,rz);};
  for(const [c] of V3.cars)shadow(c.x+3,c.y+4,c.def.len*0.6,c.def.wid*0.62,c.a);
  for(const [p,m] of V3.people)if(m.visible)shadow(p.x+2,p.y+3,7,6,0);
  for(;si<V3.shadows.length;si++)V3.shadows[si].visible=false;}

/* ---- streaming: build what's near, nearest first, a few milliseconds a frame; drop what's far behind ---- */
function stream3(bx,by){const t0=performance.now(),cx=Math.floor(bx/CH),cy=Math.floor(by/CH),need=[];
  for(let j=-V3_RAD;j<=V3_RAD;j++)for(let i=-V3_RAD;i<=V3_RAD;i++){const k=(cx+i)+','+(cy+j);if(!V3.chunks.has(k))need.push([i*i+j*j,cx+i,cy+j,k]);}
  need.sort((a,b)=>a[0]-b[0]);
  for(let n=0;n<need.length&&(n<1||performance.now()-t0<7);n++){const [,i,j,k]=need[n],g=buildChunk3(getChunk(i,j));g.updateMatrix();V3.scene.add(g);V3.chunks.set(k,g);}
  for(const [k,g] of V3.chunks){const [i,j]=k.split(',').map(Number);if(Math.abs(i-cx)>V3_RAD+1||Math.abs(j-cy)>V3_RAD+1){drop3(g);V3.chunks.delete(k);}}
  V3.scanT-=1;if(V3.scanT>0)return;V3.scanT=15;   // landforms and places: look round every quarter second or so
  const keep=(map,list,build,far)=>{const live=new Set();for(const o of list){live.add(o.id);if(!map.has(o.id)){const m=build(o);if(m)V3.scene.add(m);map.set(o.id,{m,o});}}
    for(const [id,e] of map)if(!live.has(id)&&Math.hypot(e.o.x-bx,e.o.y-by)>far(e.o)){drop3(e.m);map.delete(id);}};
  keep(V3.mesas,mesasNear(bx,by,V3_FOG_FAR+500).filter(m=>Math.hypot(m.x-bx,m.y-by)<V3_FOG_FAR+m.maxR+300),buildMesa3,m=>V3_FOG_FAR+m.maxR+900);
  keep(V3.shells,shellsNear(bx,by,V3_FOG_FAR).filter(s=>Math.hypot(s.x-bx,s.y-by)<V3_FOG_FAR),buildShell3,()=>V3_FOG_FAR+700);
  keep(V3.locs,LOCS.filter(l=>Math.hypot(l.x-bx,l.y-by)<l.rad+V3_FOG_FAR+300),buildLoc3,l=>l.rad+V3_FOG_FAR+1200);}
// forget everything built so far (the world has changed under us: a new game, a loaded save, a teleport)
function reset3D(){if(V3.status!=='ready')return;for(const map of [V3.chunks]){for(const [,g] of map)drop3(g);map.clear();}
  for(const map of [V3.mesas,V3.shells,V3.locs]){for(const [,e] of map)drop3(e.m);map.clear();}V3.scanT=0;}

/* ---- the frame ---- */
function render3D(){const now=performance.now(),dt=V3.last?Math.min(0.1,(now-V3.last)/1000):0.016;V3.last=now;
  const R=V3.R,cam=V3.cam,sc=V3.scene,car=heroCar(),b=body();
  if(V3.canvas.style.display==='none'){V3.canvas.style.display='block';V3.yaw=car?car.a:G.hero.a;}
  if(V3.lastB&&Math.hypot(b.x-V3.lastB.x,b.y-V3.lastB.y)>3000){reset3D();V3.yaw=car?car.a:G.hero.a;}V3.lastB={x:b.x,y:b.y};   // a long jump (a new game, a load): rebuild round the new spot
  const dpr=Math.min(window.devicePixelRatio||1,1.5);if(V3.w!==W||V3.h!==H||V3.dpr!==dpr){V3.w=W;V3.h=H;V3.dpr=dpr;R.setPixelRatio(dpr);R.setSize(W,H,false);V3.canvas.style.width=W+'px';V3.canvas.style.height=H+'px';cam.aspect=W/H;cam.updateProjectionMatrix();}
  stream3(b.x,b.y);syncDynamic3();
  for(const [,e] of V3.locs)if(e.m&&e.m.userData.roofs)e.m.userData.roofs.visible=!e.o.bld.some(bd=>!bd.tank&&bd.roofA!==undefined&&bd.roofA<0.5);   // step indoors and the roof lifts off, as in 2D
  // chase camera: behind and above, swinging round after the car's heading (or the way you're facing on foot)
  const want=car?car.a:G.hero.a;V3.yaw+=angDiff(want,V3.yaw)*Math.min(1,dt*(car?2.6:3.5));
  const zm=clamp(SETTINGS.zoom,ZMIN,ZMAX),spd=car?Math.min(1,car.speed/500):0,gy=groundY3(b.x,b.y);
  let dist=(car?150+60*spd:78)/zm;const hgt=(car?50+12*spd:34)/Math.sqrt(zm);
  let camX=b.x,camZ=b.y;for(let k=0;k<8;k++){camX=b.x-Math.cos(V3.yaw)*dist;camZ=b.y-Math.sin(V3.yaw)*dist;if(!insideMesa(camX,camZ,12))break;dist*=0.75;}   // never back the camera into a cliff
  const camY=Math.max(gy+hgt,heightAt(camX,camZ)+16),sh=G.shake*0.6;
  cam.position.set(camX+rand(-sh,sh),camY+rand(-sh,sh)*0.5,camZ+rand(-sh,sh));
  const ahead=car?70:30;cam.lookAt(b.x+Math.cos(V3.yaw)*ahead,gy+(car?16:15),b.y+Math.sin(V3.yaw)*ahead);
  // light: day to night, the haze matching the sky
  const dk=darkness(),sky=new THREE.Color(0xe8c79a).lerp(new THREE.Color(0x15121c),clamp(dk/0.8,0,1));
  sc.background.copy(sky);sc.fog.color.copy(sky);V3.hemi.intensity=0.55*(1-dk)+0.13;V3.sun.intensity=Math.max(0,0.58*(1-dk*1.25));
  V3.sun.position.set(b.x-600,gy+1000,b.y-550);V3.sun.target.position.set(b.x,gy,b.y);V3.sun.target.updateMatrixWorld();
  const lit=!!car&&headlightsOn()&&car.fuel>0&&!carDead(car);V3.head.intensity=lit?1.6:0;
  if(car){const fx=Math.cos(car.a),fy=Math.sin(car.a);V3.head.position.set(car.x+fx*car.def.len*0.5,gy+10,car.y+fy*car.def.len*0.5);V3.headT.position.set(car.x+fx*400,gy-10,car.y+fy*400);V3.headT.updateMatrixWorld();}
  if(V3.camOverride){const o=V3.camOverride;cam.position.set(o.x,o.y,o.z);cam.lookAt(o.tx,o.ty,o.tz);}   // tests can look from anywhere
  R.render(sc,cam);
  // the 2D canvas lies over the top, clear, for the screen effects that don't need the world
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  if(G.hurt>0){ctx.fillStyle='rgba(194,56,31,'+(G.hurt*0.3).toFixed(3)+')';ctx.fillRect(0,0,W,H);}
  if(G.hero.rest<20){const k=(20-G.hero.rest)/20*(0.55+0.25*Math.sin(G.time*1.7));const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.15,W/2,H/2,Math.max(W,H)*0.6);
    g.addColorStop(0,'rgba(10,6,4,0)');g.addColorStop(1,'rgba(10,6,4,'+k.toFixed(3)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  if(state==='play')guide3D();}
// route guidance, as in 2D: an arrow at the screen's edge toward your marker, the road you've left, or your parked car
const V3P={v:null};
function arrow3D(wx,wy,label,col){if(!V3P.v)V3P.v=new THREE.Vector3();const v=V3P.v.set(wx,groundY3(wx,wy)+20,wy).project(V3.cam);
  let sx=(v.x+1)/2*W,sy=(1-v.y)/2*H;const behind=v.z>1;
  if(!behind&&sx>40&&sx<W-40&&sy>150&&sy<H-40)return;   // already on screen: no arrow needed
  // behind you, the projection flips: point by bearing instead (straight ahead is up, to your right is right)
  const a=behind?-Math.PI/2+angDiff(Math.atan2(wy-V3.cam.position.z,wx-V3.cam.position.x),V3.yaw):Math.atan2(sy-H/2,sx-W/2),m=60,ex=clamp(W/2+Math.cos(a)*W,m,W-m),ey=clamp(H/2+Math.sin(a)*H,m+110,H-m);
  ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.globalAlpha=0.6+0.4*Math.sin(G.time*6);ctx.fillStyle=col;ctx.strokeStyle='#efe2c4';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-10,-12);ctx.lineTo(-4,0);ctx.lineTo(-10,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  ctx.globalAlpha=1;ctx.font='700 15px "Barlow Condensed", Arial, sans-serif';ctx.textAlign='center';ctx.fillStyle='#efe2c4';ctx.fillText(label,ex-Math.cos(a)*36,ey-Math.sin(a)*36+5);}
function guide3D(){const b=body(),h=G.hero;
  const wp=G.waypoint!=null?G.markers.find(m=>m.id===G.waypoint):null;if(wp)arrow3D(wp.x,wp.y,wp.text+', '+km(Math.hypot(wp.x-b.x,wp.y-b.y)).toFixed(1)+' km','#f2a03d');
  if(G.leg&&!G.onLeg&&G.legNear)arrow3D(G.legNear.x,G.legNear.y,'road','#f2a03d');
  if(!h.inCar){const lc=carById(G.lastCar);if(lc&&!lc.wrecked)arrow3D(lc.x,lc.y,'your car','#efe2c4');}}
