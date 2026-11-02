/* ===== raiders ===== */
let raiderSeq=0;
function makeRaider(type,x,y,a,v){const d=CARS[type];
  return makeCar(type,x,y,a,{id:'r'+(raiderSeq++),driver:'raider',vx:Math.cos(a)*v,vy:Math.sin(a)*v,stab:d.stab,maxStab:d.stab,soft:d.soft,
    mode:'chase',modeT:rand(1,2.5),side:Math.random()<0.5?-1:1,wipe:0,spin:0,fuel:100});}
function startWipe(e){if(e.wipe>0||e.dead||e.driver!=='raider')return;if(window.__stats){const k='wipe_'+(e.ri&&e.ri.d>e.ri.w/2+18?'offroad':'')+(e.lastHit||'');window.__stats[k]=(window.__stats[k]||0)+1;}e.wipe=1.2;e.spin=(Math.random()<0.5?-1:1)*rand(5,9);e.stab=0;
  popText(e.x,e.y-26,'Wiped out','#f2a03d');SFX.screech();}
// after the spin: half the time it burns, half the time the driver legs it and leaves the car
function finishWipe(e){G.wiped++;raiderDown();
  const bag=(x,y)=>G.boxes.push({id:'rb'+(raiderSeq++),kind:'bag',x,y,table:'raider',rolls:e.type==='brute'?3:2,seed:(Math.random()*1e9)|0,persist:false,transient:true});
  if(Math.random()<0.5){e.dead=true;explode(e.x,e.y,e.type==='brute');if(Math.random()<0.75)bag(e.x+rand(-30,30),e.y+rand(-30,30));}
  else{spawnLooseFoe(e.x+rand(-30,30),e.y+rand(-30,30),Math.random()<0.6);  // the driver climbs out, dazed: some fight, some run
    e.driver=null;e.wipe=0;e.cond=rand(15,40);e.engine=rand(30,70);e.tyres=rand(20,70);e.susp=rand(30,70);e.fuel=rand(10,40);e.vx*=0.4;e.vy*=0.4;e.stagger=0;
    e.items=genLoot('raider',(Math.random()*1e9)|0,2);popText(e.x,e.y-26,'Driver fled','#efe2c4');}
}
function spawnEncounter(){
  const p=body(),ri=p.ri,n=1+(Math.random()<0.45?1:0)+(G.legsDone>=2&&Math.random()<0.4?1:0);
  for(let k=0;k<n;k++){
    const type=G.legsDone>=1&&Math.random()<0.28?'brute':'buggy';let x,y,a;
    if(ri.r>=0&&ri.d<400){const R=roads[ri.r],idx=clamp(ri.i-p.dir*(22+k*4),1,R.n-2),j=clamp(idx+p.dir,0,R.n-1);
      a=Math.atan2(R.ys[j]-R.ys[idx],R.xs[j]-R.xs[idx]);const lat=(k%2?1:-1)*rand(5,30);
      x=R.xs[idx]-Math.sin(a)*lat;y=R.ys[idx]+Math.cos(a)*lat;}
    else{const ma=p.speed>60?Math.atan2(p.vy,p.vx):p.a;a=ma;x=p.x-Math.cos(ma)*(1200+k*150)+rand(-100,100);y=p.y-Math.sin(ma)*(1200+k*150)+rand(-100,100);}
    const rc=makeRaider(type,x,y,a,p.speed*0.9);rc.gunner=G.legsDone>=1&&Math.random()<0.3;G.cars.push(rc);
  }
  G.encActive=true;showMsg(n>1?'Raiders closing in':'Raider closing in',2.4);
}
function updateRaider(e,dt){
  const h=G.hero,p=body(),onFoot=!heroCar();e.flash=Math.max(0,e.flash-dt*5);e.stagger-=dt;
  if(e.wipe>0){e.wipe-=dt;e.a+=e.spin*dt;driveCar(e,0,0,dt,false,false);
    if(Math.random()<0.6)smoke(e.x,e.y,8);
    if(e.wipe<=0)finishWipe(e);return;}
  onRoadAt(e);
  const P=p.ri,fullyOff=e.ri.d>e.ri.w/2+18&&!nearService(e.x,e.y);
  if(!fullyOff)e.stab=Math.min(e.maxStab,e.stab+6*dt);
  else if(e.speed>150&&!onFoot&&P.r>=0&&P.d<P.w/2+40)e.stab-=38*dt*(e.speed/300)*e.soft;  // only when the fight is on a road: shoved off it, they lose control; chasing you cross-country, they don't
  if(e.stab<=0){startWipe(e);return;}
  const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
  let tx,ty,want;
  if(onFoot){ // someone on foot: run them down
    tx=h.x+h.vx*0.3;ty=h.y+h.vy*0.3;want=e.onRoad?(d<200?e.maxSpeed*0.8:e.maxSpeed):e.maxSpeed*(d<250?0.42:0.5);
  } else if(P.r>=0&&P.d<500&&d<1600){
    const Tx=P.tx*p.dir,Ty=P.ty*p.dir;
    const along=(e.x-p.x)*Tx+(e.y-p.y)*Ty;
    const slotAlong=e.type==='brute'?-70:0,slotLat=e.type==='brute'?0:e.side*50;
    if(e.mode==='swipe'){tx=p.x+Tx*25;ty=p.y+Ty*25;want=p.speed+60;e.modeT-=dt;
      if(e.modeT<=0){e.mode='chase';e.modeT=rand(2.2,4.2);if(Math.random()<0.3)e.side*=-1;}}
    else{
      const look=140+p.speed*0.25,R=roads[P.r],j=clamp(P.i+p.dir*Math.round((slotAlong+look)/40),0,R.n-2);
      const sx=R.xs[j+1]-R.xs[j],sy=R.ys[j+1]-R.ys[j],sl=Math.hypot(sx,sy)||1,nnx=-sy/sl*p.dir,nny=sx/sl*p.dir;
      tx=R.xs[j]+nnx*slotLat;ty=R.ys[j]+nny*slotLat;
      want=p.speed+clamp((slotAlong-along)*1.6,-160,260);
      if(Math.abs(along-slotAlong)<70&&d<120){e.modeT-=dt;if(e.modeT<=0){e.mode='swipe';e.modeT=e.type==='brute'?0.9:0.55;}}
    }
    if(!e.onRoad){const R=roads[e.ri.r];if(e.ri.r>=0&&e.ri.d<500){const j=clamp(e.ri.i+p.dir*6,0,R.n-1);tx=(tx+R.xs[j])/2;ty=(ty+R.ys[j])/2;}}
  } else {tx=p.x+p.vx*0.6;ty=p.y+p.vy*0.6;want=e.maxSpeed;}
  let diff=angDiff(Math.atan2(ty-e.y,tx-e.x),e.a);
  // steer round rocks and wrecks: cast a fan of five rays, take the clearest gap that still heads roughly where we want to go
  const obs=nearObstacles(e),look=100+e.speed*0.75,want0=e.a+diff;let ahead=look,bestA=0,bestS=-1e9;
  for(const ro of [-0.75,-0.38,0,0.38,0.75]){const ang=e.a+ro,cx=Math.cos(ang),cy=Math.sin(ang);let clear=look;
    for(const ob of obs){const px=ob.x-e.x,py=ob.y-e.y,along=px*cx+py*cy;if(along<0||along>clear)continue;const side=Math.abs(px*cy-py*cx);if(side<ob.r+e.r+16)clear=Math.max(0,along-ob.r);}
    for(let s2=24;s2<clear;s2+=24)if(blockedAt(e.x+cx*s2,e.y+cy*s2)||insideMesa(e.x+cx*s2,e.y+cy*s2,e.r+10)||inShellWall(e.x+cx*s2,e.y+cy*s2,e.r+8)||blockedAt(e.x+cx*s2-cy*e.r,e.y+cy*s2+cx*e.r)||blockedAt(e.x+cx*s2+cy*e.r,e.y+cy*s2-cx*e.r)){clear=Math.max(0,s2-24);break;}   // cliffs, canyons, rivers
    if(ro===0)ahead=clear;const score=clear-Math.abs(angDiff(ang,want0))*look*0.3;if(score>bestS){bestS=score;bestA=ro;}}
  if(ahead<look)diff=bestA*1.8+angDiff(want0,e.a)*0.2;   // something in the way: swing for the gap
  let thr=clamp((want-e.vf)/60,-1,1)*(Math.abs(diff)<1.6?1:0.4);
  if(ahead<e.speed*0.5)thr=Math.min(thr,-0.6);           // too close to swerve cleanly: brake as well
  driveCar(e,thr,clamp(diff*2.6,-1,1),dt,d>380&&want>e.vf,false);
  // some raider cars carry a shooter who leans out at close range
  if(e.gunner&&d<320&&e.wipe<=0){e.gcd=(e.gcd||rand(1,2))-dt;if(e.gcd<=0&&losClear(e.x,e.y,p.x,p.y)){e.gcd=rand(1.3,2.2);fireWeapon(e,WEAPONS.revolver,Math.atan2(dy,dx),0.28,d,p.r||20);}}
  if(e.stab<e.maxStab*0.4&&Math.random()<0.3)smoke(e.x,e.y);
  if(d>3500)e.gone=true;
}

// rocks and wrecks within reach of a car, gathered once per frame for its look-ahead rays
function nearObstacles(e){const out=[];chunksAround(e.x,e.y,ch=>{for(const k of ch.rocks)if(Math.abs(k.x-e.x)<400&&Math.abs(k.y-e.y)<400)out.push({x:k.x,y:k.y,r:k.r*0.85});
  for(const w of ch.wrecks)if(Math.abs(w.x-e.x)<400&&Math.abs(w.y-e.y)<400)out.push({x:w.x,y:w.y,r:36});});return out;}
