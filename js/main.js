import{Renderer}from'./renderer.js';
import{World}from'./world.js';
import{aircraftGeometry,fighterGeometry,MeshBuilder}from'./geometry.js';
import{FlightModel,AIRCRAFT}from'./flight.js';
import{ATC}from'./atc.js';
import{AudioSystem}from'./audio.js';
import{UI}from'./ui.js';
import{mat4Model}from'./math.js';

const bootError=document.getElementById('bootError');
function fail(err){bootError.classList.remove('hidden');bootError.textContent='SKYBOUND 2.0 STARTUP ERROR\n'+(err?.stack||err?.message||String(err));console.error(err)}
window.addEventListener('error',e=>fail(e.error||e.message));window.addEventListener('unhandledrejection',e=>fail(e.reason));

try{
  const canvas=document.getElementById('simCanvas');
  const renderer=new Renderer(canvas);
  const world=new World();
  const flight=new FlightModel(world);
  const atc=new ATC(world);
  const audio=new AudioSystem();
  const ui=new UI(world,flight,atc,audio);

  renderer.upload('world',world.mesh);
  renderer.upload('JX-90',aircraftGeometry('JX-90',[.78,.84,.88]));
  renderer.upload('JX-200',aircraftGeometry('JX-200',[.86,.88,.90]));
  renderer.upload('CONCORDE',aircraftGeometry('CONCORDE',[.88,.88,.86]));
  renderer.upload('fighter',fighterGeometry());
  const car=new MeshBuilder();car.box(0,0,0,3.4,1.4,7.5,[.75,.19,.13]);renderer.upload('car',car.data());

  ui.onCamera=m=>renderer.setCameraMode(m);
  ui.onSpawn=()=>{renderer.setCameraMode('chase')};
  ui.onMenu=()=>{renderer.setCameraMode('chase')};

  const mapCanvas=document.getElementById('minimap'),mapCtx=mapCanvas.getContext('2d');
  function resizeMap(){const r=mapCanvas.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,1.5);const w=Math.max(260,Math.round(r.width*d)),h=Math.max(160,Math.round(r.height*d));if(mapCanvas.width!==w||mapCanvas.height!==h){mapCanvas.width=w;mapCanvas.height=h}}

  let last=performance.now();
  function loop(now){
    const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;
    world.update(dt);
    if(ui.started){flight.update(dt);audio.update(flight.throttle,flight.speed,flight.type);ui.update();}
    renderer.begin(flight,world);renderer.draw('world');
    // Civil traffic: deliberately few and fast.
    for(const p of world.traffic)renderer.drawAircraft(p.type,p,AIRCRAFT[p.type]?.scale||1);
    // City traffic - draw a performance-bounded sample of moving cars.
    for(let i=0;i<world.cars.length;i+=3){const c=world.cars[i];const heading=c.lane==='x'?Math.PI/2:0;renderer.draw('car',mat4Model(c.x,2.5,c.z,heading,0,0,1))}
    if(ui.started){renderer.drawAircraft(flight.type,flight,AIRCRAFT[flight.type]?.scale||1);
      if(flight.interceptor){const h=flight.heading,backX=-Math.sin(h)*70,backZ=Math.cos(h)*70,sideX=Math.cos(h)*28,sideZ=Math.sin(h)*28;const f1={x:flight.x+backX+sideX,y:flight.y+12,z:flight.z+backZ+sideZ,heading:h,pitch:flight.pitch,bank:flight.bank};const f2={x:flight.x+backX-sideX,y:flight.y+8,z:flight.z+backZ-sideZ,heading:h,pitch:flight.pitch,bank:flight.bank};renderer.drawAircraft('fighter',f1,.9);renderer.drawAircraft('fighter',f2,.9)}
      resizeMap();ui.drawMap(mapCtx);
    }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop);
}catch(err){fail(err)}
