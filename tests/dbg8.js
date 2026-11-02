const L=require('./harness');
L.newGame();L.arrive(L.LOCS[L.START],"intro");L.depart();const G=L.G;G.encT=1e9;
// sea check
const coastal=L.LOCS.filter(l=>l.type!=='ruin').sort((a,b)=>L.landValue(a.x,a.y)-L.landValue(b.x,b.y))[0];
let sea=null;for(let a=0;a<6.28&&!sea;a+=0.1)for(let d=500;d<40000;d+=500){const x=coastal.x+Math.cos(a)*d,y=coastal.y+Math.sin(a)*d;if(L.landValue(x,y)<-0.01){sea={a,d};break;}}
const x=coastal.x+Math.cos(sea.a)*(sea.d-1500),y=coastal.y+Math.sin(sea.a)*(sea.d-1500);
console.log('start lv',L.landValue(x,y).toFixed(3),'water?',L.waterAt(x,y));
for(let k=0;k<=30;k++){const d=sea.d-1500+k*100,px=coastal.x+Math.cos(sea.a)*d,py=coastal.y+Math.sin(sea.a)*d,ch=L.getChunk(Math.floor(px/640),Math.floor(py/640));
  if(k%3==0)console.log('d',d,'lv',L.landValue(px,py).toFixed(3),'waterAt',L.waterAt(px,py),'chunk has mask',!!ch.water,'chunk centre lv',L.landValue(ch.cx*640+320,ch.cy*640+320).toFixed(3));}
