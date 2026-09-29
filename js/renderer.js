import{mat4Identity,mat4Perspective,mat4LookAt,mat4Multiply,mat4Model,clamp}from'./math.js';

const VS=`attribute vec3 aPos;attribute vec3 aColor;uniform mat4 uPV;uniform mat4 uModel;varying vec3 vColor;varying float vFog;void main(){vec4 w=uModel*vec4(aPos,1.0);gl_Position=uPV*w;vColor=aColor;vFog=clamp((length(w.xyz)/180000.0),0.0,1.0);}`;
const FS=`precision mediump float;varying vec3 vColor;varying float vFog;uniform vec3 uFog;void main(){vec3 c=mix(vColor,uFog,vFog*.72);gl_FragColor=vec4(c,1.0);}`;

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
function program(gl){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VS));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}

export class Renderer{
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'});
    if(!this.gl)throw new Error('WebGL is unavailable.');
    const gl=this.gl;this.prog=program(gl);gl.useProgram(this.prog);this.aPos=gl.getAttribLocation(this.prog,'aPos');this.aColor=gl.getAttribLocation(this.prog,'aColor');this.uPV=gl.getUniformLocation(this.prog,'uPV');this.uModel=gl.getUniformLocation(this.prog,'uModel');this.uFog=gl.getUniformLocation(this.prog,'uFog');
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(.48,.72,.82,1);gl.uniform3f(this.uFog,.48,.72,.82);this.meshes=new Map();this.cameraMode='chase';this.orbitYaw=0;this.orbitPitch=.22;this.orbitZoom=1;this.dragging=false;this._bindCamera();this.resize();window.addEventListener('resize',()=>this.resize());
  }
  resize(){const d=Math.min(devicePixelRatio||1,1.7),w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);this.canvas.width=Math.round(w*d);this.canvas.height=Math.round(h*d);this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.gl.viewport(0,0,this.canvas.width,this.canvas.height)}
  upload(name,data){const gl=this.gl;const pb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,data.positions,gl.STATIC_DRAW);const cb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,cb);gl.bufferData(gl.ARRAY_BUFFER,data.colors,gl.STATIC_DRAW);this.meshes.set(name,{pb,cb,count:data.positions.length/3})}
  _bindCamera(){
    this.canvas.addEventListener('pointerdown',e=>{this.dragging=true;this.px=e.clientX;this.py=e.clientY;this.canvas.setPointerCapture?.(e.pointerId)});
    this.canvas.addEventListener('pointermove',e=>{if(!this.dragging)return;const dx=e.clientX-this.px,dy=e.clientY-this.py;this.px=e.clientX;this.py=e.clientY;this.orbitYaw-=dx*.004;this.orbitPitch=clamp(this.orbitPitch-dy*.003,-.15,1.05)});
    const stop=()=>this.dragging=false;this.canvas.addEventListener('pointerup',stop);this.canvas.addEventListener('pointercancel',stop);this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.orbitZoom=clamp(this.orbitZoom*(1+Math.sign(e.deltaY)*.1),.45,2.6)},{passive:false});
  }
  setCameraMode(m){this.cameraMode=m}
  cameraFor(f,world){
    const h=f.heading,p=f.pitch,x=f.x,y=f.y,z=f.z;let eye,target;
    if(this.cameraMode==='cockpit'){
      eye=[x+Math.sin(h)*2.5,y+2.2,z-Math.cos(h)*2.5];target=[eye[0]+Math.sin(h)*150,eye[1]+Math.sin(p)*80,eye[2]-Math.cos(h)*150];
    }else if(this.cameraMode==='tower'){
      const a=world.airports[f.home]||world.airports.NPT;eye=[a.x+420,a.y+95,a.z+360];target=[x,y,z];
    }else{
      const dist=(f.type==='CONCORDE'?72:54)*this.orbitZoom;const yaw=h+this.orbitYaw;eye=[x-Math.sin(yaw)*dist,y+18+Math.sin(this.orbitPitch)*dist*.55,z+Math.cos(yaw)*dist];target=[x,y+4,z];
    }
    return{eye,target}
  }
  begin(flight,world){
    const gl=this.gl;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.prog);const cam=this.cameraFor(flight,world);const p=mat4Perspective(60*Math.PI/180,this.canvas.width/this.canvas.height,.2,500000);const v=mat4LookAt(cam.eye,cam.target,[0,1,0]);const pv=mat4Multiply(p,v);gl.uniformMatrix4fv(this.uPV,false,pv);return pv;
  }
  draw(name,model=mat4Identity()){const m=this.meshes.get(name);if(!m)return;const gl=this.gl;gl.uniformMatrix4fv(this.uModel,false,model);gl.bindBuffer(gl.ARRAY_BUFFER,m.pb);gl.enableVertexAttribArray(this.aPos);gl.vertexAttribPointer(this.aPos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,m.cb);gl.enableVertexAttribArray(this.aColor);gl.vertexAttribPointer(this.aColor,3,gl.FLOAT,false,0,0);gl.drawArrays(gl.TRIANGLES,0,m.count)}
  drawAircraft(name,state,scale=1){this.draw(name,mat4Model(state.x,state.y,state.z,state.heading,state.pitch,state.bank,scale))}
}
