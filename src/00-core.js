// the version shown on the title screen and at the bottom of the screen: goes up by 0.1 with every published build
const VERSION='1.1';
/* ===== core: maths, random, canvas ===== */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rand=(a,b)=>a+Math.random()*(b-a);
function angDiff(a,b){let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;}
function hash2(x,y){let h=(Math.imul(x,374761393)+Math.imul(y,668265263))^0x5bd1e995;h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const $=id=>document.getElementById(id);
const cv=$('c'), ctx=cv.getContext('2d');
let W=800,H=600,DPR=1,ZBASE=1,ZOOM=1,vignette=null,heat=null;
function resize(){
  DPR=Math.min(window.devicePixelRatio||1,2);W=window.innerWidth||800;H=window.innerHeight||600;
  cv.width=(W*DPR)|0;cv.height=(H*DPR)|0;cv.style.width=W+'px';cv.style.height=H+'px';
  ZBASE=clamp(Math.min(W,H)/720,0.55,1.1);ZOOM=ZBASE;
  vignette=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75);
  vignette.addColorStop(0,'rgba(60,25,8,0)');vignette.addColorStop(1,'rgba(45,18,6,0.55)');
  heat=ctx.createLinearGradient(0,0,0,H);
  heat.addColorStop(0,'rgba(255,170,70,0.16)');heat.addColorStop(0.5,'rgba(255,170,70,0)');heat.addColorStop(1,'rgba(120,40,10,0.12)');
}
window.addEventListener('resize',resize);resize();
