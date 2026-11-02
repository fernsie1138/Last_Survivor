const L=require('./harness');
function run(aggressive,type){
  L.newGame({v:3,at:5,visited:[0],wiped:0,dist:0,time:0,legs:2,removed:[],cars:[],hero:{x:420000,y:-60000,hp:100,cans:0,scrap:0,inCar:null}});
  const o=L.OUTPOSTS[5],link=o.links.find(l=>l.to===6);L.arrive(o,'resume');L.setCourse(o,link);
  const G=L.G,c=L.makeCar(type,o.x,o.y,0,{id:'test',touched:true});G.cars.push(c);L.enterCar(c);
  let t=0,minCond=100,minHp=100,wreck=false;
  while(L.state==='play'&&t<1500){const car=L.heroCar(),b=L.body(),R=L.roads[link.road];
    if(!car){wreck=true;break;}
    const ri=L.roadInfo(b.x,b.y);let tx,ty;
    const tgt=aggressive&&G.cars.find(e=>e.driver==='raider'&&e.wipe<=0&&Math.hypot(e.x-b.x,e.y-b.y)<220);
    if(tgt){tx=tgt.x+Math.cos(tgt.a)*70;ty=tgt.y+Math.sin(tgt.a)*70;}
    else if(ri.r===link.road){const j=Math.max(0,Math.min(R.n-1,ri.i+link.dir*Math.round(5+b.speed/60)));tx=R.xs[j];ty=R.ys[j];}
    else{tx=L.OUTPOSTS[6].x;ty=L.OUTPOSTS[6].y;}
    L.aim(Math.atan2(ty-b.y,tx-b.x));L.update(1/60);t+=1/60;
    const hc=L.heroCar();if(hc)minCond=Math.min(minCond,hc.cond);minHp=Math.min(minHp,G.hero.hp);}
  L.clearInput();
  return {made:L.state==='over'&&!wreck&&G.hero.hp>0,wreck,min:(t/60).toFixed(1),minCond:Math.round(minCond),minHp:Math.round(minHp),wiped:G.wiped};
}
for(const type of ['kestrel','kingsford','cruiser']){
  for(const ag of [false,true]){const rs=[];for(let i=0;i<12;i++)rs.push(run(ag,type));
    console.log((L.CARS[type].name+(ag?', shoving':', passive')).padEnd(34),'reached Haven',rs.filter(r=>r.made).length+'/12',' car destroyed',rs.filter(r=>r.wreck).length,
      ' worst car condition',Math.min(...rs.map(r=>r.minCond))+'%',' avg wiped',(rs.reduce((a,r)=>a+r.wiped,0)/12).toFixed(1));}
}
