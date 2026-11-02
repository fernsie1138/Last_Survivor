// every road must leave every town through a gate: walk each road from the town centre out past the wall
const L=require('./harness');let checked=0,blocked=[];
for(const o of L.LOCS){if(!o.wall||!o.wall.length)continue;const wr=o.rad-40;
  for(const l of o.links){const R=L.roads[l.road];let i=l.dir>0?0:R.n-1;
    while(i+l.dir>=0&&i+l.dir<R.n&&Math.hypot(R.xs[i]-o.x,R.ys[i]-o.y)<wr+30){const d=Math.hypot(R.xs[i]-o.x,R.ys[i]-o.y);
      if(Math.abs(d-wr)<14){const a=Math.atan2(R.ys[i]-o.y,R.xs[i]-o.x);for(const w of o.wall){const dd=Math.abs(((w.a-a)+3*Math.PI)%(2*Math.PI)-Math.PI)*wr;if(dd<26+R.w/2*0.5){blocked.push(o.name+' → '+L.LOCS[l.to].name);break;}}}
      i+=l.dir;}checked++;}}
console.log('roads checked',checked,'; roads running into a wall:',blocked.length?[...new Set(blocked)].slice(0,8).join(', '):'none');
