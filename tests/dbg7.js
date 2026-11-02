const L=require('./harness');
L.newGame();L.arrive(L.LOCS[L.START],"intro");L.setDest(L.LOCS[L.START].links[0].to);L.depart();
const G=L.G,h=G.hero,car=G.cars.find(c=>c.id==='hero0');
console.log('state',L.state,'start',L.LOCS[L.START].name,'links',L.LOCS[L.START].links.length);
L.enterCar(car);L.keys.ArrowUp=true;L.step(4);L.clearInput();
console.log('after drive: state',L.state,'speed',car.speed.toFixed(0),'inCar',h.inCar,'pos',car.x.toFixed(0),car.y.toFixed(0),'water?',L.waterAt(car.x,car.y));
L.keys.ArrowDown=true;for(let i=0;i<180;i++){L.update(1/60);if(car.speed<5)L.keys.ArrowDown=false;}L.clearInput();
console.log('after brake: state',L.state,'speed',car.speed.toFixed(1),'vf',car.vf.toFixed(1));
L.exitCar();console.log('after exit: inCar',h.inCar);
