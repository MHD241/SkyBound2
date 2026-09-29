export class MeshBuilder{
  constructor(){this.p=[];this.c=[]}
  tri(a,b,c,color){for(const v of [a,b,c]){this.p.push(v[0],v[1],v[2]);this.c.push(color[0],color[1],color[2])}}
  quad(a,b,c,d,color){this.tri(a,b,c,color);this.tri(a,c,d,color)}
  box(x,y,z,w,h,d,color){
    const x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
    const p=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
    this.quad(p[4],p[5],p[6],p[7],color);this.quad(p[1],p[0],p[3],p[2],color);this.quad(p[0],p[4],p[7],p[3],color);this.quad(p[5],p[1],p[2],p[6],color);this.quad(p[3],p[7],p[6],p[2],color);this.quad(p[0],p[1],p[5],p[4],color);
  }
  flatRect(x,y,z,w,d,color){this.quad([x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],color)}
  prism(points,height,color){
    if(points.length<3)return;for(let i=1;i<points.length-1;i++)this.tri([points[0][0],height,points[0][1]],[points[i][0],height,points[i][1]],[points[i+1][0],height,points[i+1][1]],color);
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];this.quad([a[0],0,a[1]],[b[0],0,b[1]],[b[0],height,b[1]],[a[0],height,a[1]],color)}
  }
  merge(other,ox=0,oy=0,oz=0){for(let i=0;i<other.p.length;i+=3)this.p.push(other.p[i]+ox,other.p[i+1]+oy,other.p[i+2]+oz);this.c.push(...other.c)}
  data(){return{positions:new Float32Array(this.p),colors:new Float32Array(this.c)}}
}

export function ellipseFan(cx,cz,rx,rz,y,color,segments=64){
  const b=new MeshBuilder();
  for(let i=0;i<segments;i++){const a=i/segments*Math.PI*2,n=(i+1)/segments*Math.PI*2;b.tri([cx,y,cz],[cx+Math.cos(a)*rx,y,cz+Math.sin(a)*rz],[cx+Math.cos(n)*rx,y,cz+Math.sin(n)*rz],color)}
  return b;
}

export function aircraftGeometry(type='JX-200',color=[.82,.86,.89]){
  const b=new MeshBuilder();
  const dark=[.15,.22,.27],glass=[.05,.16,.22],wing=[.72,.78,.82];
  if(type==='CONCORDE'){
    b.box(0,-.6,0,3.0,2.2,39,color); // fuselage
    b.prism([[-.4,-22],[.4,-22],[1.5,-18],[-1.5,-18]],1.0,color);
    b.prism([[-1,-12],[-14,9],[0,3],[14,9],[1,-12]],.35,wing);
    b.box(-3.8,-1.0,2,1.4,1.2,12,dark);b.box(3.8,-1.0,2,1.4,1.2,12,dark);
    b.box(-6.4,-1.1,4,1.2,1.1,9,dark);b.box(6.4,-1.1,4,1.2,1.1,9,dark);
    b.prism([[-.4,12],[.4,12],[.4,18],[-.4,16]],7,color);
    b.box(0,1.1,-17,2.3,.55,2.2,glass);
  } else {
    const regional=type==='JX-90';const len=regional?27:35,span=regional?24:31;
    b.box(0,-.5,0,regional?3.1:3.5,regional?3:3.4,len,color);
    b.prism([[-1,-5],[-span/2,5],[-span/2,7],[0,2],[span/2,7],[span/2,5],[1,-5]],.28,wing);
    b.prism([[-.45,9],[.45,9],[.7,15],[-.7,15]],regional?5.5:6.5,color);
    b.prism([[-.6,11],[-5.3,15],[0,13],[5.3,15],[.6,11]],.18,wing);
    b.box(-span*.22,-1.3,4,2.1,1.7,5.5,dark);b.box(span*.22,-1.3,4,2.1,1.7,5.5,dark);
    b.box(0,1.0,-len/2+1.8,regional?2.5:2.8,.65,2.2,glass);
  }
  return b.data();
}

export function fighterGeometry(){
  const b=new MeshBuilder();const c=[.28,.31,.33],d=[.08,.11,.13];
  b.prism([[0,-8],[-1.1,-3],[-5,4],[-1.3,3],[0,7],[1.3,3],[5,4],[1.1,-3]],.8,c);
  b.box(0,.7,-1,1.6,1.2,9,c);b.box(0,1.7,3,.5,2.5,3,d);return b.data();
}
