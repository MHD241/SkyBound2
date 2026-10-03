(function(){
  'use strict';
  const state={airport:'NPT',plane:'JX-200',mode:'pilot',screen:'home',panel:null};
  const airports={
    NPT:{name:'Northpoint International',sub:'Primary metropolitan hub'},
    CBY:{name:'Coral Bay International',sub:'Coastal city gateway'},
    GMI:{name:'Supersonic Island',sub:'Restricted long-range airport'}
  };
  const planes={
    'JX-90':{name:'JX–90 Regional',tag:'Light · responsive',speed:'430 KT',role:'REGIONAL',diff:'EASY'},
    'JX-200':{name:'JX–200',tag:'Balanced flagship airliner',speed:'510 KT',role:'AIRLINER',diff:'NORMAL'},
    'CONCORDE':{name:'Concorde',tag:'Supersonic long-range aircraft',speed:'MACH 2',role:'SUPERSONIC',diff:'FAST'}
  };

  function el(tag,cls,html){const n=document.createElement(tag);if(cls)n.className=cls;if(html!==undefined)n.innerHTML=html;return n}
  function setScreen(name){state.screen=name;document.querySelectorAll('#sbmMenu .sbm-stage').forEach(x=>x.classList.toggle('active',x.dataset.stage===name));refresh()}
  function refresh(){
    document.querySelectorAll('.sbm-airport-pin').forEach(b=>b.classList.toggle('selected',b.dataset.airport===state.airport));
    document.querySelectorAll('.sbm-plane-card').forEach(b=>b.classList.toggle('selected',b.dataset.plane===state.plane));
    const a=airports[state.airport],p=planes[state.plane];
    document.querySelectorAll('[data-sbm-airport-name]').forEach(n=>n.textContent=a.name);
    document.querySelectorAll('[data-sbm-airport-code]').forEach(n=>n.textContent=state.airport);
    document.querySelectorAll('[data-sbm-plane-name]').forEach(n=>n.textContent=p.name);
    const launch=document.getElementById('sbmLaunch');
    if(launch){const invalid=state.airport==='GMI'&&state.plane!=='CONCORDE';launch.disabled=invalid;launch.textContent=invalid?'SUPERSONIC AIRCRAFT REQUIRED':'ENTER SIMULATOR'} const next=document.getElementById('sbmAirportNext');if(next)next.textContent=state.mode==='ground'?'START GROUND SHIFT':'CHOOSE AIRCRAFT';
  }
  function buildMenu(){
    const menu=el('div','','');menu.id='sbmMenu';
    menu.innerHTML=`
      <section class="sbm-stage active" data-stage="home"><div class="sbm-shell sbm-hero">
        <div><div class="sbm-kicker">Skybound Flight Simulator</div><h1 class="sbm-logo">SKYBOUND<span>FLIGHT, REIMAGINED</span></h1><p class="sbm-lead">Choose your airport, pick an aircraft, and go straight into the simulator. The flight view stays clean; every system is one button away when you need it.</p><button class="sbm-primary" id="sbmStart">START FLIGHT</button></div>
        <div class="sbm-hero-card"><div class="sbm-kicker">LIVE WORLD</div><div class="sbm-flight-art"><div class="sbm-plane-art"></div></div><div class="sbm-card-stat"><div><small>AIRPORTS</small><b>3 WORLD HUBS</b></div><div><small>FLEET</small><b>3 AIRCRAFT</b></div><div><small>MODE</small><b>FREE FLIGHT</b></div></div></div>
      </div></section>
      <section class="sbm-stage" data-stage="mode"><div class="sbm-shell"><div class="sbm-flow-head"><div><div class="sbm-kicker">Choose Mode</div><h2>What are you doing today?</h2></div><p>Pilot Mode stays exactly as it is. Ground Crew Mode puts you on the apron with NPC aircraft and a realistic pushback tug.</p></div><div class="sbm-mode-grid">
        <button class="sbm-mode-card" id="sbmPilotMode"><span class="sbm-mode-icon">✈</span><div><small>FLIGHT DECK</small><h3>Pilot Mode</h3><p>Choose your airport and aircraft, then fly the existing Skybound simulator.</p></div><b>FLY →</b></button>
        <button class="sbm-mode-card ground" id="sbmGroundMode"><span class="sbm-mode-icon">◆</span><div><small>APRON OPERATIONS</small><h3>Ground Crew</h3><p>Walk the airport, drive a tug, and push approved NPC aircraft from their gates.</p></div><b>START SHIFT →</b></button>
      </div><div class="sbm-selection-foot"><div class="sbm-selection-summary">Pilot Mode is untouched in this build.</div><button class="sbm-secondary" data-back="home">BACK</button></div></div></section>
      <section class="sbm-stage" data-stage="map"><div class="sbm-shell"><div class="sbm-stepbar"><i class="on"></i><i></i></div><div class="sbm-flow-head"><div><div class="sbm-kicker">Step 1 · Airport</div><h2>Where are you flying from?</h2></div><p>Pick an airport directly from the world map. Supersonic Island is reserved for Concorde operations.</p></div><div class="sbm-map-card"><div class="sbm-map-grid"></div><div class="sbm-island npt"></div><div class="sbm-island cby"></div><div class="sbm-island gmi"></div>
        <button class="sbm-airport-pin selected" data-airport="NPT"><span><b>NPT · Northpoint</b><small>METROPOLITAN INTERNATIONAL</small></span></button>
        <button class="sbm-airport-pin" data-airport="CBY"><span><b>CBY · Coral Bay</b><small>COASTAL INTERNATIONAL</small></span></button>
        <button class="sbm-airport-pin" data-airport="GMI"><span><b>GMI · Supersonic Island</b><small>RESTRICTED SUPERSONIC HUB</small></span></button>
      </div><div class="sbm-selection-foot"><div class="sbm-selection-summary">Selected: <b data-sbm-airport-name>Northpoint International</b></div><div style="display:flex;gap:10px"><button class="sbm-secondary" data-back="home">BACK</button><button class="sbm-primary" id="sbmAirportNext">CHOOSE AIRCRAFT</button></div></div></div></section>
      <section class="sbm-stage" data-stage="hangar"><div class="sbm-shell"><div class="sbm-stepbar"><i class="on"></i><i class="on"></i></div><div class="sbm-flow-head"><div><div class="sbm-kicker">Step 2 · Aircraft</div><h2>Choose your aircraft.</h2></div><p><span data-sbm-airport-code>NPT</span> · <span data-sbm-airport-name>Northpoint International</span>. Your gate will be assigned automatically when the simulation starts.</p></div><div class="sbm-hangar">
        <article class="sbm-plane-card" data-plane="JX-90"><div class="sbm-plane-preview"><div class="sbm-plane-silhouette">✈</div></div><h3>JX–90 Regional</h3><p>Smaller, lighter and forgiving. Ideal for short hops and easy handling.</p><div class="sbm-specs"><span><small>CRUISE</small>430 KT</span><span><small>CLASS</small>REGIONAL</span><span><small>HANDLING</small>EASY</span></div></article>
        <article class="sbm-plane-card selected" data-plane="JX-200"><div class="sbm-plane-preview"><div class="sbm-plane-silhouette">✈</div></div><h3>JX–200</h3><p>The balanced Skybound flagship. Stable, fast and suited to every normal airport.</p><div class="sbm-specs"><span><small>CRUISE</small>510 KT</span><span><small>CLASS</small>AIRLINER</span><span><small>HANDLING</small>NORMAL</span></div></article>
        <article class="sbm-plane-card" data-plane="CONCORDE"><div class="sbm-plane-preview"><div class="sbm-plane-silhouette">✈</div></div><h3>Concorde</h3><p>High-speed delta-wing transport. Required for Supersonic Island operations.</p><div class="sbm-specs"><span><small>CRUISE</small>MACH 2</span><span><small>CLASS</small>SUPERSONIC</span><span><small>HANDLING</small>FAST</span></div></article>
      </div><div class="sbm-hangar-foot"><div class="sbm-selection-summary"><b data-sbm-plane-name>JX–200</b> · <span data-sbm-airport-name>Northpoint International</span></div><div style="display:flex;gap:10px"><button class="sbm-secondary" data-back="map">BACK</button><button class="sbm-primary" id="sbmLaunch">ENTER SIMULATOR</button></div></div></div></section>`;
    document.body.appendChild(menu);
    menu.addEventListener('click',e=>{
      const airport=e.target.closest('[data-airport]');if(airport){state.airport=airport.dataset.airport;refresh();return}
      const plane=e.target.closest('[data-plane]');if(plane){if(state.airport==='GMI'&&plane.dataset.plane!=='CONCORDE')return;state.plane=plane.dataset.plane;refresh();return}
      const back=e.target.closest('[data-back]');if(back){setScreen(back.dataset.back);return}
    });
    document.getElementById('sbmStart').addEventListener('click',()=>setScreen('mode'));
    document.getElementById('sbmPilotMode').addEventListener('click',()=>{state.mode='pilot';setScreen('map')});
    document.getElementById('sbmGroundMode').addEventListener('click',()=>{state.mode='ground';setScreen('map')});
    document.getElementById('sbmAirportNext').addEventListener('click',()=>{if(state.mode==='ground'){launchGroundCrew();return}if(state.airport==='GMI')state.plane='CONCORDE';setScreen('hangar')});
    document.getElementById('sbmLaunch').addEventListener('click',launchGame);
    refresh();
  }

  async function launchGroundCrew(){
    const btn=document.getElementById('sbmAirportNext');
    const original=btn.textContent;btn.disabled=true;btn.textContent='LOADING AIRPORT…';
    try{
      const brief=await waitFor('.briefing');
      const airportButtons=[...document.querySelectorAll('.airport-picker button')];
      const chosen=airportButtons.find(b=>(b.querySelector('b')?.textContent||'').trim()===state.airport);chosen?.click();
      window.__skyboundGroundMode=true;
      window.__skyboundAircraftChoice='JX-200';
      window.__skyboundGateChoice='B06';
      const gateSelect=document.querySelector('.v13-gate');if(gateSelect){gateSelect.value=window.__skyboundGateChoice;gateSelect.dispatchEvent(new Event('change',{bubbles:true}))}
      const launch=await waitFor('.briefing .launch-button');
      document.body.classList.add('sbm-flight-mode','sbm-ground-mode');
      document.getElementById('sbmMenu')?.remove();
      launch.click();
      const started=Date.now();while(!window.SkyboundGroundCrew&&Date.now()-started<5000)await new Promise(r=>setTimeout(r,50));
      if(!window.SkyboundGroundCrew)throw new Error('Ground Crew controller did not load');
      window.SkyboundGroundCrew.start({airport:state.airport,gate:window.__skyboundGateChoice});
    }catch(err){console.error(err);window.__skyboundGroundMode=false;btn.disabled=false;btn.textContent='TRY AGAIN';alert('Ground Crew Mode could not start. Reload once and try again.');}
    finally{if(document.body.contains(btn)){btn.disabled=false;btn.textContent=original}}
  }

  function waitFor(sel,timeout=8000){return new Promise((resolve,reject)=>{const start=Date.now();const t=setInterval(()=>{const n=document.querySelector(sel);if(n){clearInterval(t);resolve(n)}else if(Date.now()-start>timeout){clearInterval(t);reject(new Error('Missing '+sel))}},80)})}
  async function launchGame(){
    window.__skyboundGroundMode=false;
    const btn=document.getElementById('sbmLaunch');if(btn.disabled)return;const original=btn.textContent;btn.textContent='PREPARING FLIGHT…';btn.disabled=true;
    try{
      const brief=await waitFor('.briefing');
      const airportButtons=[...document.querySelectorAll('.airport-picker button')];
      const chosen=airportButtons.find(b=>(b.querySelector('b')?.textContent||'').trim()===state.airport);chosen?.click();
      window.__skyboundAircraftChoice=state.plane;
      const planeButton=document.querySelector(`.v13-setup [data-plane="${state.plane}"]`);planeButton?.click();
      const gates=['A01','A04','A08','B03','B07','B12','C02','C09'];
      window.__skyboundGateChoice=gates[Math.floor(Math.random()*gates.length)];
      const gateSelect=document.querySelector('.v13-gate');if(gateSelect){gateSelect.value=window.__skyboundGateChoice;gateSelect.dispatchEvent(new Event('change',{bubbles:true}))}
      const launch=await waitFor('.briefing .launch-button');
      document.body.classList.add('sbm-flight-mode');
      document.getElementById('sbmMenu')?.remove();
      launch.click();
      ensureFlightShell();
    }catch(err){console.error(err);btn.disabled=false;btn.textContent='TRY AGAIN';alert('Skybound could not start the flight UI yet. Reload once and try again.');}
    finally{if(document.body.contains(btn)){btn.disabled=false;btn.textContent=original}}
  }

  const panelDefs=[
    ['ATC','.tower-panel'],['COM','.v14-radio'],['MAP','.map-panel'],['INFO','.passenger-panel'],['THR','.throttle-control'],['AUDIO','.v14-audio']
  ];
  function ensureFlightShell(){
    if(document.getElementById('sbmDock'))return;
    const dock=el('div');dock.id='sbmDock';
    panelDefs.forEach(([name,sel])=>{const b=el('button','sbm-dock-btn',name);b.type='button';b.dataset.panel=sel;b.addEventListener('click',()=>togglePanel(sel,b));dock.appendChild(b)});
    const menuBtn=el('button','sbm-dock-btn menu','MENU');menuBtn.type='button';menuBtn.addEventListener('click',()=>window.location.reload());dock.appendChild(menuBtn);
    const close=el('button');close.id='sbmPanelClose';close.type='button';close.setAttribute('aria-label','Close panel');close.textContent='×';close.addEventListener('click',closePanels);
    document.body.append(dock,close);
  }
  function closePanels(){
    document.querySelectorAll('.sbm-panel-open').forEach(n=>n.classList.remove('sbm-panel-open'));
    document.querySelectorAll('.sbm-dock-btn.active').forEach(n=>n.classList.remove('active'));
    document.body.classList.remove('sbm-has-panel');state.panel=null;
  }
  function togglePanel(sel,button){
    const target=document.querySelector(sel);if(!target)return;
    const same=target.classList.contains('sbm-panel-open');closePanels();if(same)return;
    target.classList.add('sbm-panel-open');button.classList.add('active');document.body.classList.add('sbm-has-panel');state.panel=sel;
  }

  // Build menu immediately. The underlying simulator can finish booting behind it.
  buildMenu();
  // If the page was restored from browser cache with flight mode, make sure the dock exists.
  if(document.body.classList.contains('sbm-flight-mode'))ensureFlightShell();
})();
