/* ===== effects and pickups ===== */
function addPickup(item,x,y,id){G.pickups.push({item,x,y,id,t:Math.random()*TAU});}
function part(o){if(G.parts.length>800)return;G.parts.push(Object.assign({vx:0,vy:0,life:1,max:1,size:4,grow:0,drag:2,kind:'dust',col:'#e9c993'},o));}
function sparks(x,y,n){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=rand(120,420);part({kind:'spark',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.15,.35),max:.35,size:2,drag:5,col:'#ffd27a'});}}
function smoke(x,y,s){part({kind:'smoke',x,y,vx:rand(-15,15),vy:rand(-15,15),life:1.2,max:1.2,size:s||7,grow:16,drag:1,col:'#3a2f28'});}
function explode(x,y,big){
  for(let i=0;i<(big?40:26);i++){const a=Math.random()*TAU,s=rand(40,big?320:240);
    part({kind:'fire',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.3,.8),max:.8,size:rand(8,18),grow:-8,drag:3,col:'#ffb347'});}
  for(let i=0;i<(big?26:18);i++){const a=Math.random()*TAU,s=rand(20,120);
    part({kind:'smoke',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(1,2.2),max:2.2,size:rand(12,24),grow:22,drag:1.5,col:'#3a2f28'});}
  sparks(x,y,16);G.shake=Math.max(G.shake,big?22:12);SFX.boom();
}
function popText(x,y,t,col){G.texts.push({x,y,t,col:col||'#efe2c4',life:1.2});}
function stepEffects(dt){
  for(const q of G.parts){q.life-=dt;const k=Math.exp(-q.drag*dt);q.vx*=k;q.vy*=k;q.x+=q.vx*dt;q.y+=q.vy*dt;q.size=Math.max(0.5,q.size+q.grow*dt);}
  G.parts=G.parts.filter(q=>q.life>0);
  for(const t of G.tracks)t.age+=dt;
  if(G.tracks.length&&G.tracks[0].age>9)G.tracks=G.tracks.filter(t=>t.age<9);
  for(const t of G.texts){t.life-=dt;t.y-=30*dt;}G.texts=G.texts.filter(t=>t.life>0);
  G.shake=Math.max(0,G.shake-dt*40);
}
