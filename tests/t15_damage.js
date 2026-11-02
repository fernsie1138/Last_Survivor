const L=require('./harness');
let R=L.roads.find(r=>r.cls==='highway'&&r.len>150000);let best=200,bs=1e9;
// a stretch that's straight AND flat, so hills don't skew the speed comparisons
for(const R2 of L.roads.filter(r=>r.cls==='highway'&&r.len>150000))for(let i=60;i<R2.n-400;i+=20){let c=0,hv=0;for(let k=i;k<i+300;k++){const a1=Math.atan2(R2.ys[k]-R2.ys[k-1],R2.xs[k]-R2.xs[k-1]),a2=Math.atan2(R2.ys[k+1]-R2.ys[k],R2.xs[k+1]-R2.xs[k]);let d=Math.abs(a2-a1);if(d>Math.PI)d=2*Math.PI-d;c+=d;if(k%10===0)hv+=Math.abs(L.heightAt(R2.xs[k+10],R2.ys[k+10])-L.heightAt(R2.xs[k],R2.ys[k]));}
  const score=c+hv/20;if(score<bs){bs=score;best=i;R=R2;}}
function onHighway(set){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const c=G.cars.find(c=>c.id==='hero0');
  c.x=R.xs[best];c.y=R.ys[best];c.a=Math.atan2(R.ys[best+1]-R.ys[best],R.xs[best+1]-R.xs[best]);Object.assign(c,set||{});G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);
  L.syncCars();G.cars=G.cars.filter(x=>x===c);for(const k of L.chunks.values())k.rocks=[];return {G,c};}
// drive with the throttle only (no steering) and measure top speed, wobble and drift
function run(set,secs=7){const {c}=onHighway(set),a0=c.a;L.keys.ArrowUp=true;let top=0,prev=c.a,jit=0,n=0;
  L.step(secs,i=>{top=Math.max(top,c.speed);if(i>60){const d=c.a-prev;jit+=d*d;n++;}prev=c.a;});L.clearInput();return {kmh:Math.round(top*0.36),wobble:Math.sqrt(jit/Math.max(1,n))*1000,drift:c.a-a0,c};}
const ok=run({}),susp=run({susp:0});
console.log('healthy:',ok.kmh,'km/h, wobble',ok.wobble.toFixed(2),' | suspension broken:',susp.kmh,'km/h, wobble',susp.wobble.toFixed(2));
L.check('broken suspension: about 30% slower',Math.abs(susp.kmh/ok.kmh-0.7)<0.05,Math.round(100*susp.kmh/ok.kmh)+'% of healthy');
L.check('…and the car wobbles',susp.wobble>ok.wobble+1);
const fl=[1,2,3,4].map(n=>run({tw:[0,0,0,0].map((_,i)=>i<n?0:100)}));
console.log('flats:',fl.map((r,i)=>(i+1)+' → '+r.kmh+' km/h, wobble '+r.wobble.toFixed(1)).join('; '));
L.check('each flat tyre costs about 20% of top speed',fl.every((r,i)=>Math.abs(r.kmh/ok.kmh-(1-0.2*(i+1)))<0.07),fl.map(r=>Math.round(100*r.kmh/ok.kmh)+'%').join(', '));
L.check('more flats, more wobble',fl[0].wobble>ok.wobble+1&&fl[1].wobble>fl[0].wobble);
{const left=run({tw:[0,100,100,100]},3),right=run({tw:[100,0,100,100]},3);
 L.check('a flat drags the car toward its side',left.drift<-0.05&&right.drift>0.05,'front-left flat: '+(left.drift*57.3).toFixed(0)+'°, front-right flat: '+(right.drift*57.3).toFixed(0)+'° over 3 s');}
// harder to control: hold the stick straight down the road and measure how far the heading strays
function stray(set){const {c}=onHighway(set),a0=c.a;let err=0,n=0;L.step(6,()=>{L.aim(a0+L.G.camRot,0.8);const e=((c.a-a0)+3*Math.PI)%(2*Math.PI)-Math.PI;err+=e*e;n++;});L.clearInput();return Math.sqrt(err/n)*57.3;}
const s0=stray({}),s2=stray({tw:[0,100,0,100]});L.check('two flats make the car harder to hold straight',s2>s0*1.5+0.3,'heading wanders '+s0.toFixed(1)+'° healthy vs '+s2.toFixed(1)+'° with two flats');
// a dead engine: it won't run, but you can still coast and brake
{const {G,c}=onHighway({engine:0});const f0=c.fuel;L.keys.ArrowUp=true;L.step(3);L.clearInput();
 L.check('a dead engine won’t move the car',c.speed<2&&c.fuel===f0);G.hero.inv={parts:1,toolkit:1};L.useItem('parts',G.hero.inv,c);L.keys.ArrowUp=true;L.step(3);L.clearInput();
 L.check('engine parts bring it back to life',c.speed>150&&c.engine===40);}
{const {G,c}=onHighway({});L.keys.ArrowUp=true;L.step(4);const v0=c.speed;c.engine=0;L.step(1);const v1=c.speed;L.clearInput();
 L.check('if the engine dies at speed, you coast rather than stop dead',v1>v0*0.6&&v1<v0,Math.round(v0*0.36)+' → '+Math.round(v1*0.36)+' km/h after a second');
 L.touch.brake=true;L.step(2);L.touch.brake=false;L.check('…and the brakes still work',c.speed<1);}
// a body battered to zero: it won't run, and it doesn't explode or throw you out
{const {G,c}=onHighway({cond:0});L.keys.ArrowUp=true;L.step(3);L.clearInput();
 L.check('at zero body the car won’t run, and it doesn’t explode',c.speed<2&&!c.wrecked&&c.burn===0&&G.hero.inCar===c.id);
 G.hero.inv={scrap:1};L.exitCar(true);L.useItem('scrap',G.hero.inv,c);G.swapT=-9;L.enterCar(c);L.keys.ArrowUp=true;L.step(3);L.clearInput();L.check('scrap patches it up enough to run again',c.speed>150&&c.cond===20);}
{const {G,c}=onHighway({});c.cond=5;for(let i=0;i<10;i++){c.cond-=3;L.update(1/60);}L.check('repeated hits leave the body at zero, not wrecked',c.cond===0&&!c.wrecked&&L.G.cars.includes(c));}
// tyres one by one
{const {G,c}=onHighway({tw:[0,100,40,100]});G.hero.inv={tyre:1};L.useItem('tyre',G.hero.inv,c);L.check('a spare replaces the worst tyre only',c.tw.join()==='100,100,40,100',c.tw.join(', '));}
{const {G,c}=onHighway({});let tries=0;while(c.tw.every(t=>t===100)&&tries++<50)L.G.bullets.push({x:c.x-40,y:c.y,vx:2000,vy:0,life:0.1,dmg:34,owner:'foe'}),L.update(1/60),L.update(1/60);
 L.check('a raider’s shot can damage one tyre, not all four',c.tw.filter(t=>t<100).length<=1,c.tw.map(Math.round).join(', '));}
// real wear: drive a worn set of tyres down a gravel road until they give out
{const GR=L.roads.find(r=>r.cls==='gravel'&&r.len>120000);L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;const c=G.cars.find(c=>c.id==='hero0');
 const i0=200;c.x=GR.xs[i0];c.y=GR.ys[i0];c.a=Math.atan2(GR.ys[i0+1]-GR.ys[i0],GR.xs[i0+1]-GR.xs[i0]);c.tw=[0.5,0.5,0.7,0.7];G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);L.syncCars();G.cars=G.cars.filter(x=>x===c);
 let firstBlow=null;L.step(20,i=>{const r2=L.roadInfo(c.x,c.y),j=Math.min(GR.n-1,r2.i+Math.round(5+c.speed/60));L.aim(Math.atan2(GR.ys[j]-c.y,GR.xs[j]-c.x)+G.camRot,1);if(firstBlow===null&&L.G.hero&&c.tw.some(t=>t<=0))firstBlow=i/60;});L.clearInput();
 L.check('worn tyres driven on gravel wear through and blow',c.tw.filter(t=>t<=0).length>=2,'first blowout after '+(firstBlow===null?'never':firstBlow.toFixed(1)+' s')+'; tyres now '+c.tw.map(t=>t<=0?'flat':Math.round(t)).join(', '));}
{const {G,c}=onHighway({tw:[0,55,100,80]});c.touched=true;const sv=JSON.parse(JSON.stringify(L.saveData()));L.newGame(sv);const c2=L.G.cars.find(x=>x.id==='hero0');
 L.check('each tyre’s condition survives saving and loading',c2&&c2.tw.join()==='0,55,100,80',c2&&c2.tw.join(', '));}
{const {G,c}=onHighway({tw:[0,100,100,100],susp:0,engine:0});let ok=true;try{L.render();L.openInv(null);L.renderInv();L.closeInv();}catch(e){ok=false;console.log(e);}L.check('flat tyres and damage render, and show in the gear screen',ok);}
L.done();
