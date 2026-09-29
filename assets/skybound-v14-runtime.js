
(()=>{
 const services={
  NPT:[['GROUND',121.700],['TOWER',118.300],['DEPARTURE',125.400],['APPROACH',127.650]],
  CBY:[['GROUND',121.900],['TOWER',119.200],['DEPARTURE',124.850],['APPROACH',128.225]],
  GMI:[['GROUND',121.825],['TOWER',120.650],['DEPARTURE',126.725],['APPROACH',129.150]]
 };
 let tuned=118.300, radioBox=null, audioCtx=null,engineGain=null,musicGain=null,audioOn=false,musicOn=false;
 function activeCode(){const pressed=document.querySelector('.airport-picker button[aria-pressed="true"] b');return (pressed?.textContent||'NPT').trim()}
 function serviceAt(freq,code){let best=null,dist=9;for(const p of services[code]||services.NPT){let d=Math.abs(p[1]-freq);if(d<dist){dist=d;best=p}}return dist<.018?best:null}
 function build(){const sim=document.querySelector('.simulator');if(!sim||radioBox)return;
   radioBox=document.createElement('section');radioBox.className='v14-radio';radioBox.innerHTML='<div class="head"><b>COM 1 · MANUAL ATC</b><span>[/] tune</span></div><div class="freq">118.300</div><div class="service">Northpoint Tower</div><div class="keys"></div>';
   sim.appendChild(radioBox);let keys=radioBox.querySelector('.keys');
   function repaint(){let code=activeCode(),svc=serviceAt(tuned,code);radioBox.querySelector('.freq').textContent=tuned.toFixed(3);radioBox.querySelector('.service').textContent=svc?`${code} ${svc[0]} · ${svc[1].toFixed(3)}`:`${code} · UNICOM / no controller`;keys.innerHTML='';for(const [name,f] of services[code]){let b=document.createElement('button');b.type='button';b.textContent=name+' '+f.toFixed(3);b.className=Math.abs(tuned-f)<.018?'active':'';b.onclick=()=>{tuned=f;repaint()};keys.appendChild(b)}}
   radioBox._repaint=repaint;repaint();
   let aud=document.createElement('div');aud.className='v14-audio';aud.innerHTML='<button type="button" data-a="engine">JET AUDIO</button><button type="button" data-a="music">FAINT MUSIC</button>';sim.appendChild(aud);
   aud.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;ensureAudio();if(b.dataset.a==='engine'){audioOn=!audioOn;b.classList.toggle('on',audioOn)}else{musicOn=!musicOn;b.classList.toggle('on',musicOn)}updateAudio()});
   let mach=document.createElement('div');mach.className='v14-mach';mach.innerHTML='CONCORDE · <b>MACH <span>0.00</span></b>';sim.appendChild(mach);
 }
 function ensureAudio(){if(audioCtx)return;let AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=new AC;let master=audioCtx.createGain();master.gain.value=.8;master.connect(audioCtx.destination);engineGain=audioCtx.createGain();engineGain.gain.value=0;engineGain.connect(master);
   const freqs=[42,84,168];freqs.forEach((f,i)=>{let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=i===0?'sawtooth':'sine';o.frequency.value=f;g.gain.value=[.18,.055,.025][i];o.connect(g);g.connect(engineGain);o.start()});
   let buf=audioCtx.createBuffer(1,audioCtx.sampleRate*2,audioCtx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);let ns=audioCtx.createBufferSource(),fil=audioCtx.createBiquadFilter(),ng=audioCtx.createGain();ns.buffer=buf;ns.loop=true;fil.type='bandpass';fil.frequency.value=680;fil.Q.value=.7;ng.gain.value=.24;ns.connect(fil);fil.connect(ng);ng.connect(engineGain);ns.start();
   musicGain=audioCtx.createGain();musicGain.gain.value=0;musicGain.connect(master);[174.61,220,261.63].forEach((f,i)=>{let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.018/(i+1);o.connect(g);g.connect(musicGain);o.start()})
 }
 function updateAudio(){if(!audioCtx)return;audioCtx.resume();let now=audioCtx.currentTime;engineGain.gain.setTargetAtTime(audioOn ? 0.38 : 0,now,.18);musicGain.gain.setTargetAtTime(musicOn ? 0.16 : 0,now,.5)}
 document.addEventListener('keydown',e=>{if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='['){tuned=Math.max(108,tuned-.025);radioBox?._repaint()}if(e.key===']'){tuned=Math.min(136.975,tuned+.025);radioBox?._repaint()}});
 let tries=0,t=setInterval(()=>{build();if(radioBox){radioBox._repaint();let mach=document.querySelector('.v14-mach'),ias=document.querySelector('.instrument b');if(mach){let on=window.__skyboundAircraftChoice==='CONCORDE';mach.style.display=on?'block':'none';if(on&&ias){let kt=parseFloat((ias.textContent||'0').replace(/,/g,''))||0;mach.querySelector('span').textContent=(kt/573).toFixed(2)}}}if(++tries>9999)clearInterval(t)},600);
})();
