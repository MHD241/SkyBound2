import{MeshBuilder,ellipseFan}from'./geometry.js';

const seeded=(seed)=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const COLORS={sea:[.05,.25,.36],land:[.22,.42,.34],land2:[.26,.46,.36],road:[.12,.18,.21],runway:[.13,.16,.18],taxi:[.17,.21,.23],mark:[.83,.87,.80],terminal:[.19,.28,.34],tower:[.22,.32,.38]};

const airportDefs={
  NPT:{code:'NPT',name:'Northpoint International',x:0,y:2,z:0,heading:0,runways:[{name:'18L/36R',x:-260,z:0,len:4100,w:64},{name:'18R/36L',x:260,z:0,len:4100,w:64}],gates:[],freq:{ground:121.900,tower:118.300,departure:124.700,approach:120.600}},
  CBA:{code:'CBA',name:'Coral Bay International',x:33000,y:2,z:-30000,heading:0,runways:[{name:'09/27',x:33000,z:-30000,len:3800,w:62}],gates:[],freq:{ground:121.750,tower:118.650,departure:125.100,approach:119.800}},
  SSI:{code:'SSI',name:'Supersonic Island International',x:145000,y:2,z:85000,heading:0,restricted:true,runways:[{name:'17C/35C',x:145000,z:85000,len:6200,w:86},{name:'17L/35R',x:144350,z:85000,len:5800,w:72},{name:'17R/35L',x:145650,z:85000,len:5800,w:72}],gates:[],freq:{ground:122.225,tower:119.950,departure:126.400,approach:127.150}}
};

function addRoad(b,x,z,w,d){b.flatRect(x,2.22,z,w,d,COLORS.road)}
function addRunway(b,r){b.flatRect(r.x,2.42,r.z,r.w,r.len,COLORS.runway);for(let k=-r.len/2+160;k<r.len/2-160;k+=180)b.flatRect(r.x,2.48,r.z+k,3,64,COLORS.mark);b.flatRect(r.x-r.w*.31,2.48,r.z-r.len/2+110,4,120,COLORS.mark);b.flatRect(r.x+r.w*.31,2.48,r.z-r.len/2+110,4,120,COLORS.mark)}
function makeGates(a,count=18,rows=2){
  const g=[];const cols=Math.ceil(count/rows);for(let r=0;r<rows;r++)for(let c=0;c<cols && g.length<count;c++){
    const side=r===0?-1:1;g.push({id:String.fromCharCode(65+r)+String(c+1).padStart(2,'0'),x:a.x+side*(720+(c%2)*28),y:3,z:a.z-850+c*115,heading:side<0?Math.PI/2:-Math.PI/2});
  }return g;
}

for(const a of Object.values(airportDefs))a.gates=makeGates(a,a.code==='SSI'?30:(a.code==='NPT'?22:16),a.code==='SSI'?3:2);

function addAirport(b,a){
  for(const r of a.runways)addRunway(b,r);
  // parallel taxi spine(s)
  for(const r of a.runways){addRoad(b,r.x+120,r.z,38,r.len*.92);addRoad(b,r.x-120,r.z,38,r.len*.92)}
  // terminal, concourses, tower
  const terminalW=a.code==='SSI'?1650:980;const terminalD=a.code==='SSI'?240:190;
  b.box(a.x,2.35,a.z-1050,terminalW,a.code==='SSI'?42:32,terminalD,COLORS.terminal);
  if(a.code==='SSI'){b.box(a.x-850,2.35,a.z-1060,520,28,170,COLORS.terminal);b.box(a.x+850,2.35,a.z-1060,520,28,170,COLORS.terminal);}
  b.box(a.x+terminalW*.32,2.35,a.z-1280,46,128,46,COLORS.tower);b.box(a.x+terminalW*.32,130,a.z-1280,72,18,72,[.08,.18,.22]);
  for(const g of a.gates){addRoad(b,g.x,a.z-950,22,220);b.flatRect(g.x,2.5,g.z,46,64,[.20,.25,.27])}
}

function cityFill(b,cx,cz,rx,rz,seed,airport,superTall=false){
  const rnd=seeded(seed);const spacing=superTall?320:280;let count=0;
  for(let x=cx-rx*.92;x<cx+rx*.92;x+=spacing){for(let z=cz-rz*.92;z<cz+rz*.92;z+=spacing){
    const nx=(x-cx)/rx,nz=(z-cz)/rz;if(nx*nx+nz*nz>0.9)continue;
    // airport safety zones
    if(Math.abs(x-airport.x)<2200 && Math.abs(z-airport.z)<3600)continue;
    if(rnd()<.10)continue;
    const density=1-Math.min(1,Math.hypot(nx,nz));const jitterX=(rnd()-.5)*spacing*.58,jitterZ=(rnd()-.5)*spacing*.58;
    const tall=(rnd()<(.32+density*.4));const h=tall?(superTall?80+rnd()*310:45+rnd()*210):(16+rnd()*55);
    const w=70+rnd()*115,d=70+rnd()*115;const tone=.18+rnd()*.12;
    b.box(x+jitterX,2.3,z+jitterZ,w,h,d,[tone,tone+.045,tone+.065]);
    if(h>95 && rnd()<.65)b.box(x+jitterX,2.3+h,z+jitterZ,w*.35,4,d*.35,[.72,.68,.40]);
    count++;
  }}
  return count;
}

function roadGrid(b,cx,cz,rx,rz,step=1500){
  for(let x=cx-rx*.8;x<=cx+rx*.8;x+=step)addRoad(b,x,cz,34,rz*1.65);
  for(let z=cz-rz*.8;z<=cz+rz*.8;z+=step)addRoad(b,cx,z,rx*1.65,34);
}

export class World{
  constructor(){this.airports=(typeof structuredClone==='function')?structuredClone(airportDefs):JSON.parse(JSON.stringify(airportDefs));this.traffic=[];this.cars=[];this._build()}
  _build(){
    const b=new MeshBuilder();
    // Ocean first, slightly below all land.
    b.flatRect(70000,-2,25000,420000,300000,COLORS.sea);
    // smaller civil countries and distant supersonic island.
    b.merge(ellipseFan(0,0,19000,16500,1.9,COLORS.land,96));
    b.merge(ellipseFan(33000,-30000,17500,15500,1.9,COLORS.land2,96));
    b.merge(ellipseFan(145000,85000,22000,18500,1.9,[.27,.39,.31],96));
    roadGrid(b,0,0,19000,16500,1450);roadGrid(b,33000,-30000,17500,15500,1500);roadGrid(b,145000,85000,22000,18500,1200);
    for(const a of Object.values(this.airports))addAirport(b,a);
    this.buildingCount=0;this.buildingCount+=cityFill(b,0,0,19000,16500,1452,this.airports.NPT,false);this.buildingCount+=cityFill(b,33000,-30000,17500,15500,8812,this.airports.CBA,false);this.buildingCount+=cityFill(b,145000,85000,22000,18500,4027,this.airports.SSI,true);
    this.mesh=b.data();
    this._initCars();this._initTraffic();
  }
  _initCars(){
    const defs=[[0,0,18000,14000],[33000,-30000,16000,13000],[145000,85000,20000,15500]];let id=0;
    for(const [cx,cz,rx,rz] of defs){for(let i=0;i<120;i++){const lane=i%2===0?'x':'z';this.cars.push({id:id++,cx,cz,rx,rz,lane,t:(i/120),speed:18+((i*17)%24),x:cx,z:cz})}}
  }
  _initTraffic(){
    this.traffic=[
      {type:'JX-90',home:'NPT',phase:'taxi',t:0,x:-900,y:3,z:-1250,heading:0,pitch:0,bank:0,speed:22},
      {type:'JX-200',home:'CBA',phase:'final',t:.3,x:33000,y:320,z:-9800,heading:Math.PI,pitch:-.04,bank:0,speed:72},
      {type:'JX-90',home:'NPT',phase:'air',t:.55,x:12000,y:900,z:9000,heading:2.6,pitch:0,bank:.1,speed:110}
    ];
  }
  update(dt){
    for(const c of this.cars){c.t=(c.t+dt*c.speed/(c.lane==='x'?c.rx*2:c.rz*2))%1;if(c.lane==='x'){c.x=c.cx-c.rx+c.t*c.rx*2;c.z=c.cz+(((c.id*73)%9)-4)*1500}else{c.z=c.cz-c.rz+c.t*c.rz*2;c.x=c.cx+(((c.id*59)%9)-4)*1500}}
    for(const p of this.traffic){p.t+=dt;const a=this.airports[p.home];if(p.phase==='taxi'){p.x=a.x-900+Math.min(900,p.t*45);p.z=a.z-1250;p.heading=Math.PI/2;if(p.t>21){p.phase='takeoff';p.t=0}}
      else if(p.phase==='takeoff'){p.heading=0;p.z+=dt*(55+Math.min(75,p.t*5));p.y=3+Math.max(0,p.t-4)*28;p.pitch=p.t>4?.12:0;if(p.t>14){p.phase='air';p.t=0}}
      else if(p.phase==='final'){p.z+=dt*95;p.y=Math.max(3,p.y-dt*13);p.heading=Math.PI;if(p.y<=3.2){p.phase='taxi';p.t=0;p.z=a.z+1700}}
      else{const r=11000,ang=p.t*.035+(p.home==='NPT'?0:2);p.x=a.x+Math.cos(ang)*r;p.z=a.z+Math.sin(ang)*r;p.y=900+Math.sin(ang*2)*100;p.heading=-ang+Math.PI/2;p.bank=.12;}
    }
  }
  nearestAirport(x,z){let best=null,bd=Infinity;for(const a of Object.values(this.airports)){const d=Math.hypot(x-a.x,z-a.z);if(d<bd){bd=d;best=a}}return{airport:best,distance:bd}}
  assignArrivalGate(code){const a=this.airports[code];return a.gates[Math.floor(Math.random()*a.gates.length)]}
}
