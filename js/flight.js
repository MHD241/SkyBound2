import{DEG,clamp,lerp,wrap360,shortestAngle}from'./math.js';

export const AIRCRAFT={
  'JX-90':{name:'JX-90 Regional',stall:54,taxi:19,max:155,accel:20,climb:18,turn:1.0,scale:1.0},
  'JX-200':{name:'JX-200',stall:62,taxi:18,max:175,accel:17,climb:16,turn:.88,scale:1.08},
  'CONCORDE':{name:'Concorde',stall:82,taxi:22,max:620,accel:36,climb:35,turn:.62,scale:1.12,supersonic:true}
};

export class FlightModel{
  constructor(world){this.world=world;this.keys=new Set();this.reset();this._bind()}
  reset(){this.type='JX-200';this.home='NPT';this.gate='A01';this.x=0;this.y=3;this.z=0;this.heading=0;this.pitch=0;this.bank=0;this.speed=0;this.throttle=0;this.vs=0;this.phase='PARKED';this.pushback=false;this.ap={on:false,autoland:false,hdg:0,alt:5000,spd:220};this.interceptor=false;this.interceptorTimer=0;this.arrivalGate=null}
  spawn(type,airportCode,gateId){this.reset();this.type=type;this.home=airportCode;this.gate=gateId;const a=this.world.airports[airportCode];const g=a.gates.find(x=>x.id===gateId)||a.gates[0];this.x=g.x;this.y=3;this.z=g.z;this.heading=g.heading;this.phase='PARKED';this.ap.hdg=wrap360(g.heading/DEG);this.arrivalGate=null}
  _bind(){
    addEventListener('keydown',e=>{const t=e.target;if(t instanceof HTMLElement && (t.matches('input,textarea,select,button')||t.isContentEditable))return;this.keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='p')this.pushback=!this.pushback});
    addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  }
  update(dt){
    const a=AIRCRAFT[this.type],ground=this.y<=3.15;let rollInput=0,pitchInput=0,rudder=0;
    if(this.keys.has('arrowleft'))rollInput=-1;if(this.keys.has('arrowright'))rollInput=1;if(this.keys.has('arrowup'))pitchInput=1;if(this.keys.has('arrowdown'))pitchInput=-1;if(this.keys.has('a'))rudder=-1;if(this.keys.has('d'))rudder=1;
    if(this.keys.has('w'))this.throttle=clamp(this.throttle+dt*.38,0,1);if(this.keys.has('s'))this.throttle=clamp(this.throttle-dt*.42,0,1);
    if(this.ap.on&&!ground){
      const cur=wrap360(this.heading/DEG),err=shortestAngle(cur,this.ap.hdg);rollInput=clamp(err/28,-1,1);const altFt=this.y*3.28084,altErr=this.ap.alt-altFt;pitchInput=clamp(altErr/2400,-.55,.55);const targetMs=this.ap.spd*.514444;this.throttle=clamp(this.throttle+(targetMs-this.speed)*dt*.006,0,1);
    }
    if(this.ap.autoland)this._autoland(dt);
    const targetBank=rollInput*(ground?6:34)*DEG*a.turn;this.bank=lerp(this.bank,targetBank,clamp(dt*(ground?6:3.2),0,1));const targetPitch=pitchInput*11*DEG;this.pitch=lerp(this.pitch,targetPitch,clamp(dt*2.4,0,1));
    if(this.pushback&&ground&&this.speed<2&&this.phase==='PARKED'){
      const pb=9;this.x-=Math.sin(this.heading)*pb*dt;this.z+=Math.cos(this.heading)*pb*dt;this.phase='PUSHBACK';return;
    }else if(this.phase==='PUSHBACK'&&!this.pushback)this.phase='TAXI';
    const drag=.012*this.speed*this.speed,thrust=this.throttle*a.accel*(ground?1.0:1.12);this.speed=clamp(this.speed+(thrust-drag*.012)*dt,0,a.max);
    if(ground){
      const taxiSteer=clamp((rudder+rollInput*.45),-1,1);this.heading+=taxiSteer*dt*(.22+this.speed*.008);this.x+=Math.sin(this.heading)*this.speed*dt;this.z-=Math.cos(this.heading)*this.speed*dt;
      const lift=this.speed>a.stall?((this.speed-a.stall)/(a.stall*.35)):0;if(this.pitch>2*DEG&&lift>.25){this.y+=dt*(2+lift*a.climb);this.vs=(2+lift*a.climb)*196.85;this.phase='AIRBORNE'}else{this.y=3;this.vs=0;if(this.speed>3&&this.phase!=='PUSHBACK')this.phase='TAXI'}
    }else{
      const turnRate=9.81*Math.tan(this.bank)/Math.max(this.speed,35);this.heading+=turnRate*dt+rudder*dt*.035;const climb=Math.sin(this.pitch)*this.speed*.78;this.y+=climb*dt;this.vs=climb*196.85;this.x+=Math.sin(this.heading)*Math.cos(this.pitch)*this.speed*dt;this.z-=Math.cos(this.heading)*Math.cos(this.pitch)*this.speed*dt;this.phase='AIRBORNE';
      // forgiving landing envelope: wide and gentle instead of punishing.
      const near=this.world.nearestAirport(this.x,this.z);if(this.y<20 && near.distance<3400 && this.pitch>-10*DEG && Math.abs(this.bank)<28*DEG){if(this.y<=4.2 || climb<0){this.y=3;this.pitch=lerp(this.pitch,0,.35);this.bank=lerp(this.bank,0,.45);this.speed=Math.max(22,this.speed*.985);this.phase='LANDED';this.vs=0;if(!this.arrivalGate)this.arrivalGate=this.world.assignArrivalGate(near.airport.code)}}
      if(this.y<3){this.y=3;this.speed*=.65;this.phase='LANDED'}
    }
    this._restricted(dt);
  }
  _autoland(dt){
    const near=this.world.nearestAirport(this.x,this.z),a=near.airport,r=a.runways[0];const approachZ=r.z+6200;const dx=r.x-this.x,dz=approachZ-this.z;let desired=Math.atan2(dx,-dz)/DEG;desired=wrap360(desired);this.ap.hdg=desired;this.ap.alt=Math.max(90,Math.min(2200,near.distance*.12))*3.28084;this.ap.spd=this.type==='CONCORDE'?180:145;this.ap.on=true;
    if(near.distance<4500){this.ap.hdg=wrap360(Math.atan2(r.x-this.x,-(r.z-this.z))/DEG);this.ap.alt=Math.max(30,near.distance*.045)*3.28084;this.ap.spd=this.type==='CONCORDE'?165:132}
    if(this.y<=3.2&&near.distance<3000){this.ap.autoland=false;this.ap.on=false;this.throttle=.08}
  }
  _restricted(dt){
    const s=this.world.airports.SSI,d=Math.hypot(this.x-s.x,this.z-s.z);const normal=this.type!=='CONCORDE';this.interceptor=normal&&d<26000;if(this.interceptor)this.interceptorTimer+=dt;else this.interceptorTimer=0;
  }
  get knots(){return this.speed*1.94384}get altFt(){return this.y*3.28084}get hdg(){return wrap360(this.heading/DEG)}
}
