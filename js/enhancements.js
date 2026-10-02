
(()=>{function wire(){const p=document.querySelector('.map-panel');if(p&&!p.dataset.expandWired){p.dataset.expandWired='1';const h=p.querySelector('.map-head');h&&h.addEventListener('click',()=>p.classList.toggle('map-expanded'));}}new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});wire();})();
