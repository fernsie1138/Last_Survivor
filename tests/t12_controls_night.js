const L=require('./harness');
const html=require('fs').readFileSync(__dirname+'/../dist/index.html','utf8');
function fresh(){L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();L.G.encT=1e9;return L.G;}
// --- layout: every action button on the left, joystick on the right
L.check('brake, boost, attack and sneak buttons all sit on the left',/#bBrake,#bAttack\{[^}]*left:/.test(html)&&/#bBoost,#bSneak\{[^}]*left:/.test(html)&&!/#bBoost\{[^}]*right:/.test(html));
L.check('the context buttons are on the left too',/#ctx\{position:fixed;left:/.test(html));
L.check('the joystick now starts on the right side of the screen',html.includes('e.clientX>W*0.38&&stick.id===null'));
L.check('Brake shows in the car, Attack and Sneak on foot',html.includes('body:not(.onfoot) #bBrake,body:not(.onfoot) #bBoost,body:not(.onfoot) #bReverse,.onfoot #bAttack,.onfoot #bSneak{display:block}'));
// --- the brake: from top speed to a full stop, and it stays stopped
function straightStart(){const R=L.roads.find(r=>r.cls==='highway'&&r.len>100000);let best=100,bs=1e9;
  for(let i=60;i<R.n-300;i+=10){let c=0;for(let k=i;k<i+260;k++){const a1=Math.atan2(R.ys[k]-R.ys[k-1],R.xs[k]-R.xs[k-1]),a2=Math.atan2(R.ys[k+1]-R.ys[k],R.xs[k+1]-R.xs[k]);let d=Math.abs(a2-a1);if(d>Math.PI)d=2*Math.PI-d;c+=d;}if(c<bs){bs=c;best=i;}}
  return {R,i:best};}
function topSpeedThen(action){const G=fresh(),{R,i}=straightStart(),c=G.cars.find(c=>c.id==='hero0');c.x=R.xs[i];c.y=R.ys[i];c.a=Math.atan2(R.ys[i+1]-R.ys[i],R.xs[i+1]-R.xs[i]);
  G.hero.x=c.x;G.hero.y=c.y;L.enterCar(c);for(const k of L.chunks.values())k.rocks=[];G.cars=G.cars.filter(x=>x===c);
  L.keys.ArrowUp=true;L.step(5);L.keys.ArrowUp=false;const v0=c.speed,x0=c.x,y0=c.y;let t=0;action();
  while(c.speed>1&&t<30){L.update(1/60);t+=1/60;}const dist=Math.hypot(c.x-x0,c.y-y0)/10;return {v0:Math.round(v0*0.36),t,dist,c};}
const br=topSpeedThen(()=>{L.touch.brake=true;});
L.check('the brake stops the car smoothly, in about 1.5 s',br.t>1&&br.t<2.5,'from '+br.v0+' km/h: '+br.t.toFixed(1)+' s, '+br.dist.toFixed(0)+' m');
let rev=0;L.step(3,()=>{if(br.c.vf<-1)rev++;});L.check('holding the brake keeps it stopped, never rolling backwards',rev===0&&br.c.speed<1);
L.touch.brake=false;L.keys.ArrowUp=true;L.step(1.5);L.clearInput();L.check('let go and it drives off again',br.c.speed>150);
const coast=topSpeedThen(()=>{});L.check('braking stops far sooner than coasting',br.t<coast.t/3,'coasting takes '+(coast.t>=30?'over 30':coast.t.toFixed(1))+' s');
{const G=fresh(),c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);L.keys.KeyB=true;L.keys.ArrowUp=true;L.step(1);L.clearInput();
 L.check('B on the keyboard brakes, and the brake overrides the throttle',c.speed<5);}
// --- night falls and lifts
{const G=fresh(),dk=h=>{G.clock=h*60;return L.darkness();};
 const curve=[0,6,6.5,7,12,17,18,19.5,20.5,22,2,4.5,5.5].map(h=>h+'h '+dk(h).toFixed(2));console.log('darkness through the day:',curve.join(', '));
 L.check('full daylight from 7am to 5pm',dk(7)===0&&dk(12)===0&&dk(16.9)===0);
 L.check('dusk deepens into night, dawn lifts it',dk(18)>0&&dk(18)<dk(20)&&dk(20)<dk(22)&&dk(22)===0.8&&dk(2)===0.8&&dk(5.5)<0.8&&dk(6.5)<dk(5.5));
 G.clock=12*60;L.check('headlights off in daylight',!L.headlightsOn());G.clock=21*60;L.check('headlights come on after dark',L.headlightsOn());}
// --- the night scene draws without errors with every light source in play
{const G=fresh();G.clock=23*60;let ok=true;try{const c=G.cars.find(c=>c.id==='hero0');L.enterCar(c);L.keys.ArrowUp=true;L.step(1);L.clearInput();
   const camp=L.LOCS.find(l=>l.camp&&l.fire);G.hero.inCar=null;c.driver=null;G.hero.x=camp.fire.x+200;G.hero.y=camp.fire.y;L.syncCars();L.render();
   G.cars.push(L.makeRaider('buggy',G.hero.x+300,G.hero.y,0,200));for(let i=0;i<20;i++){L.update(1/60);L.render();}}catch(e){ok=false;console.log(e);}
 L.check('night renders with headlights, campfires, lamps and fire',ok);
 L.check('every raider camp has a campfire',L.LOCS.filter(l=>l.camp).every(l=>l.fire),L.LOCS.filter(l=>l.camp&&!l.fire).map(l=>l.name).join(', ')||'all');}
L.done();
