const L=require('./harness');
L.check('loads to title',L.state==='title');
L.newGame();L.arrive(L.LOCS[L.START],"intro");L.setDest(L.LOCS[L.START].links[0].to);L.depart();
let G=L.G,h=G.hero;
L.check('starts on foot',!h.inCar);
L.check('Get in offered next to the Kestrel',L.getActions().some(a=>a.label==='Get in'&&L.nearestCar(40).id==='hero0'));
// walking (down the road, away from the buildings)
const car0=L.G.cars.find(c=>c.id==='hero0'),fa=car0.a;let p0={x:h.x,y:h.y};L.aim(fa,0.8);L.step(2);L.clearInput();
L.check('hero walks at 80% stick: ~46 px/s',Math.abs(Math.hypot(h.x-p0.x,h.y-p0.y)/2-46)<6,(Math.hypot(h.x-p0.x,h.y-p0.y)/2).toFixed(0)+' px/s');
p0={x:h.x,y:h.y};L.aim(fa,1);L.step(2);L.clearInput();
L.check('hero runs ~100 px/s',Math.abs(Math.hypot(h.x-p0.x,h.y-p0.y)/2-98)<12,(Math.hypot(h.x-p0.x,h.y-p0.y)/2).toFixed(0)+' px/s');
// walk back to car and get in
const car=L.G.cars.find(c=>c.id==='hero0');
L.step(12,()=>{if(L.nearestCar(40)!==car)L.aim(Math.atan2(car.y-h.y,car.x-h.x));else L.stick.active=false;});L.clearInput();
const act=L.getActions().find(a=>a.label==='Get in');L.check('reached car on foot',!!act);act&&act.fn();
L.check('now driving',L.heroCar()===car&&car.driver==='hero');
// drive
L.keys.ArrowUp=true;L.step(4);
L.check('car accelerates (off-road here, so capped near 90 km/h)',car.speed>200,(car.speed*0.36).toFixed(0)+' km/h');
L.getActions()[0].fn();L.check('cannot get out at speed',!!h.inCar);
L.clearInput();L.keys.ArrowDown=true;L.step(3,()=>{if(car.vf<15)L.keys.ArrowDown=false;});L.clearInput();
for(const k of L.chunks.values())k.rocks=k.rocks.filter(r=>Math.hypot(r.x-car.x,r.y-car.y)>250);
L.getActions()[0].fn();L.check('gets out when stopped',!h.inCar&&car.driver===null);
const rx=-Math.sin(car.a),ry=Math.cos(car.a),side=(h.x-car.x)*rx+(h.y-car.y)*ry;
L.check('exits on the driver (right) side',side>0,'offset '+side.toFixed(0));
L.step(1);L.check('parked car stays put',car.speed<1);
// pickups need you on foot
L.G.pickups.push({item:'jerrycan',x:car.x+Math.cos(car.a)*300,y:car.y+Math.sin(car.a)*300,t:0});
L.enterCar(car);L.keys.ArrowUp=true;L.step(1.5);L.clearInput();
L.check('driving over a jerrycan does not collect it',L.G.pickups.length===1&&!h.inv.jerrycan);
L.keys.ArrowDown=true;L.step(3,()=>{if(car.vf<15)L.keys.ArrowDown=false;});L.clearInput();L.exitCar();
const can=L.G.pickups[0];L.step(12,()=>{if(L.G.pickups[0])L.aim(Math.atan2(can.y-h.y,can.x-h.x));else L.stick.active=false;});L.clearInput();
L.check('walking to the (empty) jerry can picks it up',h.inv.jerrycan===1&&L.canFill(h.inv)===0);
car.fuel=40;L.setFill(h.inv,30);   // the can you found by the road was empty; pretend you siphoned it full
L.step(12,()=>{if(L.nearestCar(40)!==car)L.aim(Math.atan2(car.y-h.y,car.x-h.x));else L.stick.active=false;});L.clearInput();
const pour=L.getActions().find(a=>a.label.startsWith('Pour fuel'));L.check('Pour fuel offered at the car',!!pour);pour&&pour.fn();
L.check('pouring adds 30% fuel and leaves you an empty can',Math.abs(car.fuel-70)<0.5&&h.inv.jerrycan===1&&L.canFill(h.inv)<0.5,car.fuel.toFixed(1));
L.done();
