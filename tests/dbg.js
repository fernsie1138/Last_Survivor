const L=require('./harness');
L.newGame();L.arrive(L.OUTPOSTS[0],'intro');L.setCourse(L.OUTPOSTS[0],L.OUTPOSTS[0].links[0]);
const G=L.G,h=G.hero;console.log('state',L.state,'hero',h.x,h.y,'cars',G.cars.map(c=>c.id+'@'+c.x.toFixed(0)+','+c.y.toFixed(0)));
L.keys.KeyW=true;for(let i=0;i<60;i++){L.update(1/60);}console.log('after walking up: state',L.state,'hero',h.x.toFixed(1),h.y.toFixed(1),'v',h.vx.toFixed(1),h.vy.toFixed(1));
