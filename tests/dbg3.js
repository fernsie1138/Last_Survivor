const L=require('./harness');
L.newGame();L.arrive(L.OUTPOSTS[0],'intro');L.setCourse(L.OUTPOSTS[0],L.OUTPOSTS[0].links[0]);
const G=L.G,h=G.hero,car=G.cars.find(c=>c.id==='hero0');
L.keys.KeyD=true;L.step(2);L.clearInput();L.keys.KeyD=true;L.keys.ShiftLeft=true;L.step(2);L.clearInput();
L.step(6,()=>{L.aim(Math.atan2(car.y-h.y,car.x-h.x));});L.clearInput();
console.log('hero',h.x.toFixed(0),h.y.toFixed(0),'car',car.x.toFixed(0),car.y.toFixed(0),'state',L.state);
const act=L.getActions().find(a=>a.label==='Get in');act.fn();
console.log('after enter: inCar',h.inCar,'car is',L.heroCar()&&L.heroCar().id);
L.keys.ArrowUp=true;const t=L.step(4);console.log('step returned',t,'state',L.state,'speed',car.speed.toFixed(0));
