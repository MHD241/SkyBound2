export const DEG=Math.PI/180;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const wrap360=d=>((d%360)+360)%360;
export const shortestAngle=(a,b)=>{let d=wrap360(b)-wrap360(a);if(d>180)d-=360;if(d<-180)d+=360;return d};
export const dist2=(ax,az,bx,bz)=>Math.hypot(bx-ax,bz-az);

export function mat4Identity(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}
export function mat4Multiply(a,b){
  const o=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o;
}
export function mat4Perspective(fov,aspect,near,far){
  const f=1/Math.tan(fov/2),nf=1/(near-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);
}
export function mat4LookAt(eye,target,up=[0,1,0]){
  let zx=eye[0]-target[0],zy=eye[1]-target[1],zz=eye[2]-target[2];let zl=Math.hypot(zx,zy,zz)||1;zx/=zl;zy/=zl;zz/=zl;
  let xx=up[1]*zz-up[2]*zy,xy=up[2]*zx-up[0]*zz,xz=up[0]*zy-up[1]*zx;let xl=Math.hypot(xx,xy,xz)||1;xx/=xl;xy/=xl;xz/=xl;
  const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*eye[0]+xy*eye[1]+xz*eye[2]),-(yx*eye[0]+yy*eye[1]+yz*eye[2]),-(zx*eye[0]+zy*eye[1]+zz*eye[2]),1]);
}
export function mat4Model(x,y,z,heading=0,pitch=0,bank=0,scale=1){
  const ch=Math.cos(heading),sh=Math.sin(heading),cp=Math.cos(pitch),sp=Math.sin(pitch),cb=Math.cos(bank),sb=Math.sin(bank);
  // Yaw(Y), pitch(X), roll(Z), column-major.
  const m00=ch*cb+sh*sp*sb, m01=sb*cp, m02=-sh*cb+ch*sp*sb;
  const m10=-ch*sb+sh*sp*cb, m11=cb*cp, m12=sb*sh+ch*sp*cb;
  const m20=sh*cp, m21=-sp, m22=ch*cp;
  return new Float32Array([m00*scale,m01*scale,m02*scale,0,m10*scale,m11*scale,m12*scale,0,m20*scale,m21*scale,m22*scale,0,x,y,z,1]);
}
