export class AudioSystem{
  constructor(){this.ctx=null;this.engineOn=false;this.musicOn=false;this.engine={};this.music={}}
  ensure(){if(this.ctx)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=new A();}
  toggleEngine(){this.ensure();if(!this.ctx)return false;this.engineOn=!this.engineOn;if(this.engineOn)this._startEngine();else this._stop(this.engine);return this.engineOn}
  toggleMusic(){this.ensure();if(!this.ctx)return false;this.musicOn=!this.musicOn;if(this.musicOn)this._startMusic();else this._stop(this.music);return this.musicOn}
  _startEngine(){const c=this.ctx,g=c.createGain(),o1=c.createOscillator(),o2=c.createOscillator(),f=c.createBiquadFilter();o1.type='sawtooth';o2.type='sine';o1.frequency.value=72;o2.frequency.value=144;f.type='lowpass';f.frequency.value=780;g.gain.value=.055;o1.connect(f);o2.connect(f);f.connect(g);g.connect(c.destination);o1.start();o2.start();this.engine={g,o1,o2,f}}
  update(throttle,speed,type){if(!this.engineOn||!this.ctx||!this.engine.o1)return;const t=this.ctx.currentTime,base=type==='CONCORDE'?85:68;this.engine.o1.frequency.setTargetAtTime(base+throttle*120+speed*.05,t,.08);this.engine.o2.frequency.setTargetAtTime(base*2+throttle*210,t,.08);this.engine.g.gain.setTargetAtTime(.025+throttle*.07,t,.12)}
  _startMusic(){const c=this.ctx,g=c.createGain();g.gain.value=.018;g.connect(c.destination);const notes=[110,164.81,220];const os=notes.map((f,i)=>{const o=c.createOscillator();o.type=i?'sine':'triangle';o.frequency.value=f;o.connect(g);o.start();return o});this.music={g,os}}
  _stop(group){for(const k of Object.values(group||{})){try{if(k&&k.stop)k.stop()}catch{}try{if(k&&k.disconnect)k.disconnect()}catch{}}}
}
