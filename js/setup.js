
(()=>{
  window.__skyboundAircraftChoice=window.__skyboundAircraftChoice||'JX-200';
  window.__skyboundGateChoice=window.__skyboundGateChoice||'A01';
  const gates=[];for(const c of ['A','B','C'])for(let i=1;i<=16;i++)gates.push(c+String(i).padStart(2,'0'));
  function syncLabels(){
    const spec=document.querySelector('.aircraft-spec');
    if(spec){
      const strong=spec.querySelector('strong'),span=spec.querySelector('span');
      const planeLabel=window.__skyboundAircraftChoice==='CONCORDE'?'CONCORDE · SUPERSONIC':(window.__skyboundAircraftChoice==='JX-90'?'JX–90 REGIONAL':'JX–200');
      const gateLabel='Skybound One · Gate '+window.__skyboundGateChoice;
      if(strong&&strong.textContent!==planeLabel) strong.textContent=planeLabel;
      if(span&&span.textContent!==gateLabel) span.textContent=gateLabel;
    }
    const launch=document.querySelector('.launch-button');
    if(launch){
      const gateText='Start at gate '+window.__skyboundGateChoice;
      for(const n of [...launch.childNodes]){
        if(n.nodeType===3&&/Start at gate/.test(n.textContent||'')&&n.textContent!==gateText) n.textContent=gateText;
      }
    }
  }
  function wire(){
    const brief=document.querySelector('.briefing');if(!brief)return;
    if(!brief.querySelector('.v13-setup')){
      const spec=brief.querySelector('.aircraft-spec');if(!spec)return;
      const panel=document.createElement('div');panel.className='v13-setup';
      panel.innerHTML=`<div class="v13-row"><span>AIRCRAFT</span><div class="v13-options"><button type="button" data-plane="JX-200">JX–200</button><button type="button" data-plane="JX-90">JX–90 Regional</button><button type="button" data-plane="CONCORDE">Concorde · Mach 2</button></div></div><div class="v13-row"><span>START GATE</span><select class="v13-gate" aria-label="Choose departure gate">${gates.map(g=>`<option value="${g}">${g}</option>`).join('')}</select></div><div class="v13-note">Choose your departure stand. After landing, Ground assigns a different available gate automatically.</div>`;
      spec.parentNode.insertBefore(panel,spec);
      const sel=panel.querySelector('select');sel.value=window.__skyboundGateChoice;sel.addEventListener('change',()=>{window.__skyboundGateChoice=sel.value;syncLabels()});
      panel.querySelectorAll('[data-plane]').forEach(b=>{b.classList.toggle('active',b.dataset.plane===window.__skyboundAircraftChoice);b.addEventListener('click',()=>{window.__skyboundAircraftChoice=b.dataset.plane;panel.querySelectorAll('[data-plane]').forEach(x=>x.classList.toggle('active',x===b));syncLabels()})});
    }
    syncLabels();
    const sim=document.querySelector('.simulator');if(sim&&!sim.querySelector('.v13-speed-badge')){const d=document.createElement('div');d.className='v13-speed-badge';d.innerHTML='<b>3-COUNTRY WORLD</b> · sea restored · Concorde Mach 2 available';sim.appendChild(d)}
  }
  wire();
  let attempts=0;
  const setupTimer=setInterval(()=>{
    wire();
    attempts++;
    if(document.querySelector('.v13-setup')||attempts>40) clearInterval(setupTimer);
  },250);
})();
