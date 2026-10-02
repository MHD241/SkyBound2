
(function(){
  const apply=function(){
    document.body.classList.add('skybound-redesign');
    const eyebrow=document.querySelector('.briefing .eyebrow');
    if(eyebrow && !eyebrow.dataset.redesign){ eyebrow.dataset.redesign='1'; eyebrow.lastChild && (eyebrow.lastChild.textContent='OPERATIONS HUB'); }
    const h1=document.querySelector('.briefing h1');
    if(h1 && !h1.dataset.redesign){ h1.dataset.redesign='1'; h1.innerHTML='Ready for<br><em>departure.</em>'; }
    const p=document.querySelector('.briefing p');
    if(p && !p.dataset.redesign){ p.dataset.redesign='1'; p.innerHTML='A cleaner Skybound control deck with redesigned HUD styling.<br>Choose your airport, aircraft, and launch into a denser world.'; }
    const launch=document.querySelector('.launch-button');
    if(launch && !launch.dataset.redesign){ launch.dataset.redesign='1'; launch.textContent=launch.textContent.replace('Start at gate','Launch from'); }
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
  const mo=new MutationObserver(()=>apply());
  mo.observe(document.documentElement,{childList:true,subtree:true});
})();
