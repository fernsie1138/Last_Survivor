/* ===== vehicles: roster, physics, collisions ===== */
// Fictional late-70s Australian cars. off = how well it copes off-road (1 = no penalty).
const CARS={
  kestrel:{name:'Kestrel GT coupe',style:'coupe',len:46,wid:24,maxSpeed:500,acc:400,grip:5.6,turn:2.6,mass:1.6,burn:1.0,off:0.5,col:'#2b2420',trim:'#f2a03d',pitch:1,armor:1.0,boot:50},
  kingsford:{name:'Kingsford sedan',style:'sedan',len:48,wid:25,maxSpeed:440,acc:320,grip:6,turn:2.5,mass:1.7,burn:0.8,off:0.52,col:'#7c8668',trim:'#c9c2b5',pitch:1.1,armor:1.15,boot:70},
  wagon:{name:'Kingsford wagon',style:'wagon',len:52,wid:25,maxSpeed:420,acc:300,grip:6,turn:2.4,mass:1.9,burn:0.85,off:0.52,col:'#9a7b4f',trim:'#c9c2b5',pitch:1.1,armor:1.2,boot:110},
  ute:{name:'Bushmaster ute',style:'ute',len:50,wid:25,maxSpeed:450,acc:340,grip:6,turn:2.5,mass:1.7,burn:0.9,off:0.66,col:'#c08a2e',trim:'#3a2f28',pitch:1.05,armor:1.2,boot:130},
  van:{name:'Dune Runner panel van',style:'van',len:50,wid:26,maxSpeed:430,acc:310,grip:5.8,turn:2.4,mass:1.9,burn:0.95,off:0.5,col:'#3f6a66',trim:'#f2a03d',pitch:1.05,armor:1.25,boot:150},
  cruiser:{name:'Landmaster 4x4',style:'cruiser',len:46,wid:27,maxSpeed:390,acc:300,grip:6.8,turn:2.4,mass:2.3,burn:0.9,off:0.88,col:'#d6cbb2',trim:'#5a4636',pitch:0.85,armor:1.7,boot:110},
  bike:{name:'Trailhawk motorbike',style:'bike',len:30,wid:11,maxSpeed:520,acc:500,grip:5,turn:3.4,mass:0.7,burn:0.45,off:0.72,col:'#8f3a17',trim:'#c9c2b5',pitch:1.6,armor:0.6,boot:8},
  buggy:{name:'Raider buggy',style:'buggy',len:38,wid:22,maxSpeed:530,acc:430,grip:5,turn:3.2,mass:1,burn:0.9,off:0.7,col:'#8f3a17',trim:'#d8cdb5',pitch:1.3,armor:0.9,boot:20,stab:100,soft:1},
  brute:{name:'Raider war wagon',style:'brute',len:56,wid:32,maxSpeed:470,acc:330,grip:6,turn:2.4,mass:2.4,burn:1.4,off:0.6,col:'#5a4636',trim:'#9c958a',pitch:0.75,armor:1.8,boot:60,stab:170,soft:0.55}};
let carSeq=0;
const TYRE_NAMES=['front-left','front-right','rear-left','rear-right'];
// four tyres, each with its own condition. car.tyres reads as their average; setting it sets all four.
function addTyres(c,init){c.tw=init&&init.length===4?init.slice():[100,100,100,100];
  Object.defineProperty(c,'tyres',{get(){return (this.tw[0]+this.tw[1]+this.tw[2]+this.tw[3])/4;},set(v){const t=clamp(v,0,100);this.tw=[t,t,t,t];},enumerable:false,configurable:true});return c;}
function flats(c){return c.tw?c.tw.filter(t=>t<=0).length:0;}
function wearTyres(c,amt){for(let i=0;i<4;i++){if(c.tw[i]<=0)continue;c.tw[i]=Math.max(0,c.tw[i]-amt*(i<2?0.9:1.1));if(c.tw[i]<=0&&c.driver==='hero')showMsg('The '+TYRE_NAMES[i]+' tyre has blown!',2.2);}}
function hitTyre(c,dmg){const live=[0,1,2,3].filter(i=>c.tw[i]>0);if(!live.length)return;const i=live[Math.floor(Math.random()*live.length)];c.tw[i]=Math.max(0,c.tw[i]-dmg);
  if(c.driver==='hero')showMsg(c.tw[i]<=0?'They blew out the '+TYRE_NAMES[i]+' tyre!':'They hit the '+TYRE_NAMES[i]+' tyre!',1.8);}
function fitSpare(c,q){let w=0;for(let i=1;i<4;i++)if(c.tw[i]<c.tw[w])w=i;c.tw[w]=q||100;return TYRE_NAMES[w];}
function addPart(c,p,amt){if(p==='tyres'){for(let i=0;i<4;i++)c.tw[i]=Math.min(100,c.tw[i]+amt);}else c[p]=Math.min(100,c[p]+amt);}
function carDead(c){return c.engine<=0?'engine':c.cond<=0?'body':null;}
function makeCar(type,x,y,a,o){const d=CARS[type];o=Object.assign({},o||{});const ty=o.tyres,tw=o.tw;delete o.tyres;delete o.tw;
  const c=Object.assign({kind:'car',id:'v'+(carSeq++),type,def:d,x,y,a,vx:0,vy:0,speed:0,vf:0,slip:0,steer:0,flash:0,stagger:0,
    onRoad:true,ri:NOROAD,acc:d.acc,maxSpeed:d.maxSpeed,drag:0.18,grip:d.grip,turn:d.turn,mass:d.mass,r:d.len/2.3,
    dir:1,fuel:100,cond:100,engine:100,susp:100,items:{},ups:{},driver:null,touched:false,wrecked:false,burn:0,sleep:0,wipe:0,wobT:Math.random()*10},o);
  addTyres(c,tw);if(ty!==undefined&&!tw)c.tyres=ty;return c;}
function onRoadAt(c){const s=surfaceAt(c.x,c.y);c.ri=s.ri;c.onRoad=s.on;c.surf=s.cls;c.terr=terrainAt(c.x,c.y);
  c.biome=getChunk(Math.floor(c.x/CH),Math.floor(c.y/CH)).biome;}
function driveCar(c,thr,steer,dt,boost,drift){
  const d=c.def,on=c.onRoad,S=c.surf||ROADCLS.highway,um=upMods(c),offMax=clamp((d.off*(c.biome?c.biome.off:1)+um.off)*(c.terr===T.DRY?0.8:1),0.3,1);   // soft sand in a dry riverbed drags at the wheels
  const suspF=0.7+0.3*Math.min(1,c.susp/100),rough=!on||S!==ROADCLS.highway,fl=flats(c),brokenSprings=c.susp<=0;   // worn springs hurt on rough ground
  const sMax=(on?Math.max(S.max,offMax):offMax)*(brokenSprings?0.7:rough?suspF:1)*Math.max(0.2,1-0.2*fl),   // broken springs: −30%; each flat: −20%
    sAcc=on?S.acc:0.5+offMax*0.45,sDrag=on?S.drag:1+(1-offMax)*3;
  const health=0.55+0.45*Math.min(1,c.engine/40);
  const fx=Math.cos(c.a),fy=Math.sin(c.a),rx=-fy,ry=fx;
  let vf=c.vx*fx+c.vy*fy,vr=c.vx*rx+c.vy*ry;
  const sl=slopeFactor(c.x,c.y,c.speed>20?c.vx:Math.cos(c.a),c.speed>20?c.vy:Math.sin(c.a),true);   // hills: slower uphill, a little quicker down
  const max=c.maxSpeed*sMax*health*um.max*sl*(on&&S===ROADCLS.highway?um.hwy:1)*(boost?1.4:1);
  if(c.cruise){   // the stick held part-way: hold that fraction of top speed instead of creeping up to full
    const want=max*c.cruise;if(vf<want)vf=Math.min(want,vf+c.acc*um.acc*sAcc*(0.35+0.65*c.cruise)*(0.5+0.5*Math.min(1,c.engine/50))*dt);else vf+=(want-vf)*Math.min(1,dt*1.5);}
  else if(thr>=0){if(vf<max)vf=Math.min(max,vf+thr*c.acc*um.acc*sAcc*(0.5+0.5*Math.min(1,c.engine/50))*(boost?1.6:1)*dt);}
  else vf+=thr*c.acc*(vf>0?1.8:0.7)*dt;
  if(vf>max&&!carDead(c))vf=max+(vf-max)*Math.exp(-(on?2:3.5)*dt);   // with no power at all, the car just coasts
  // the brake pedal: bleeds speed toward a standstill and holds it there, never into reverse
  if(c.braking){const dec=c.acc*0.8*dt*(on?1:0.75)*(0.6+0.4*Math.min(1,c.tyres/50));if(Math.abs(vf)<=dec)vf=0;else vf-=Math.sign(vf)*dec;vr*=Math.exp(-2*dt);}
  if(vf<-max*0.35)vf=-max*0.35;
  vf*=Math.exp(-c.drag*sDrag*dt);
  let g=c.grip*(on?S.grip:0.6+0.4*offMax)*(0.55+0.45*Math.min(1,c.tyres/60))*(1-0.12*fl);if(drift)g*=0.22;else if(boost)g*=0.6;if(c.stagger>0)g*=0.3;if(c.wipe>0)g*=0.05;
  vr*=Math.exp(-g*dt);
  c.steer=steer;const sf=clamp(Math.abs(vf)/120,0,1);
  c.a+=steer*c.turn*(1-0.12*fl)*dt*sf*(1-0.4*Math.min(1,Math.abs(vf)/600))*(vf>=0?1:-1);
  // broken springs and flat tyres make the car wobble, and a flat on one side drags it that way
  const wob=(brokenSprings?0.55:0)+fl*0.45;
  if(wob>0&&Math.abs(vf)>30){c.wobT+=dt;const spd=Math.min(1,Math.abs(vf)/300);c.a+=(Math.sin(c.wobT*8.5)*0.7+Math.sin(c.wobT*13.1)*0.3+(Math.random()-0.5)*0.8)*wob*0.9*dt*(0.4+spd);}
  if(fl&&Math.abs(vf)>30){const bias=((c.tw[0]<=0)+(c.tw[2]<=0))-((c.tw[1]<=0)+(c.tw[3]<=0));c.a-=bias*0.28*dt*sf*(vf>=0?1:-1);}
  c.vx=fx*vf+rx*vr;c.vy=fy*vf+ry*vr;
  c.x+=c.vx*dt;c.y+=c.vy*dt;
  c.vf=vf;c.slip=Math.abs(vr);c.speed=Math.hypot(c.vx,c.vy);
}
// cars nobody is driving: handbrake on, roll to a stop, then sleep
function idleCar(c,dt){
  if(c.speed<2&&c.sleep>0.5){c.vx=c.vy=0;c.speed=0;return;}
  c.sleep+=dt;onRoadAt(c);
  driveCar(c,0,0,dt,false,false);
  const k=Math.exp(-(c.wrecked?4:2.5)*dt);c.vx*=k;c.vy*=k;c.speed=Math.hypot(c.vx,c.vy);
  if(c.speed>2)c.sleep=0;
}
function crash(c,imp,x,y,nose){
  if(c.kind!=='car'||imp<120)return;sparks(x,y,Math.min(14,(imp/40)|0));c.sleep=0;
  if(c.driver==='raider'){if(window.__stats)window.__stats.raiderCrash=(window.__stats.raiderCrash||0)+1;c.stab-=(imp-100)*0.9*c.soft;c.flash=1;if(c.stab<=0)startWipe(c);return;}
  const um=upMods(c),front=!!nose,hit=(imp-120)*0.06/c.def.armor/um.armor*(front?um.frontCrash:1);
  c.cond-=hit;c.susp=Math.max(0,c.susp-hit*0.25);if(front)c.engine=Math.max(0,c.engine-hit*0.35);c.flash=1;
  if(c.driver==='hero'){SFX.hit(0.4);G.shake=Math.max(G.shake,Math.min(14,imp/30));if(imp>220)hurtHero((imp-220)*0.04,'crash');}
}
// nose: was the car pointing into what it hit? (decided before the bounce turns the car away)
function bounce(b,nx,ny){const vn=b.vx*nx+b.vy*ny,nose=b.kind==='car'&&(Math.cos(b.a)*-nx+Math.sin(b.a)*-ny)>0.5;if(window.__stats&&b.driver==='raider'&&vn<-30){window.__stats.contacts=(window.__stats.contacts||0)+1;b.lastHit='rock';}
  if(vn<0){b.vx-=1.35*vn*nx;b.vy-=1.35*vn*ny;b.vx*=0.85;b.vy*=0.85;crash(b,-vn,b.x-nx*b.r,b.y-ny*b.r,nose);}}
// rocks and wrecks against anything with x,y,vx,vy,r (cars and the hero)
// push a circle (local coords lx,ly radius r) out of an axis-aligned box; returns [dx,dy] or null
function pushOutBox(lx,ly,r,x0,y0,x1,y1){const qx=clamp(lx,x0,x1),qy=clamp(ly,y0,y1);let nx=lx-qx,ny=ly-qy,d=Math.hypot(nx,ny);
  if(d>=r)return null;if(d<1e-4){const l=lx-x0,rr=x1-lx,t=ly-y0,bb=y1-ly,m=Math.min(l,rr,t,bb);
    return m===l?[-(l+r),0]:m===rr?[rr+r,0]:m===t?[0,-(t+r)]:[0,bb+r];}
  return [nx/d*(r-d),ny/d*(r-d)];}
function wallBoxes(b){if(b._walls)return b._walls;const hw=b.w/2,hh=b.h/2,t=4,g=b.door/2;
  b._walls=b.tank?[[-hw,-hh,hw,hh]]:[[-hw-t,-hh-t,hw+t,-hh+t],[-hw-t,-hh,-hw+t,hh+t],[hw-t,-hh,hw+t,hh+t],[-hw-t,hh-t,-g,hh+t],[g,hh-t,hw+t,hh+t]];return b._walls;}
function collideWalls(b,o){if(!o.wall.length)return;const wr=o.rad-40,dx=b.x-o.x,dy=b.y-o.y,dist=Math.hypot(dx,dy);
  if(Math.abs(dist-wr)>b.r+24)return;const ang=Math.atan2(dy,dx),span=(b.r+40)/wr;
  for(const w of o.wall){if(Math.abs(angDiff(w.a,ang))>span)continue;const R=wr+w.j,cx=o.x+Math.cos(w.a)*R,cy=o.y+Math.sin(w.a)*R,rot=w.a+Math.PI/2,c=Math.cos(rot),s=Math.sin(rot);
    const ex=b.x-cx,ey=b.y-cy,lx=ex*c+ey*s,ly=-ex*s+ey*c,p=pushOutBox(lx,ly,b.r,-26,-9,26,9);if(!p)continue;
    const wx=p[0]*c-p[1]*s,wy=p[0]*s+p[1]*c,l=Math.hypot(wx,wy)||1;b.x+=wx;b.y+=wy;bounce(b,wx/l,wy/l);}}
function collideBuildings(b){const o=nearLoc(b.x,b.y,200);if(!o)return;const person=b.kind!=='car';collideWalls(b,o);
  for(const bd of o.bld){if(Math.abs(bd.x-b.x)>bd.w+60||Math.abs(bd.y-b.y)>bd.w+60)continue;
    const c=Math.cos(bd.rot),s=Math.sin(bd.rot);let [lx,ly]=bLocal(bd,b.x,b.y);
    const boxes=person?wallBoxes(bd):[[-bd.w/2,-bd.h/2,bd.w/2,bd.h/2]];
    for(const bx of boxes){const p=pushOutBox(lx,ly,b.r,bx[0],bx[1],bx[2],bx[3]);if(!p)continue;lx+=p[0];ly+=p[1];
      const wx=p[0]*c-p[1]*s,wy=p[0]*s+p[1]*c,l=Math.hypot(wx,wy)||1;b.x+=wx;b.y+=wy;bounce(b,wx/l,wy/l);}}}
function collideWorld(b){
  collideBuildings(b);
  // a mesa's cliffs: hitting one in a car is like hitting a boulder; on foot it simply stops you
  collideShells(b);
  {const hit=collideMesas(b);if(hit&&b.kind==='car')bounce(b,hit.nx,hit.ny);else if(hit){const vn=b.vx*hit.nx+b.vy*hit.ny;if(vn<0){b.vx-=vn*hit.nx;b.vy-=vn*hit.ny;}}}
  // impassable ground (sea, flowing rivers, canyons): push back to the nearest open ground
  const tt=terrainAt(b.x,b.y);
  if(T_BLOCKED[tt]){let done=false;
    for(const dist of [10,20,32,48,72,110,160]){for(let k=0;k<16&&!done;k++){const a=k/16*TAU,x=b.x+Math.cos(a)*dist,y=b.y+Math.sin(a)*dist;
      if(!blockedAt(x,y)){const nx=Math.cos(a),ny=Math.sin(a);b.x=x;b.y=y;done=true;
        {const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=vn*nx;b.vy-=vn*ny;}b.vx*=0.7;b.vy*=0.7;   // water or a canyon edge: you stop short
          if(tt!==T.CANYON&&b.speed>80&&Math.random()<0.5)part({kind:'smoke',x:b.x-nx*20,y:b.y-ny*20,vx:-nx*40,vy:-ny*40,life:.6,max:.6,size:8,grow:20,drag:2,col:'#cfe3e0'});}}}if(done)break;}}
  chunksAround(b.x,b.y,ch=>{
    for(const k of ch.rocks){const dx=b.x-k.x,dy=b.y-k.y,d=Math.hypot(dx,dy),min=b.r+k.r*0.85;
      if(d<min&&d>1e-4){const nx=dx/d,ny=dy/d;b.x=k.x+nx*min;b.y=k.y+ny*min;bounce(b,nx,ny);}}
    for(const w of ch.wrecks){const cs=Math.cos(w.rot),sn=Math.sin(w.rot),dx=b.x-w.x,dy=b.y-w.y;
      const lx=dx*cs+dy*sn,ly=-dx*sn+dy*cs,hx=w.w/2,hy=w.h/2;
      const qx=clamp(lx,-hx,hx),qy=clamp(ly,-hy,hy);let nlx=lx-qx,nly=ly-qy,d=Math.hypot(nlx,nly);
      if(d>=b.r)continue;
      if(d<1e-4){const px=hx-Math.abs(lx),py=hy-Math.abs(ly);
        if(px<py){nlx=Math.sign(lx)||1;nly=0;d=-px;}else{nlx=0;nly=Math.sign(ly)||1;d=-py;}}
      else{nlx/=d;nly/=d;}
      const nx=nlx*cs-nly*sn,ny=nlx*sn+nly*cs,push=b.r-d;b.x+=nx*push;b.y+=ny*push;bounce(b,nx,ny);}
  });
}
function carPair(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,min=a.r+b.r,d2=dx*dx+dy*dy;if(d2>=min*min||d2<1e-6)return;
  const ma=(a.wrecked?a.mass*3:a.mass)+upMods(a).mass,mb=(b.wrecked?b.mass*3:b.mass)+upMods(b).mass;
  const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,pen=min-d,ia=1/ma,ib=1/mb,s=ia+ib;
  a.x-=nx*pen*ia/s;a.y-=ny*pen*ia/s;b.x+=nx*pen*ib/s;b.y+=ny*pen*ib/s;a.sleep=b.sleep=0;
  const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv>=0)return;
  const j=-1.3*rv/s;a.vx-=j*ia*nx;a.vy-=j*ia*ny;b.vx+=j*ib*nx;b.vy+=j*ib*ny;
  const imp=-rv;if(imp<35)return;sparks(a.x+nx*a.r,a.y+ny*a.r,Math.min(12,(imp/30)|0));
  const hc=heroCar(),ra=a.driver==='raider',rb=b.driver==='raider';
  if((a===hc&&rb)||(b===hc&&ra)){
    const p=hc,e=a===hc?b:a,sg=a===hc?1:-1,px=nx*sg,py=ny*sg;
    const vp=p.vx*px+p.vy*py,ve=-(e.vx*px+e.vy*py);
    const pm=upMods(p),nose=(Math.cos(p.a)*px+Math.sin(p.a)*py)>0.5;
    if(e.mode!=='swipe'&&vp>=ve){ // you hit them: a roo bar adds to rams, spiked hubs to side-swipes
      e.stab-=imp*0.75*e.soft*(nose?pm.ram:pm.swipe);e.stagger=0.55;p.cond-=Math.max(0,imp-90)*0.02/p.def.armor/pm.armor;
      if(imp>90)popText(e.x,e.y-22,'Shoved','#efe2c4');
    } else {                        // they hit you
      e.stab-=imp*0.1*e.soft;p.stagger=0.35;p.cond-=Math.max(0,imp-40)*0.026*Math.sqrt(e.mass)/p.def.armor/pm.armor;p.flash=1;
      G.shake=Math.max(G.shake,Math.min(12,imp/25));if(imp>220)hurtHero((imp-220)*0.04,'crash');
    }
    SFX.hit(imp/400);
  } else {
    if(ra)a.stab-=imp*0.1*a.soft;if(rb)b.stab-=imp*0.1*b.soft;
    const dmg=Math.max(0,imp-80)*0.03;if(!ra)a.cond-=dmg/a.def.armor;if(!rb)b.cond-=dmg/b.def.armor;
    if(a===hc||b===hc){SFX.hit(imp/400);G.shake=Math.max(G.shake,Math.min(10,imp/30));}
  }
}
function wreckCar(c){
  if(c.wrecked)return;c.wrecked=true;c.burn=8;c.cond=0;c.fuel=0;
  explode(c.x,c.y,false);G.removed.add(c.id);
  if(c.driver==='hero'){exitCar(true);hurtHero(25,'wreck');showMsg('Thrown clear of the wreck',2.4);}
  c.driver=null;
}
function addTracks(c){
  const fx=Math.cos(c.a),fy=Math.sin(c.a),bx=c.x-fx*c.r*0.7,by=c.y-fy*c.r*0.7,sw=c.def.style==='bike'?0:c.r*0.55,ox=-fy*sw,oy=fx*sw;
  const w1x=bx+ox,w1y=by+oy,w2x=bx-ox,w2y=by-oy;
  if(c.lw&&c.speed>25){const dd=Math.hypot(w1x-c.lw[0],w1y-c.lw[1]);
    if(dd>9){const al=c.onRoad?clamp((c.slip-60)/300,0,0.5):clamp(0.14+c.slip/500,0.14,0.5);
      if(al>0.01){G.tracks.push({a:c.lw[0],b:c.lw[1],c:w1x,d:w1y,al,age:0});
        if(sw)G.tracks.push({a:c.lw[2],b:c.lw[3],c:w2x,d:w2y,al,age:0});
        if(G.tracks.length>1000)G.tracks.splice(0,G.tracks.length-1000);}
      c.lw=[w1x,w1y,w2x,w2y];}}
  else c.lw=[w1x,w1y,w2x,w2y];
  const rate=c.onRoad?c.slip/400:c.speed/320+c.slip/300;
  for(let k=0;k<2;k++)if(Math.random()<rate){const x=k?w2x:w1x,y=k?w2y:w1y;
    part({x,y,vx:-c.vx*0.1+rand(-20,20),vy:-c.vy*0.1+rand(-20,20),life:rand(.8,1.6),max:1.6,size:rand(5,9),grow:c.onRoad?12:20,drag:1.6,col:c.onRoad?'#cdb89a':'#ecd2a0'});}
}
