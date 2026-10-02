import {M4} from './math.js';import {sphere,cylinder,wedge,box} from './geometry.js';
function mult(base,local){return M4.multiply(base,local)}
export function buildAircraft(e,state){const body=e.makeMesh(...cylinder(2.65,31,36)),nose=e.makeMesh(...sphere(2.7,3.6,2.7,12,28)),tail=e.makeMesh(...sphere(2.35,2.8,2.35,10,24)),wing=e.makeMesh(...wedge([[-1,0],[2,0],[18,5],[13,7],[-2,3]],.5)),stab=e.makeMesh(...wedge([[-1,0],[1,0],[8,3],[6,4],[-2,2]],.3)),fin=e.makeMesh(...wedge([[0,0],[0,1],[0,8],[0,10],[0,3]],.6)),eng=e.makeMesh(...cylinder(1.45,5.2,24)),cube=e.makeMesh(...box()),wheel=e.makeMesh(...cylinder(.38,.28,14));const parts=[];const base=()=>M4.compose(state.pos,[state.pitch,state.yaw,state.bank]);
 const add=(mesh,color,loc,rot=[0,0,0],scale=[1,1,1])=>parts.push(e.add(mesh,color,()=>mult(base(),M4.compose(loc,rot,scale))));
 add(body,[.83,.86,.88],[0,0,0],[0,0,Math.PI/2]);add(nose,[.86,.89,.91],[16.5,0,0],[0,0,Math.PI/2]);add(tail,[.82,.85,.87],[-16,0,0],[0,0,Math.PI/2],[1,.85,1]);
 add(wing,[.72,.75,.77],[1,-.25,0],[0,0,0]);add(wing,[.72,.75,.77],[1,-.25,0],[0,Math.PI,0]);add(stab,[.67,.7,.72],[-12,.3,0]);add(stab,[.67,.7,.72],[-12,.3,0],[0,Math.PI,0]);add(fin,[.16,.55,.68],[-13,1.2,0],[0,0,Math.PI/2],[1,1.4,1]);
 add(eng,[.16,.18,.19],[4,-1.3,6.3],[0,0,Math.PI/2]);add(eng,[.16,.18,.19],[4,-1.3,-6.3],[0,0,Math.PI/2]);add(cube,[.04,.12,.17],[13.0,1.15,0],[0,0,0],[.7,.75,2.25]);
 // windows stripes
 for(let x=-9;x<11;x+=1.5){add(cube,[.05,.12,.17],[x,1.05,2.52],[0,0,0],[.48,.28,.08]);add(cube,[.05,.12,.17],[x,1.05,-2.52],[0,0,0],[.48,.28,.08])}
 // gear, wheels, landing lights
 add(cube,[.18,.18,.18],[7,-2.9,0],[0,0,0],[.24,2.5,.24]);add(wheel,[.03,.03,.03],[7,-4.0,.65],[Math.PI/2,0,0]);add(wheel,[.03,.03,.03],[7,-4.0,-.65],[Math.PI/2,0,0]);
 for(const z of [-3.7,3.7]){add(cube,[.18,.18,.18],[-3,-2.9,z],[0,0,0],[.24,2.4,.24]);add(wheel,[.03,.03,.03],[-3,-4,z],[Math.PI/2,0,0],[1.15,1.15,1.15])}
 for(const z of [-2.1,2.1])add(cube,[1,.88,.45],[10,-.65,z],[0,0,0],[.22,.22,.22]);
 return{parts,base}
}
