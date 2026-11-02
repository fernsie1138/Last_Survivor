const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../dist/index.html','utf8');
const js=html.split('<script>')[1].split('</script>')[0];
const el=()=>new Proxy(function(){},{get:(t,k)=>{if(k==='classList')return{add(){},remove(){},toggle(){},contains:()=>false};if(k==='style')return{};
  if(k==='querySelector')return()=>null;if(k in t)return t[k];return el();},apply:()=>el(),set:(t,k,v)=>{t[k]=v;return true;}});
if(process.env.TESTRANGE){global.location={hash:'#testrange',pathname:'/',search:''};global.history={replaceState(){}};}
global.window={__TEST:true,__dmg:{},innerWidth:1024,innerHeight:768,devicePixelRatio:2,addEventListener(){},matchMedia:()=>({matches:false})};
const body=el();
const elCache={};global.document={getElementById:id=>elCache[id]||(elCache[id]=el()),addEventListener(){},body,hidden:false,createElement:()=>el()};
global.localStorage={_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=v},removeItem(k){delete this._s[k]}};
global.performance={now:()=>Date.now()};global.setTimeout=()=>0;global.clearTimeout=()=>{};
eval(js);
const L=window.__LT;
L.step=(sec,fn)=>{for(let i=0;i<Math.round(sec*60);i++){fn&&fn(i);L.update(1/60);if(i%20===0)L.render();if(L.state!=='play')return i/60;}return sec;};
L.clearInput=()=>{for(const k in L.keys)L.keys[k]=false;L.stick.active=false;L.touch.boost=false;};
L.aim=(a,m=1)=>{L.stick.active=true;L.stick.ox=0;L.stick.oy=0;L.stick.x=Math.cos(a)*82*m;L.stick.y=Math.sin(a)*82*m;};
let fails=0;L.check=(name,cond,info='')=>{console.log((cond?'PASS ':'FAIL ')+name+(info?'  ['+info+']':''));if(!cond)fails++;};
L.done=()=>{console.log(fails?fails+' FAILED':'all passed');};
L.flatSpot=(extra)=>{for(let t=0;t<80000;t++){const x=(Math.random()*2-1)*700000,y=(Math.random()*2-1)*500000;
    if(L.landValue(x,y)<0.15||L.roadInfo(x,y).d<3000||L.LOCS.some(l=>Math.hypot(l.x-x,l.y-y)<6000))continue;if(extra&&!extra(x,y))continue;
    let ok=true;for(let a=0;a<6.28&&ok;a+=0.8)for(const d of [0,150,300]){const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;if(L.terrainRaw(px,py)!==L.T.GROUND||Math.abs(L.heightAt(px,py)-L.heightAt(x,y))>12)ok=false;}
    if(ok)return {x,y};}return null;};
// older tests aren't about wildlife: keep animals out of them unless a test asks for them (L.allowWild=true)
{const ng=L.newGame;L.newGame=function(...a){const r=ng.apply(this,a);if(!L.allowWild&&L.G){L.G.wildT=1e9;L.G.animals=[];}return r;};}
module.exports=L;
