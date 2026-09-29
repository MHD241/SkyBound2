import{AIRCRAFT}from'./flight.js';

export class UI{
  constructor(world,flight,atc,audio){
    this.world=world;this.flight=flight;this.atc=atc;this.audio=audio;this.selectedAirport=null;this.selectedGate=null;this.selectedAircraft=null;this.mapZoom=1;this.started=false;
    this.el=id=>document.getElementById(id);this.screens=['mainMenu','worldScreen','gateScreen','hangarScreen'];this._bind();this._renderAircraft();
  }
  show(id){for(const s of this.screens)this.el(s).classList.toggle('screen-active',s===id)}
  _bind(){
    this.el('playBtn').onclick=()=>this.show('worldScreen');
    this.el('quickBtn').onclick=()=>{this.selectedAirport='NPT';this.selectedGate='A01';this.selectedAircraft='JX-200';this.spawn()};
    document.querySelectorAll('.back-home').forEach(b=>b.onclick=()=>this.show('mainMenu'));
    document.querySelectorAll('.airport-pin').forEach(b=>b.onclick=()=>this.chooseAirport(b.dataset.airport));
    this.el('gateBack').onclick=()=>this.show('worldScreen');this.el('hangarBack').onclick=()=>this.show('gateScreen');this.el('toHangarBtn').onclick=()=>this.show('hangarScreen');
    this.el('spawnBtn').onclick=()=>this.spawn();this.el('menuBtn').onclick=()=>this.returnMenu();
    document.querySelectorAll('.cam-btn').forEach(b=>b.onclick=()=>{document.querySelectorAll('.cam-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');this.onCamera?.(b.dataset.cam)});
    this.el('freqDown').onclick=()=>this.atc.step(-.005);this.el('freqUp').onclick=()=>this.atc.step(.005);document.querySelectorAll('[data-atc]').forEach(b=>b.onclick=()=>this.atc.tuneService(b.dataset.atc));
    this.el('apBtn').onclick=()=>{this.flight.ap.on=!this.flight.ap.on;this.el('apBtn').classList.toggle('active',this.flight.ap.on)};
    this.el('autolandBtn').onclick=()=>{this.flight.ap.autoland=!this.flight.ap.autoland;this.flight.ap.on=this.flight.ap.autoland||this.flight.ap.on;this.el('autolandBtn').classList.toggle('active',this.flight.ap.autoland);this.el('apBtn').classList.toggle('active',this.flight.ap.on)};
    for(const[id,key]of[['apHdg','hdg'],['apAlt','alt'],['apSpd','spd']])this.el(id).onchange=()=>{const v=Number(this.el(id).value);if(Number.isFinite(v))this.flight.ap[key]=v};
    this.el('engineAudioBtn').onclick=()=>this.el('engineAudioBtn').classList.toggle('active',this.audio.toggleEngine());this.el('musicBtn').onclick=()=>this.el('musicBtn').classList.toggle('active',this.audio.toggleMusic());
    this.el('mapPlus').onclick=()=>this.mapZoom=Math.min(5,this.mapZoom*1.35);this.el('mapMinus').onclick=()=>this.mapZoom=Math.max(.4,this.mapZoom/1.35);this.el('mapExpand').onclick=()=>this.el('minimapPanel').classList.toggle('expanded');
  }
  chooseAirport(code){this.selectedAirport=code;this.selectedGate=null;const a=this.world.airports[code];this.el('gateTitle').textContent=`${a.name} · choose a gate`;this.el('airportReadout').textContent=`${a.code} · ${a.name}`;this.el('gateReadout').textContent='Choose on map';this.el('toHangarBtn').disabled=true;this._renderAirportPlan(a);this.show('gateScreen')}
  _renderAirportPlan(a){const p=this.el('airportPlan');p.innerHTML='';
    // simple top-down runway/taxi geometry for clickable selection.
    const runwayCount=a.runways.length;for(let i=0;i<runwayCount;i++){const r=document.createElement('div');r.className='taxi-line';r.style.left=`${46+i*8}%`;r.style.top='12%';r.style.width='2.5%';r.style.height='76%';p.appendChild(r)}
    a.gates.forEach((g,i)=>{const b=document.createElement('button');b.className='gate-node';b.textContent=g.id;b.title=`Gate ${g.id}`;const row=Math.floor(i/Math.ceil(a.gates.length/(a.code==='SSI'?3:2)));const col=i%Math.ceil(a.gates.length/(a.code==='SSI'?3:2));const cols=Math.ceil(a.gates.length/(a.code==='SSI'?3:2));b.style.left=`${18+col*(64/Math.max(1,cols-1))}%`;b.style.top=`${a.code==='SSI'?18+row*25:23+row*45}%`;b.onclick=()=>{p.querySelectorAll('.gate-node').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');this.selectedGate=g.id;this.el('gateReadout').textContent=`Gate ${g.id}`;this.el('toHangarBtn').disabled=false;this._updateSpawnSummary()};p.appendChild(b)});
  }
  _renderAircraft(){const grid=this.el('aircraftGrid');grid.innerHTML='';for(const[type,d]of Object.entries(AIRCRAFT)){const card=document.createElement('button');card.className='aircraft-card'+(type==='CONCORDE'?' concorde':'');card.dataset.type=type;card.innerHTML=`<div class="plane-silhouette"></div><div><div class="eyebrow">${d.supersonic?'SUPERSONIC':'CIVIL AIRLINER'}</div><h3>${d.name}</h3></div><p>${type==='JX-90'?'Short-haul regional jet with quicker handling.':type==='JX-200'?'Balanced medium-haul airliner. Easy to fly and land.':'Long-range Mach 2 flagship for Supersonic Island.'}</p><div class="spec-row"><span>MAX ${Math.round(d.max*1.94384)} KT</span><span>STALL ${Math.round(d.stall*1.94384)} KT</span></div>`;card.onclick=()=>{grid.querySelectorAll('.aircraft-card').forEach(x=>x.classList.remove('selected'));card.classList.add('selected');this.selectedAircraft=type;this.el('spawnBtn').disabled=this.selectedAirport==='SSI'&&type!=='CONCORDE';this._updateSpawnSummary()};grid.appendChild(card)} }
  _updateSpawnSummary(){const a=this.selectedAirport&&this.world.airports[this.selectedAirport];this.el('spawnSummary').textContent=a&&this.selectedGate?`${a.code} · Gate ${this.selectedGate}${this.selectedAircraft?' · '+this.selectedAircraft:''}`:'Choose a gate and aircraft.';if(this.selectedAirport==='SSI'&&this.selectedAircraft&&this.selectedAircraft!=='CONCORDE')this.el('spawnSummary').textContent+=' · Supersonic aircraft required.'}
  spawn(){if(!this.selectedAirport||!this.selectedGate||!this.selectedAircraft)return;this.flight.spawn(this.selectedAircraft,this.selectedAirport,this.selectedGate);this.atc.setAirport(this.selectedAirport);for(const s of this.screens)this.el(s).classList.remove('screen-active');this.el('hud').classList.remove('hidden');this.started=true;this.el('airportStatus').textContent=this.selectedAirport;this.el('gateStatus').textContent=this.selectedGate;this.el('aircraftStatus').textContent=this.selectedAircraft;this.el('apHdg').value=Math.round(this.flight.hdg);this.onSpawn?.()}
  returnMenu(){this.started=false;this.el('hud').classList.add('hidden');this.flight.reset();this.selectedAirport=this.selectedGate=this.selectedAircraft=null;this.el('spawnBtn').disabled=true;this.show('mainMenu');this.onMenu?.()}
  update(){if(!this.started)return;const f=this.flight;this.el('iasText').textContent=Math.round(f.knots);this.el('altText').textContent=Math.round(f.altFt).toLocaleString();this.el('hdgText').textContent=String(Math.round(f.hdg)%360).padStart(3,'0');this.el('vsText').textContent=Math.round(f.vs/100)*100;this.el('phaseStatus').textContent=f.phase;this.el('throttleFill').style.width=Math.round(f.throttle*100)+'%';this.el('throttleText').textContent=`THR ${Math.round(f.throttle*100)}%`;this.el('freqText').textContent=this.atc.freq.toFixed(3);this.el('serviceText').textContent=this.atc.label();this.el('atcMessage').textContent=this.atc.message;
    const w=this.el('warningBanner'),t=this.el('tracerOverlay');if(f.interceptor){w.classList.remove('hidden');w.textContent='RESTRICTED AIRSPACE · INTERCEPTORS ACTIVE · LEAVE SUPERSONIC ISLAND';if((Math.floor(f.interceptorTimer*2)%4)===0)t.classList.add('fire');else t.classList.remove('fire')}else{w.classList.add('hidden');t.classList.remove('fire')}
  }
  drawMap(ctx){
    const f=this.flight,c=ctx.canvas,w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#071c29';ctx.fillRect(0,0,w,h);const z=this.mapZoom,scale=.0015*z;const cx=w/2,cy=h/2;ctx.strokeStyle='rgba(120,180,205,.13)';ctx.lineWidth=1;for(let x=0;x<w;x+=45)ctx.strokeRect(x,0,1,h);for(let y=0;y<h;y+=45)ctx.strokeRect(0,y,w,1);
    for(const a of Object.values(this.world.airports)){const x=cx+(a.x-f.x)*scale,y=cy+(a.z-f.z)*scale;ctx.fillStyle=a.restricted?'#ffb84a':'#42d8e8';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dff5fb';ctx.font='10px system-ui';ctx.fillText(a.code,x+8,y+3)}
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-f.heading);ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,8);ctx.lineTo(0,5);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.restore();
  }
}
