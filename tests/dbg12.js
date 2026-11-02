const L=require('./harness');L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();
const G=L.G,h=G.hero,car=G.cars.find(c=>c.id==='hero0'),o=L.LOCS[L.START];
const inB=o.bld.some(b=>L.bInside(b,h.x,h.y,-10)),carB=o.bld.some(b=>L.bInside(b,car.x,car.y,-25));
console.log('hero in/near a building?',inB,' car in/near a building?',carB);
// clear line ahead of the car for 400px?
let blocked=null;for(let d=0;d<500;d+=10){const x=car.x+Math.cos(car.a)*d,y=car.y+Math.sin(car.a)*d;if(o.bld.some(b=>L.bInside(b,x,y,-car.r))){blocked=d;break;}}
console.log('path ahead blocked at',blocked);
L.enterCar(car);L.keys.ArrowUp=true;L.step(4);console.log('speed after 4s',(car.speed*.36).toFixed(0),'km/h, onRoad',car.onRoad);
