const L=require('./harness');
const src=require('fs').readFileSync('t7_combat.js','utf8');
const runFn=src.slice(src.indexOf('function run('),src.indexOf('for(const cls of'));
const run=eval('('+runFn.replace('function run(','function(')+')');
for(let i=0;i<24;i++){const r=run('highway',true);if(!r.made){const G=L.G,car=L.heroCar();
  console.log('run',i,JSON.stringify({made:r.made,wreck:r.wreck,min:r.min.toFixed(1),state:L.state,hp:Math.round(G.hero.hp),inCar:!!car,fuel:car&&Math.round(car.fuel),tyres:car&&Math.round(car.tyres),cond:car&&Math.round(car.cond),
    raiders:G.cars.filter(c=>c.driver==='raider').length,foes:G.foes.filter(f=>!f.dead).map(f=>f.state+':'+f.weapon).join(','),dmg:window.__dmg}));}}
console.log('done');
