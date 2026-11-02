const L=require('./harness');
L.newGame();L.arrive(L.OUTPOSTS[0],'intro');L.setCourse(L.OUTPOSTS[0],L.OUTPOSTS[0].links[0]);
const G=L.G,car=G.cars.find(c=>c.id==='hero0');L.enterCar(car);L.keys.ArrowUp=true;
let minGap=1e9,who='';for(let i=0;i<240;i++){L.update(1/60);for(const c of G.cars){if(c===car)continue;const g=Math.hypot(c.x-car.x,c.y-car.y)-c.r-car.r;if(g<minGap){minGap=g;who=c.id+' '+c.def.name;}}}
console.log('speed',(car.speed*0.36).toFixed(0),'km/h, cond',car.cond.toFixed(0),'closest car gap',minGap.toFixed(0),who);
// same test, parked cars removed
L.newGame();L.arrive(L.OUTPOSTS[0],'intro');L.setCourse(L.OUTPOSTS[0],L.OUTPOSTS[0].links[0]);
const c2=L.G.cars.find(c=>c.id==='hero0');L.G.cars=[c2];L.G.removed=new Set(['o0_0','o0_2','o0_12']);L.enterCar(c2);L.keys.ArrowUp=true;
for(let i=0;i<240;i++)L.update(1/60);console.log('with no other cars:',(c2.speed*0.36).toFixed(0),'km/h');
