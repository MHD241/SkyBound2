
window.__skyboundAircraftChoice='JX-200';
window.__skyboundGateChoice='A01';
(function(){
  function showBootError(msg){
    try{
      var old=document.getElementById('skyboundBootError'); if(old) return;
      var d=document.createElement('div'); d.id='skyboundBootError';
      d.style.cssText='position:fixed;z-index:2147483647;left:18px;right:18px;top:18px;padding:16px 18px;background:#2b1010;color:#fff;border:1px solid #ff7b7b;border-radius:10px;font:14px/1.45 ui-monospace,Menlo,monospace;white-space:pre-wrap;box-shadow:0 12px 40px #0008';
      d.textContent='SKYBOUND STARTUP ERROR\n'+String(msg);
      (document.body||document.documentElement).appendChild(d);
    }catch(_){}
  }
  window.addEventListener('error',function(e){showBootError((e.message||'Unknown error')+(e.filename?'\n'+e.filename+':'+e.lineno+':'+e.colno:''));});
  window.addEventListener('unhandledrejection',function(e){var r=e.reason;showBootError(r&&r.stack?r.stack:(r&&r.message?r.message:String(r)));});
  setTimeout(function(){if(!document.querySelector('.simulator')) showBootError('The simulator did not mount within 5 seconds. This is a boot failure, not a WebGL failure.');},5000);
})();
