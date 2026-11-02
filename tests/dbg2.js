const L=require('./harness');
L.newGame();L.arrive(L.OUTPOSTS[0],'intro');L.setCourse(L.OUTPOSTS[0],L.OUTPOSTS[0].links[0]);
const G=L.G,h=G.hero,car=G.cars[0];
L.enterCar(car);console.log('inCar',h.inCar,'driver',car.driver,'heroCar',L.heroCar()&&L.heroCar().id);
L.keys.ArrowUp=true;
for(let i=0;i<30;i++){L.update(1/60);}
console.log('state',L.state,'speed',car.speed.toFixed(1),'fuel',car.fuel.toFixed(2),'x',car.x.toFixed(1),'onRoad',car.onRoad,'cond',car.cond);
