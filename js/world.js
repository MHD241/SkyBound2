import {M4} from './math.js';import {box,grid,cylinder} from './geometry.js';
const C={terrain:[.22,.38,.19],grass:[.19,.34,.17],asphalt:[.105,.12,.13],concrete:[.42,.45,.46],terminal:[.36,.44,.48],glass:[.13,.32,.42],white:[.88,.89,.86],red:[.73,.12,.08],dark:[.10,.13,.15],light:[.95,.75,.30]};
function xf(p,r=[0,0,0],s=[1,1,1]){return()=>M4.compose(p,r,s)}
export function buildWorld(e){
 const terrain=e.makeMesh(...grid(23000,70,(x,z)=>{const d=Math.hypot(x,z);let h=Math.max(0,900*(1-d/10500));h+=120*Math.sin(x*.0012)*Math.cos(z*.001);const airport=Math.hypot(x-0,z-900);if(airport<3400)h*=Math.max(0,(airport-2200)/1200);return h-2}));e.add(terrain,C.terrain,xf([0,0,0]));
 const ocean=e.makeMesh(...grid(90000,50,()=>-18));e.setOcean(ocean);
 const cube=e.makeMesh(...box()),cyl=e.makeMesh(...cylinder(1,1,24));
 // runway and taxiway
 e.add(cube,C.asphalt,xf([0,1.0,900],[0,0,0],[72,1.4,3300]));
 for(let z=-2100;z<=3900;z+=120)e.add(cube,C.white,xf([0,2.0,z+900],[0,0,0],[2.3,.08,35]));
 e.add(cube,C.asphalt,xf([380,1.0,900],[0,0,0],[34,1.2,3200]));
 e.add(cube,C.asphalt,xf([780,1.0,300],[0,0,0],[700,1.2,36]));
 e.add(cube,C.concrete,xf([1100,.7,180],[0,0,0],[1300,1,520]));
 // terminal complex
 e.add(cube,C.terminal,xf([1320,65,180],[0,0,0],[520,130,150]));
 e.add(cube,C.glass,xf([1320,90,101],[0,0,0],[480,58,4]));
 e.add(cube,C.terminal,xf([1040,42,180],[0,0,0],[55,84,440]));
 e.add(cube,C.terminal,xf([1600,42,180],[0,0,0],[55,84,440]));
 for(const x of [1030,1160,1290,1420,1550,1680]){e.add(cube,C.dark,xf([x,8,-80],[0,0,0],[18,14,130]));e.add(cube,C.concrete,xf([x,4,-145],[0,0,0],[50,5,34]))}
 // tower
 e.add(cyl,C.concrete,xf([1980,115,50],[0,0,0],[35,230,35]));e.add(cyl,C.glass,xf([1980,245,50],[0,0,0],[75,65,75]));e.add(cyl,C.dark,xf([1980,281,50],[0,0,0],[55,12,55]));
 // hangars
 for(let i=0;i<4;i++)e.add(cube,C.terminal,xf([700+i*210,42,720],[0,0,0],[170,84,125]));
 // approach lights
 for(const end of [-1,1])for(let k=0;k<12;k++){const z=900+end*(3380+k*90);e.add(cyl,C.white,xf([0,3,z],[0,0,Math.PI/2],[1.2,6,1.2]));}
 // distant hills / skyline hints
 for(let i=0;i<80;i++){const a=i*.73,d=4300+(i%9)*480,x=Math.sin(a)*d,z=Math.cos(a)*d+900,h=40+(i*37%180),w=35+(i*19%80);e.add(cube,[.24+.05*(i%3),.29,.31],xf([x,h/2,z],[0,a*.17,0],[w,h,w*.8]));}
 return{runwayCenter:[0,0,900]}
}
