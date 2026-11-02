/* ===== audio ===== */
const SFX={c:null,
  init(){if(this.c){this.c.resume&&this.c.resume();return;}
    try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=this.c=new AC();
      this.master=c.createGain();this.master.gain.value=0.55;this.master.connect(c.destination);
      this.o1=c.createOscillator();this.o1.type='sawtooth';this.o2=c.createOscillator();this.o2.type='square';
      this.f=c.createBiquadFilter();this.f.type='lowpass';this.f.frequency.value=380;
      this.eg=c.createGain();this.eg.gain.value=0;
      this.o1.connect(this.f);this.o2.connect(this.f);this.f.connect(this.eg);this.eg.connect(this.master);
      this.o1.frequency.value=40;this.o2.frequency.value=20;this.o1.start();this.o2.start();
      const n=c.sampleRate;this.nb=c.createBuffer(1,n,n);const d=this.nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    }catch(e){this.c=null;}},
  engine(speed,thr,boost,on,pitch){if(!this.c)return;const t=this.c.currentTime;pitch=pitch||1;
    const f=(34+speed*0.09+Math.max(0,thr)*14+(boost?18:0))*pitch;
    this.o1.frequency.setTargetAtTime(f,t,0.06);this.o2.frequency.setTargetAtTime(f*0.5,t,0.06);
    this.f.frequency.setTargetAtTime(300+speed*0.8+(boost?500:0),t,0.08);
    this.eg.gain.setTargetAtTime(on?0.045+Math.max(0,thr)*0.04+(boost?0.03:0):0,t,0.1);},
  noise(dur,type,freq,vol,q){if(!this.c)return;const c=this.c,t=c.currentTime;
    const s=c.createBufferSource();s.buffer=this.nb;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;if(q)f.Q.value=q;
    const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    s.connect(f);f.connect(g);g.connect(this.master);s.start(t,Math.random()*0.5);s.stop(t+dur+0.05);},
  tone(f1,f2,dur,vol,type){if(!this.c)return;const c=this.c,t=c.currentTime;const o=c.createOscillator();o.type=type||'sine';
    o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(f2,t+dur);
    const g=c.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+0.05);},
  lastHit:0,
  hit(v){const n=performance.now();if(n-this.lastHit<80)return;this.lastHit=n;this.noise(0.2,'lowpass',380,clamp(v||0.35,0.1,0.5));this.noise(0.12,'bandpass',2400,0.08,2);},
  door(){this.noise(0.12,'lowpass',260,0.35);this.tone(140,90,0.08,0.12,'square');},
  slosh(){this.noise(0.5,'bandpass',700,0.12,3);},
  clank(){this.tone(900,500,0.08,0.1,'square');this.noise(0.1,'highpass',3000,0.08);},
  screech(){this.noise(0.6,'bandpass',3000,0.12,6);},
  boom(){this.noise(0.9,'lowpass',520,0.6);this.tone(90,30,0.7,0.35,'triangle');},
  pick(){this.tone(560,1050,0.14,0.18);},
  punch(){this.noise(0.12,'lowpass',300,0.4);this.tone(120,60,0.08,0.15,'triangle');},
  swing(){this.noise(0.15,'bandpass',1400,0.06,1.5);},
  click(){this.tone(1400,1100,0.03,0.06,'square');},
  gun(W){const big=W.pellets>1||W.dmg>60;this.noise(big?0.35:0.18,'lowpass',big?900:1600,big?0.7:0.5);this.noise(0.05,'highpass',3000,0.25);},
  arrive(){this.tone(330,495,0.25,0.15);setTimeout(()=>this.tone(495,660,0.3,0.15),180);}
};
