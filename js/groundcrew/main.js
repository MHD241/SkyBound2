const DEG=Math.PI/180;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a};
const vehicleForward=h=>[Math.sin(h),-Math.cos(h)];
const vehicleRight=h=>[Math.cos(h),Math.sin(h)];
const cameraForward=yaw=>[Math.cos(yaw),-Math.sin(yaw)];
const cameraRight=yaw=>[Math.sin(yaw),Math.cos(yaw)];
const headingFromForward=(x,z)=>Math.atan2(x,-z);
const AIRPORTS={NPT:{rotation:0,scale:.88},CBY:{rotation:Math.PI/3,scale:.86},GMI:{rotation:-Math.PI/5,scale:1.58}};
const BASE_GATE={id:'B06',x:1350,z:120,heading:0};
const GATES=[
  ...Array.from({length:16},(_,i)=>({id:`B${String(i+1).padStart(2,'0')}`,x:750+i*120,z:120,heading:0})),
  ...Array.from({length:16},(_,i)=>({id:`C${String(i+1).padStart(2,'0')}`,x:750+i*120,z:390,heading:Math.PI}))
];

class GroundCrew{
  constructor(opts={}){
    this.opts=opts;this.keys={};this.running=true;this.last=performance.now();this.scale=AIRPORTS[opts.airport]?.scale||1;
    this.activeGate=BASE_GATE;this.queue=[];this.served=new Set();this.turnCounter=0;this.turnType='departure';
    this.job='service';this.serviceStage='init';this.bridgeJob='connected';this.attached=false;this.mainGear=null;
    this.taxiPath=[];this.taxiIndex=0;this.taxiT=0;this.nextJobT=0;this.bridgeDockT=0;this.transferT=0;
    this.state=window.__sbGCState={
      ready:false,role:'combined',mode:'walk',x:0,z:0,h:0,
      tugX:0,tugZ:0,tugH:0,tugSpeed:0,tugSteer:0,
      planeX:0,planeZ:0,planeH:0,towAngle:0,extraPlanes:[],parkedBridges:[],
      bridgeBaseX:0,bridgeBaseZ:0,bridgeBaseH:0,bridgeH:0,bridgeExtend:8,bridgeHeight:3.8,bridgeDocked:true,bridgeControl:false,bridgeVisible:true,
      bagX:0,bagZ:0,bagH:0,bagSpeed:0,bagSteer:0,bagLoaded:false,bagAtAircraft:false,
      beltX:0,beltZ:0,beltH:0,beltSpeed:0,beltSteer:0,beltConnected:false,
      bagBuildingX:0,bagBuildingZ:0,bagBuildingH:0,carouselX:0,carouselZ:0,
      cargoX:0,cargoZ:0,cargoH:0,cargoDoorOpen:false,
      bagTransferActive:false,bagTransferProgress:0,bagTransferDir:'load',
      demandCount:32
    };
    this.uiBuild();this.bind();window.addEventListener('skybound-ground-ready',()=>this.ready(),{once:true});requestAnimationFrame(t=>this.frame(t));
  }

  uiBuild(){
    const n=document.createElement('div');n.id='gcOverlay';n.innerHTML=`
      <div class="gc-brand"><b>SKYBOUND GROUND</b><span>${this.opts.airport||'NPT'} · HIGH DEMAND SHIFT</span></div>
      <section class="gc-task"><small>GROUND OPERATIONS</small><h2 id="gcTitle">Stand by for assignment</h2><p id="gcText">Ground is building the turnaround queue.</p><div class="gc-row gc-row-4"><span>GATE <b id="gcGate">—</b></span><span>AIRCRAFT <b>JX–200</b></span><span>DEMAND <b id="gcDemand">32</b></span><span>TOW <b id="gcTow">0°</b></span></div><div id="gcApproval" class="gc-approval">AWAITING GROUND</div></section>
      <div class="gc-help" id="gcHelp">WASD move · E interact · mouse drag camera</div><div id="gcLocator" class="gc-locator">SERVICE AREA · locating…</div><div id="gcPrompt" class="gc-prompt"></div>
      <div class="gc-top-actions"><button id="gcAtcBtn">ATC</button><button id="gcMenu">MENU</button></div>
      <section id="gcAtcPanel" class="gc-atc-panel"><header><div><small>GROUND CONTROL</small><b>${this.opts.airport||'NPT'} GROUND</b></div><button id="gcAtcClose">×</button></header><div id="gcAtcLog" class="gc-atc-log"></div><div class="gc-atc-quick"><button data-atc="request">REQUEST PUSHBACK</button><button data-atc="ready">REPORT READY</button><button data-atc="sayagain">SAY AGAIN</button></div><form id="gcAtcForm"><input id="gcAtcInput" autocomplete="off" placeholder="Type to Ground…"/><button>SEND</button></form></section>`;
    document.body.appendChild(n);
    this.ui={title:n.querySelector('#gcTitle'),text:n.querySelector('#gcText'),gate:n.querySelector('#gcGate'),tow:n.querySelector('#gcTow'),demand:n.querySelector('#gcDemand'),approval:n.querySelector('#gcApproval'),prompt:n.querySelector('#gcPrompt'),help:n.querySelector('#gcHelp'),locator:n.querySelector('#gcLocator'),atcPanel:n.querySelector('#gcAtcPanel'),atcLog:n.querySelector('#gcAtcLog'),atcInput:n.querySelector('#gcAtcInput')};
    n.querySelector('#gcMenu').onclick=()=>location.reload();n.querySelector('#gcAtcBtn').onclick=()=>this.ui.atcPanel.classList.add('open');n.querySelector('#gcAtcClose').onclick=()=>this.ui.atcPanel.classList.remove('open');
    n.querySelectorAll('[data-atc]').forEach(b=>b.onclick=()=>this.handleAtc(b.dataset.atc));n.querySelector('#gcAtcForm').onsubmit=e=>{e.preventDefault();const v=this.ui.atcInput.value.trim();if(v){this.atcSay('YOU',v);this.parseAtc(v);this.ui.atcInput.value=''}};
    this.atcSay('GROUND','High-demand shift opening. Thirty-two gate turns are active. Follow Ground task priority.');
  }

  bind(){
    const block=['KeyW','KeyA','KeyS','KeyD','KeyE','Space','ShiftLeft','ShiftRight','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyQ','KeyR','KeyF'];
    this.kd=e=>{if(!window.__skyboundGroundMode)return;if(['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;if(block.includes(e.code)){e.preventDefault();e.stopImmediatePropagation()}this.keys[e.code]=true;if(e.code==='KeyE'&&!e.repeat)this.interact()};
    this.ku=e=>{if(!window.__skyboundGroundMode)return;this.keys[e.code]=false;if(block.includes(e.code)){e.preventDefault();e.stopImmediatePropagation()}};
    window.addEventListener('keydown',this.kd,true);window.addEventListener('keyup',this.ku,true);
  }

  atcSay(who,msg){const row=document.createElement('div');row.className='gc-atc-msg '+(who==='YOU'?'you':'ground');row.innerHTML=`<b>${who}</b><span>${msg}</span>`;this.ui.atcLog.appendChild(row);this.ui.atcLog.scrollTop=this.ui.atcLog.scrollHeight}
  handleAtc(type){if(type==='request'){this.atcSay('YOU',`Ground, Gate ${this.activeGate.id} requests pushback.`);this.approvePushback()}else if(type==='ready'){this.atcSay('YOU',`Ground, Gate ${this.activeGate.id} ground crew reporting ready.`);this.reportReady()}else{this.atcSay('YOU','Ground, say again.');this.repeatAtc()}}
  parseAtc(v){const q=v.toLowerCase();if(q.includes('push'))return this.approvePushback();if(q.includes('ready'))return this.reportReady();if(q.includes('bag')||q.includes('cargo'))return this.atcSay('GROUND',this.serviceInstruction());if(q.includes('bridge'))return this.atcSay('GROUND',this.bridgeInstruction());if(q.includes('gate')||q.includes('where'))return this.atcSay('GROUND',`Priority aircraft is Gate ${this.activeGate.id}. ${this.serviceInstruction()}`);if(q.includes('again')||q.includes('repeat'))return this.repeatAtc();this.atcSay('GROUND',this.serviceInstruction())}
  reportReady(){this.atcSay('GROUND',this.serviceInstruction())}
  repeatAtc(){this.atcSay('GROUND',this.job==='approved'?`Gate ${this.activeGate.id}, pushback approved. Connect at the nose gear.`:this.job==='pushback'?`Continue pushback Gate ${this.activeGate.id}.`:this.job==='release'?`Release point reached. Stop and disconnect.`:this.serviceInstruction())}
  bridgeInstruction(){const s=this.state;if(s.bridgeDocked)return`Gate ${this.activeGate.id} jetbridge remains connected. Keep it connected until baggage service is complete, then disconnect and retract it.`;return s.bridgeExtend>10?`Jetbridge disconnected. Retract it clear of the aircraft.`:`Jetbridge is clear.`}
  serviceInstruction(){
    const g=this.activeGate.id;
    const map={
      'dep-collect-bags':`Gate ${g}: collect departure bags from the baggage hall carousel with the baggage train.`,
      'dep-cart-to-aircraft':`Gate ${g}: take the loaded baggage train to the cargo hold and park it beside the belt-loader position.`,
      'dep-position-belt':`Gate ${g}: bring the belt loader to the cargo hold and connect it.`,
      'dep-open-cargo':`Gate ${g}: open the cargo hold, then start loading.`,
      'dep-transfer':`Gate ${g}: baggage loading is in progress. Hold the stand clear.`,
      'dep-close-cargo':`Gate ${g}: loading complete. Close the cargo compartment.`,
      'dep-clear-equipment':`Gate ${g}: remove the belt loader and baggage train from the aircraft service zone.`,
      'dep-disconnect-bridge':`Gate ${g}: disconnect and retract the jetbridge, then report ready for pushback.`,
      'ready-pushback':`Gate ${g}: turnaround complete. Request pushback when the tug is at the stand.`,
      'arr-position-cart':`Gate ${g}: arrival baggage. Bring an empty baggage train to the cargo hold.`,
      'arr-position-belt':`Gate ${g}: position and connect the belt loader.`,
      'arr-open-cargo':`Gate ${g}: open the cargo hold and start unloading.`,
      'arr-transfer':`Gate ${g}: baggage unloading is in progress.`,
      'arr-close-cargo':`Gate ${g}: unloading complete. Close the cargo compartment and clear the belt loader.`,
      'arr-to-carousel':`Gate ${g}: take the loaded baggage train to the baggage hall carousel.`,
      'arr-unload-carousel':`Unload arrival bags at the carousel with E.`,
      'arrival-complete':`Arrival baggage complete at Gate ${g}. Stand by for the next priority aircraft.`
    };return map[this.serviceStage]||`Gate ${g}: stand by for Ground instructions.`;
  }

  ready(){
    const s=this.state,ps=window.__sbPilotState;if(!ps||!Number.isFinite(ps.x)||!Number.isFinite(ps.z))return;
    s.planeX=ps.x;s.planeZ=ps.z;s.planeH=ps.heading||0;this.baseWorld={x:ps.x,z:ps.z,h:ps.heading||0};this.home={x:s.planeX,z:s.planeZ};
    const r=vehicleRight(s.planeH),f=vehicleForward(s.planeH);s.x=ps.x+r[0]*34+f[0]*18;s.z=ps.z+r[1]*34+f[1]*18;s.h=s.planeH;
    s.tugX=ps.x+f[0]*42+r[0]*18;s.tugZ=ps.z+f[1]*42+r[1]*18;s.tugH=s.planeH+Math.PI;
    const building=this.localPoint(190,-150),carousel=this.localPoint(225,-125),bag=this.localPoint(260,-92),belt=this.localPoint(315,-70);
    s.bagBuildingX=building.x;s.bagBuildingZ=building.z;s.bagBuildingH=this.baseWorld.h;s.carouselX=carousel.x;s.carouselZ=carousel.z;
    s.bagX=bag.x;s.bagZ=bag.z;s.bagH=this.baseWorld.h;s.beltX=belt.x;s.beltZ=belt.z;s.beltH=this.baseWorld.h;
    this.buildQueue();this.setupTurn('departure',BASE_GATE);s.ready=true;
    this.ui.help.textContent='WASD walk/drive · E interact · Space brake · jetbridge W/S extend A/D rotate R/F height Q exit';
    this.atcSay('GROUND',`Priority Gate ${this.activeGate.id}. Departure turnaround: load baggage first. ${s.demandCount} active turns in the queue.`);
  }

  localPoint(x,z){const dx=(x-BASE_GATE.x)*this.scale,dz=(z-BASE_GATE.z)*this.scale,r=vehicleRight(this.baseWorld.h),f=vehicleForward(this.baseWorld.h);return{x:this.baseWorld.x+r[0]*dx+f[0]*(-dz),z:this.baseWorld.z+r[1]*dx+f[1]*(-dz)}}
  worldFromGate(g){const p=this.localPoint(g.x,g.z);return{x:p.x,z:p.z,h:wrap(this.baseWorld.h+g.heading)}}
  bridgeForPlane(p){const pf=vehicleForward(p.h),pr=vehicleRight(p.h),door={x:p.x+pf[0]*12.7-pr[0]*2.75,z:p.z+pf[1]*12.7-pr[1]*2.75};const bx=door.x-pr[0]*17-pf[0]*2.5,bz=door.z-pr[1]*17-pf[1]*2.5;return{id:p.id,x:bx,z:bz,h:headingFromForward(door.x-bx,door.z-bz),visible:true}}
  buildQueue(){
    this.queue=GATES.map(g=>{const w=this.worldFromGate(g);return{id:g.id,lx:g.x,lz:g.z,heading:g.heading,x:w.x,z:w.z,h:w.h}});
    this.state.extraPlanes=this.queue.map(g=>({id:g.id,x:g.x,z:g.z,h:g.h,visible:g.id!==BASE_GATE.id}));
    this.state.parkedBridges=this.queue.map(g=>{const b=this.bridgeForPlane(g);b.visible=g.id!==BASE_GATE.id;return b});
    this.state.demandCount=this.queue.length;
  }

  setupTurn(type,gate){
    const s=this.state;this.turnType=type;this.activeGate=gate.id?gate:BASE_GATE;this.job='service';this.attached=false;this.mainGear=null;this.taxiPath=[];this.taxiIndex=0;this.taxiT=0;
    if(gate.x!=null&&gate.id!==BASE_GATE.id){s.planeX=gate.x;s.planeZ=gate.z;s.planeH=gate.h;this.home={x:gate.x,z:gate.z}}
    this.setupBridgeGeometry(true);this.updateCargoPoint();s.cargoDoorOpen=false;s.bagTransferActive=false;s.bagTransferProgress=0;s.beltConnected=false;s.bagAtAircraft=false;
    if(type==='departure'){s.bagLoaded=false;this.serviceStage='dep-collect-bags'}else{s.bagLoaded=false;this.serviceStage='arr-position-cart'}
    this.ui.gate.textContent=this.activeGate.id;
  }

  setupBridgeGeometry(connected=false){const s=this.state,pf=vehicleForward(s.planeH),pr=vehicleRight(s.planeH);this.bridgeDoor={x:s.planeX+pf[0]*12.7-pr[0]*2.75,z:s.planeZ+pf[1]*12.7-pr[1]*2.75,y:4.25};s.bridgeBaseX=this.bridgeDoor.x-pr[0]*17-pf[0]*2.5;s.bridgeBaseZ=this.bridgeDoor.z-pr[1]*17-pf[1]*2.5;s.bridgeBaseH=headingFromForward(this.bridgeDoor.x-s.bridgeBaseX,this.bridgeDoor.z-s.bridgeBaseZ);s.bridgeH=s.bridgeBaseH;s.bridgeExtend=connected?Math.hypot(this.bridgeDoor.x-s.bridgeBaseX,this.bridgeDoor.z-s.bridgeBaseZ):7.5;s.bridgeHeight=connected?this.bridgeDoor.y:3.45;s.bridgeDocked=connected;s.bridgeControl=false;s.bridgeVisible=true;this.bridgeJob=connected?'connected':'bridge-approach';const pr2=vehicleRight(s.planeH);this.bridgeControlPoint={x:s.bridgeBaseX+pr2[0]*2.3,z:s.bridgeBaseZ+pr2[1]*2.3}}
  bridgeHead(){const s=this.state,f=vehicleForward(s.bridgeH);return{x:s.bridgeBaseX+f[0]*s.bridgeExtend,z:s.bridgeBaseZ+f[1]*s.bridgeExtend,y:s.bridgeHeight}}
  bridgeMetrics(){const s=this.state,h=this.bridgeHead(),door=this.bridgeDoor||h,dx=door.x-h.x,dz=door.z-h.z,targetH=headingFromForward(door.x-s.bridgeBaseX,door.z-s.bridgeBaseZ);return{dist:Math.hypot(dx,dz,door.y-h.y),angle:Math.abs(wrap(targetH-s.bridgeH)),height:Math.abs(door.y-h.y),targetH,targetExtend:clamp(Math.hypot(door.x-s.bridgeBaseX,door.z-s.bridgeBaseZ),6.5,24),targetHeight:door.y}}
  updateCargoPoint(){const s=this.state,pf=vehicleForward(s.planeH),pr=vehicleRight(s.planeH);s.cargoX=s.planeX+pf[0]*3-pr[0]*3.4;s.cargoZ=s.planeZ+pf[1]*3-pr[1]*3.4;s.cargoH=s.planeH}
  nose(){const s=this.state,f=vehicleForward(s.planeH);return[s.planeX+f[0]*18.5,s.planeZ+f[1]*18.5]}
  hitch(){const s=this.state,f=vehicleForward(s.tugH);return[s.tugX+f[0]*3.45,s.tugZ+f[1]*3.45]}
  nearCargo(x,z,r=13){return dist(x,z,this.state.cargoX,this.state.cargoZ)<r}
  nearCarousel(x,z,r=10){return dist(x,z,this.state.carouselX,this.state.carouselZ)<r}

  interact(){
    const s=this.state;if(!s.ready||s.bagTransferActive)return;
    if(s.mode==='bridge'){
      if(s.bridgeDocked){s.bridgeDocked=false;this.bridgeJob='bridge-control';this.atcSay('GROUND',`Jetbridge disconnected Gate ${this.activeGate.id}. Retract it clear before pushback.`);return}
      const m=this.bridgeMetrics();if(m.dist<3.4&&m.angle<16*DEG&&m.height<1.15&&this.turnType==='arrival'){this.bridgeJob='bridge-docking';this.bridgeDockT=0;return}
      return;
    }
    if(s.mode==='bag'){
      if(Math.abs(s.bagSpeed)>.5)return;
      if(this.nearCarousel(s.bagX,s.bagZ)){
        if(this.turnType==='departure'&&!s.bagLoaded&&this.serviceStage==='dep-collect-bags'){s.bagLoaded=true;this.serviceStage='dep-cart-to-aircraft';this.atcSay('GROUND',`Departure bags loaded. Take the baggage train to Gate ${this.activeGate.id}.`);return}
        if(this.turnType==='arrival'&&s.bagLoaded&&this.serviceStage==='arr-unload-carousel'){s.bagLoaded=false;this.serviceStage='arrival-complete';this.atcSay('GROUND',`Arrival bags delivered to carousel. Gate ${this.activeGate.id} baggage job complete.`);this.finishArrivalTurn();return}
      }
      if(this.nearCargo(s.bagX,s.bagZ,16)){
        if(this.turnType==='departure'&&s.bagLoaded&&['dep-cart-to-aircraft','dep-position-belt'].includes(this.serviceStage)){s.bagAtAircraft=true;this.serviceStage='dep-position-belt';s.mode='walk';this.exitVehicleBeside('bag');this.atcSay('GROUND',`Baggage train positioned. Bring the belt loader to the cargo hold.`);return}
        if(this.turnType==='arrival'&&!s.bagLoaded&&['arr-position-cart','arr-position-belt'].includes(this.serviceStage)){s.bagAtAircraft=true;this.serviceStage='arr-position-belt';s.mode='walk';this.exitVehicleBeside('bag');this.atcSay('GROUND',`Empty baggage train positioned. Bring the belt loader.`);return}
      }
      s.mode='walk';this.exitVehicleBeside('bag');return;
    }
    if(s.mode==='belt'){
      if(Math.abs(s.beltSpeed)>.5)return;
      if(s.beltConnected){s.beltConnected=false;s.mode='belt';this.atcSay('GROUND','Belt loader disconnected. Move it clear of the aircraft.');return}
      if(this.nearCargo(s.beltX,s.beltZ,13)){
        s.beltConnected=true;const pr=vehicleRight(s.planeH),pf=vehicleForward(s.planeH);s.beltX=s.cargoX-pr[0]*5-pf[0]*2;s.beltZ=s.cargoZ-pr[1]*5-pf[1]*2;s.beltH=wrap(s.planeH+Math.PI/2);s.beltSpeed=0;s.mode='walk';this.exitVehicleBeside('belt');
        if(this.turnType==='departure')this.serviceStage='dep-open-cargo';else this.serviceStage='arr-open-cargo';this.atcSay('GROUND',`Belt loader connected Gate ${this.activeGate.id}. Open the cargo compartment.`);return;
      }
      s.mode='walk';this.exitVehicleBeside('belt');return;
    }
    if(s.mode==='tug'){
      if(!this.attached){const n=this.nose();if(this.job==='approved'&&dist(s.tugX,s.tugZ,n[0],n[1])<7&&Math.abs(s.tugSpeed)<.7){this.attached=true;this.job='pushback';s.tugSpeed=0;s.tugSteer=0;s.tugH=wrap(s.planeH+Math.PI);const f=vehicleForward(s.tugH);s.tugX=n[0]-f[0]*3.45;s.tugZ=n[1]-f[1]*3.45;const pf=vehicleForward(s.planeH);this.mainGear={x:n[0]-pf[0]*32,z:n[1]-pf[1]*32};this.atcSay('GROUND',`Tug connected Gate ${this.activeGate.id}. Continue approved pushback.`);return}if(Math.abs(s.tugSpeed)<.4){s.mode='walk';this.exitVehicleBeside('tug');return}}
      if(this.attached&&this.job==='release'&&Math.abs(s.tugSpeed)<.5){this.attached=false;this.job='complete';this.mainGear=null;this.taxiT=0;this.makeTaxiPath();this.atcSay('GROUND',`Disconnect approved. Aircraft ${this.activeGate.id} is under its own power.`)}return;
    }
    // Walking interactions: cargo door first, then controls/vehicles.
    if(this.nearCargo(s.x,s.z,6.5)&&s.beltConnected&&s.bagAtAircraft){
      if(!s.cargoDoorOpen){s.cargoDoorOpen=true;this.serviceStage=this.turnType==='departure'?'dep-open-cargo':'arr-open-cargo';this.atcSay('GROUND','Cargo compartment open. Press E again to start baggage transfer.');return}
      if((this.turnType==='departure'&&this.serviceStage==='dep-open-cargo')||(this.turnType==='arrival'&&this.serviceStage==='arr-open-cargo')){this.startBagTransfer();return}
      if((this.turnType==='departure'&&this.serviceStage==='dep-close-cargo')||(this.turnType==='arrival'&&this.serviceStage==='arr-close-cargo')){s.cargoDoorOpen=false;this.serviceStage=this.turnType==='departure'?'dep-clear-equipment':'arr-to-carousel';this.atcSay('GROUND',this.turnType==='departure'?'Cargo hold closed. Clear both baggage vehicles from the service zone.':'Cargo hold closed. Disconnect and clear the belt loader, then take the loaded cart to the carousel.');return}
    }
    if(this.bridgeControlPoint&&dist(s.x,s.z,this.bridgeControlPoint.x,this.bridgeControlPoint.z)<6){s.mode='bridge';s.bridgeControl=true;return}
    if(dist(s.x,s.z,s.tugX,s.tugZ)<6){s.mode='tug';s.tugSpeed=0;return}
    if(dist(s.x,s.z,s.bagX,s.bagZ)<7){s.mode='bag';s.bagSpeed=0;return}
    if(dist(s.x,s.z,s.beltX,s.beltZ)<7){s.mode='belt';s.beltSpeed=0;return}
  }

  exitVehicleBeside(kind){const s=this.state;let x=s.x,z=s.z,h=s.h;if(kind==='tug'){x=s.tugX;z=s.tugZ;h=s.tugH}else if(kind==='bag'){x=s.bagX;z=s.bagZ;h=s.bagH}else if(kind==='belt'){x=s.beltX;z=s.beltZ;h=s.beltH}const r=vehicleRight(h);s.x=x+r[0]*4;s.z=z+r[1]*4;s.h=h}
  startBagTransfer(){const s=this.state;s.bagTransferActive=true;s.bagTransferProgress=0;s.bagTransferDir=this.turnType==='departure'?'load':'unload';this.transferT=0;this.serviceStage=this.turnType==='departure'?'dep-transfer':'arr-transfer';this.atcSay('GROUND',this.turnType==='departure'?'Baggage loading started.':'Baggage unloading started.')}

  update(dt){
    const s=this.state;if(!s.ready)return;this.updateCargoPoint();
    if(s.mode==='walk')this.walk(dt);else if(s.mode==='bridge')this.bridgeDrive(dt);else if(s.mode==='tug')this.driveTug(dt);else if(s.mode==='bag')this.driveServiceVehicle(dt,'bag');else if(s.mode==='belt')this.driveServiceVehicle(dt,'belt');
    if(this.bridgeJob==='bridge-docking')this.bridgeDock(dt);if(s.bagTransferActive)this.updateBagTransfer(dt);if(this.attached)this.tow(dt);if(this.job==='complete')this.taxi(dt);if(this.job==='between')this.nextJob(dt);
    this.checkServiceProgress();this.uiUpdate();
  }
  walk(dt){let s=this.state,side=(this.keys.KeyD?1:0)-(this.keys.KeyA?1:0),fore=(this.keys.KeyW?1:0)-(this.keys.KeyS?1:0),l=Math.hypot(side,fore);if(!l)return;side/=l;fore/=l;const cam=Number.isFinite(window.__sbGCCamYaw)?window.__sbGCCamYaw:0,cf=cameraForward(cam),cr=cameraRight(cam),dx=cf[0]*fore+cr[0]*side,dz=cf[1]*fore+cr[1]*side,sp=this.keys.ShiftLeft||this.keys.ShiftRight?8:4.5;s.x+=dx*sp*dt;s.z+=dz*sp*dt;s.h=headingFromForward(dx,dz)}
  bridgeDrive(dt){const s=this.state;if(s.bridgeDocked)return;const rot=(this.keys.KeyD?1:0)-(this.keys.KeyA?1:0),ext=(this.keys.KeyW?1:0)-(this.keys.KeyS?1:0),vert=(this.keys.KeyR?1:0)-(this.keys.KeyF?1:0);s.bridgeH=wrap(s.bridgeH+rot*.34*dt);s.bridgeExtend=clamp(s.bridgeExtend+ext*5.2*dt,6.2,24);s.bridgeHeight=clamp(s.bridgeHeight+vert*2.1*dt,2.8,6.0);if(this.keys.KeyQ){this.keys.KeyQ=false;s.mode='walk';s.bridgeControl=false}}
  bridgeDock(dt){const s=this.state,m=this.bridgeMetrics();this.bridgeDockT+=dt;const k=Math.min(1,dt*4.2);s.bridgeH=wrap(s.bridgeH+wrap(m.targetH-s.bridgeH)*k);s.bridgeExtend+=(m.targetExtend-s.bridgeExtend)*k;s.bridgeHeight+=(m.targetHeight-s.bridgeHeight)*k;if(this.bridgeDockT>1.2||this.bridgeMetrics().dist<.22){s.bridgeDocked=true;s.bridgeControl=false;s.mode='walk';this.bridgeJob='connected';this.atcSay('GROUND',`Jetbridge docked Gate ${this.activeGate.id}.`)}}
  driveTug(dt){this.driveVehicle(dt,'tug',this.attached?4.6:9,-(this.attached?3.7:6),4.7)}
  driveServiceVehicle(dt,kind){this.driveVehicle(dt,kind,8.2,-5.0,kind==='bag'?4.9:4.4)}
  driveVehicle(dt,kind,forwardMax,reverseMax,wheelbase){const s=this.state,sp=kind==='tug'?'tugSpeed':kind+'Speed',st=kind==='tug'?'tugSteer':kind+'Steer',hh=kind==='tug'?'tugH':kind+'H',xx=kind==='tug'?'tugX':kind+'X',zz=kind==='tug'?'tugZ':kind+'Z';let speed=s[sp],steerVal=s[st],gas=this.keys.KeyW?1:0,brake=this.keys.KeyS?1:0,hard=this.keys.Space?1:0,steer=(this.keys.KeyD?1:0)-(this.keys.KeyA?1:0);if(hard){const dec=17*dt;if(Math.abs(speed)<=dec)speed=0;else speed-=Math.sign(speed)*dec}else if(gas){if(speed<-.12)speed=Math.min(0,speed+11*dt);else speed=Math.min(forwardMax,speed+5.2*dt)}else if(brake){if(speed>.12)speed=Math.max(0,speed-11*dt);else speed=Math.max(reverseMax,speed-4*dt)}else{speed*=Math.max(0,1-dt*2.2);if(Math.abs(speed)<.025)speed=0}const target=steer*.55;steerVal+=(target-steerVal)*Math.min(1,dt*4);if(!steer)steerVal*=Math.max(0,1-dt*4.2);s[hh]=wrap(s[hh]+(speed/wheelbase)*Math.tan(steerVal)*dt);const f=vehicleForward(s[hh]);s[xx]+=f[0]*speed*dt;s[zz]+=f[1]*speed*dt;s[sp]=speed;s[st]=steerVal}
  updateBagTransfer(dt){const s=this.state;this.transferT+=dt;s.bagTransferProgress=clamp(this.transferT/8,0,1);if(s.bagTransferProgress>=1){s.bagTransferActive=false;if(this.turnType==='departure'){s.bagLoaded=false;this.serviceStage='dep-close-cargo';this.atcSay('GROUND','All departure bags loaded. Close the cargo compartment.')}else{s.bagLoaded=true;this.serviceStage='arr-close-cargo';this.atcSay('GROUND','Arrival bags are on the cart. Close the cargo compartment.') }}}
  checkServiceProgress(){const s=this.state;if(this.turnType==='departure'&&this.serviceStage==='dep-clear-equipment'){const clearBag=!this.nearCargo(s.bagX,s.bagZ,24),clearBelt=!this.nearCargo(s.beltX,s.beltZ,24)&&!s.beltConnected;if(clearBag&&clearBelt){this.serviceStage='dep-disconnect-bridge';this.atcSay('GROUND',`Equipment clear Gate ${this.activeGate.id}. Disconnect and retract the jetbridge.`)}}if(this.turnType==='departure'&&this.serviceStage==='dep-disconnect-bridge'&&!s.bridgeDocked&&s.bridgeExtend<10){this.serviceStage='ready-pushback';this.atcSay('GROUND',`Gate ${this.activeGate.id} turnaround complete. Pushback may be requested.`)}if(this.turnType==='arrival'&&this.serviceStage==='arr-to-carousel'&&!s.beltConnected&&!this.nearCargo(s.beltX,s.beltZ,20)){this.serviceStage='arr-unload-carousel'}}

  approvePushback(){const s=this.state;if(this.turnType!=='departure')return this.atcSay('GROUND','Negative. This is an arrival baggage turn; no pushback is assigned.');if(this.serviceStage!=='ready-pushback')return this.atcSay('GROUND',`Unable pushback Gate ${this.activeGate.id}. ${this.serviceInstruction()}`);if(s.cargoDoorOpen||s.beltConnected||s.bridgeDocked||s.bridgeExtend>=10)return this.atcSay('GROUND','Negative pushback. Ground equipment or doors are not clear.');if(this.job==='service'){this.job='approved';this.atcSay('GROUND',`Pushback approved Gate ${this.activeGate.id}. Connect the tug at the nose gear.`)}else this.repeatAtc()}
  tow(dt){const s=this.state,h=this.hitch(),wheelbase=32,noseOffset=18.5;if(!this.mainGear){const pf=vehicleForward(s.planeH);this.mainGear={x:h[0]-pf[0]*wheelbase,z:h[1]-pf[1]*wheelbase}}const vx=h[0]-this.mainGear.x,vz=h[1]-this.mainGear.z,vl=Math.hypot(vx,vz);if(vl<.001)return;const targetH=headingFromForward(vx/vl,vz/vl),dh=wrap(targetH-s.planeH),maxStep=(.35+Math.abs(s.tugSpeed)*.12)*dt;s.planeH=wrap(s.planeH+clamp(dh,-maxStep,maxStep));const pf=vehicleForward(s.planeH);this.mainGear.x=h[0]-pf[0]*wheelbase;this.mainGear.z=h[1]-pf[1]*wheelbase;s.planeX=h[0]-pf[0]*noseOffset;s.planeZ=h[1]-pf[1]*noseOffset;s.towAngle=wrap(s.tugH-(s.planeH+Math.PI));if(this.job==='pushback'&&dist(s.planeX,s.planeZ,this.home.x,this.home.z)>48){this.job='release';this.atcSay('GROUND',`Release point reached Gate ${this.activeGate.id}. Stop and disconnect.`)}}
  makeTaxiPath(){const g=this.activeGate,lx=g.lx??g.x,lz=g.lz??g.z;const route=[{x:lx,z:lz+150},{x:600,z:lz+150},{x:460,z:lz+150},{x:460,z:1800},{x:110,z:1800}].map(p=>this.localPoint(p.x,p.z));this.taxiPath=[{x:this.state.planeX,z:this.state.planeZ},...route];this.taxiIndex=1}
  taxi(dt){const s=this.state;this.taxiT+=dt;s.towAngle=0;if(this.taxiT<2)return;if(this.taxiIndex>=this.taxiPath.length)return this.finishTaxi();const w=this.taxiPath[this.taxiIndex],dx=w.x-s.planeX,dz=w.z-s.planeZ,d=Math.hypot(dx,dz);if(d<8){this.taxiIndex++;return}const target=headingFromForward(dx/d,dz/d),dh=wrap(target-s.planeH);s.planeH=wrap(s.planeH+clamp(dh,-.55*dt,.55*dt));const f=vehicleForward(s.planeH),spd=Math.abs(dh)>.45?5.5:10.5;s.planeX+=f[0]*spd*dt;s.planeZ+=f[1]*spd*dt}
  finishTaxi(){this.served.add(this.activeGate.id);this.job='between';this.nextJobT=0;this.state.planeX+=1e6;this.state.planeZ+=1e6;this.atcSay('GROUND','Departure clear of apron. Next high-priority turnaround inbound.')}
  finishArrivalTurn(){this.job='between';this.nextJobT=0}
  nextJob(dt){this.nextJobT+=dt;if(this.nextJobT<2.5)return;if(this.turnType==='arrival'){const oldEp=this.state.extraPlanes.find(p=>p.id===this.activeGate.id),oldPb=this.state.parkedBridges.find(p=>p.id===this.activeGate.id);if(oldEp){oldEp.visible=true;oldEp.x=this.state.planeX;oldEp.z=this.state.planeZ;oldEp.h=this.state.planeH}if(oldPb)oldPb.visible=true}let candidates=this.queue.filter(g=>g.id!==this.activeGate.id);let next=candidates[(this.turnCounter*7+3)%candidates.length];this.turnCounter++;const ep=this.state.extraPlanes.find(p=>p.id===next.id),pb=this.state.parkedBridges.find(p=>p.id===next.id);if(ep)ep.visible=false;if(pb)pb.visible=false;this.activeGate=next;this.state.planeX=next.x;this.state.planeZ=next.z;this.state.planeH=next.h;this.home={x:next.x,z:next.z};this.turnType=this.turnCounter%2===0?'departure':'arrival';this.setupTurn(this.turnType,next);this.state.mode='walk';const r=vehicleRight(next.h),f=vehicleForward(next.h);this.state.x=next.x+r[0]*34+f[0]*18;this.state.z=next.z+r[1]*34+f[1]*18;this.job='service';this.nextJobT=0;this.atcSay('GROUND',`${this.turnType==='departure'?'Departure':'Arrival'} priority: Gate ${next.id}. ${this.serviceInstruction()}`)}

  uiUpdate(){const s=this.state,deg=Math.abs(s.towAngle/DEG),bm=this.bridgeMetrics();let p='';this.ui.gate.textContent=this.activeGate.id||'—';this.ui.tow.textContent=deg.toFixed(0)+'°';this.ui.demand.textContent=String(s.demandCount);if(this.ui.locator){const px=s.mode==='bag'?s.bagX:s.mode==='belt'?s.beltX:s.x,pz=s.mode==='bag'?s.bagZ:s.mode==='belt'?s.beltZ:s.z,dh=Math.round(dist(px,pz,s.bagBuildingX,s.bagBuildingZ)),db=Math.round(dist(px,pz,s.bagX,s.bagZ)),dl=Math.round(dist(px,pz,s.beltX,s.beltZ));this.ui.locator.textContent=`BAGGAGE HALL ${dh}m  ·  TRACTOR ${db}m  ·  BELT LOADER ${dl}m`; }
    if(s.bagTransferActive){this.ui.title.textContent=this.turnType==='departure'?'Loading baggage':'Unloading baggage';this.ui.text.textContent=`Transfer ${Math.round(s.bagTransferProgress*100)}% complete.`;this.ui.approval.textContent='BAGGAGE TRANSFER'}
    else if(s.mode==='bridge'){this.ui.title.textContent=s.bridgeDocked?'Jetbridge connected':'Jetbridge controls';this.ui.text.textContent=s.bridgeDocked?'Press E to disconnect, then use S to retract the bridge.':'W/S extend/retract · A/D rotate · R/F raise/lower · Q exit.';this.ui.approval.textContent=s.bridgeDocked?'CONNECTED':'JETBRIDGE';if(s.bridgeDocked)p='E · DISCONNECT JETBRIDGE';else p='Q · EXIT CONTROLS'}
    else if(s.mode==='bag'){this.ui.title.textContent='Baggage train';this.ui.text.textContent=s.bagLoaded?'Loaded carts · drive to the aircraft or carousel as instructed.':'Empty carts · follow Ground instructions.';this.ui.approval.textContent=s.bagLoaded?'BAGS ON CART':'CART EMPTY'}
    else if(s.mode==='belt'){this.ui.title.textContent='Belt loader';this.ui.text.textContent=s.beltConnected?'Connected to cargo hold. Press E to disconnect when service is complete.':'Drive to the cargo hold and press E when aligned.';this.ui.approval.textContent=s.beltConnected?'BELT CONNECTED':'BELT LOADER'}
    else if(this.job==='approved'){this.ui.title.textContent=`Pushback · Gate ${this.activeGate.id}`;this.ui.text.textContent='Drive the tug to the nose gear and press E when stopped close to it.';this.ui.approval.textContent='PUSHBACK APPROVED'}
    else if(this.job==='pushback'){this.ui.title.textContent='Pushback in progress';this.ui.text.textContent='Front of tug pushes the aircraft. Tow angle remains unrestricted.';this.ui.approval.textContent='TUG CONNECTED'}
    else if(this.job==='release'){this.ui.title.textContent='Release point reached';this.ui.text.textContent='Stop and press E to disconnect.';this.ui.approval.textContent='READY TO RELEASE'}
    else if(this.job==='complete'){this.ui.title.textContent='Aircraft taxiing';this.ui.text.textContent='NPC control is following the apron lane and taxiway.';this.ui.approval.textContent='JOB COMPLETE'}
    else if(this.job==='between'){this.ui.title.textContent='High-demand shift';this.ui.text.textContent='Ground is assigning the next turnaround.';this.ui.approval.textContent='NEXT TASK'}
    else{this.ui.title.textContent=`${this.turnType==='departure'?'Departure':'Arrival'} · Gate ${this.activeGate.id}`;this.ui.text.textContent=this.serviceInstruction();this.ui.approval.textContent=this.turnType==='departure'?'TURNAROUND':'ARRIVAL SERVICE'}

    if(s.mode==='walk'){
      if(this.nearCargo(s.x,s.z,6.5)&&s.beltConnected&&s.bagAtAircraft){if(!s.cargoDoorOpen)p='E · OPEN CARGO HOLD';else if(['dep-open-cargo','arr-open-cargo'].includes(this.serviceStage))p='E · START BAGGAGE TRANSFER';else if(['dep-close-cargo','arr-close-cargo'].includes(this.serviceStage))p='E · CLOSE CARGO HOLD'}
      if(!p&&this.bridgeControlPoint&&dist(s.x,s.z,this.bridgeControlPoint.x,this.bridgeControlPoint.z)<6)p='E · OPERATE JETBRIDGE';
      if(!p&&dist(s.x,s.z,s.tugX,s.tugZ)<6)p='E · ENTER PUSHBACK TUG';
      if(!p&&dist(s.x,s.z,s.bagX,s.bagZ)<7)p='E · ENTER BAGGAGE TRACTOR';
      if(!p&&dist(s.x,s.z,s.beltX,s.beltZ)<7)p='E · ENTER BELT LOADER';
    }
    if(s.mode==='bag'){if(this.nearCarousel(s.bagX,s.bagZ)&&((this.turnType==='departure'&&!s.bagLoaded)||(this.turnType==='arrival'&&s.bagLoaded)))p='E · '+(this.turnType==='departure'?'LOAD BAGS FROM CAROUSEL':'UNLOAD BAGS TO CAROUSEL');else if(this.nearCargo(s.bagX,s.bagZ,16))p='E · PARK BAGGAGE CARTS';else p='E · EXIT BAGGAGE TRACTOR'}
    if(s.mode==='belt'){if(s.beltConnected)p='E · DISCONNECT BELT LOADER';else if(this.nearCargo(s.beltX,s.beltZ,13))p='E · CONNECT BELT LOADER';else p='E · EXIT BELT LOADER'}
    if(s.mode==='tug'&&!this.attached&&this.job==='approved'&&dist(s.tugX,s.tugZ,...this.nose())<7)p='E · CONNECT FRONT TUG TO NOSE GEAR';if(this.attached&&this.job==='release'&&Math.abs(s.tugSpeed)<.5)p='E · DISCONNECT';
    this.ui.prompt.textContent=p;this.ui.prompt.classList.toggle('show',!!p);
  }

  frame(t){if(!this.running)return;const dt=Math.min(.033,(t-this.last)/1000||.016);this.last=t;this.update(dt);requestAnimationFrame(n=>this.frame(n))}
}

export function startGroundCrew(opts={}){document.body.classList.add('gc-same-world');return new GroundCrew(opts)}
window.SkyboundGroundCrew={start:startGroundCrew};
