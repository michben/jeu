import * as THREE from './three.module.min.js';
import { GLYPHS } from './glyphs.js';
export const DISTANCE=28;
const D=DISTANCE,EPS=1e-8;
const signedArea=p=>p.reduce((a,c,i)=>{const n=p[(i+1)%p.length];return a+c[0]*n[1]-n[0]*c[1]},0)/2;
function clip(poly,axis,value,greater){
 const result=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],ia=greater?a[axis]>=value-EPS:a[axis]<=value+EPS,ib=greater?b[axis]>=value-EPS:b[axis]<=value+EPS;
  if(ia)result.push(a);
  if(ia!==ib){const t=(value-a[axis])/(b[axis]-a[axis]);result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
 }
 return result;
}
function rectangle(poly,x0,y0,x1,y1){let p=poly;for(const [axis,v,gt] of [[0,x0,true],[0,x1,false],[1,y0,true],[1,y1,false]]){p=clip(p,axis,v,gt);if(p.length<3)return []}return p;}
const cache={};
function glyphTriangles(char){
 if(cache[char])return cache[char];
 const p=new THREE.ShapePath();
 for(const c of GLYPHS[char].commands){
  if(c[0]==='M')p.moveTo(c[1],c[2]);if(c[0]==='L')p.lineTo(c[1],c[2]);
  if(c[0]==='Q')p.quadraticCurveTo(c[1],c[2],c[3],c[4]);
  if(c[0]==='C')p.bezierCurveTo(c[1],c[2],c[3],c[4],c[5],c[6]);
  if(c[0]==='Z')p.currentPath.closePath();
 }
 const g=new THREE.ShapeGeometry(p.toShapes(false),12),pos=g.attributes.position,idx=g.index.array,out=[];
 for(let i=0;i<idx.length;i+=3){let tri=[0,1,2].map(j=>[pos.getX(idx[i+j]),pos.getY(idx[i+j])]);if(signedArea(tri)<0)tri=[tri[0],tri[2],tri[1]];out.push(tri)}
 g.dispose();return cache[char]=out;
}
const key=p=>p.map(v=>v.toFixed(6)).join(',');
function fragmentGeometry(polygons,z,thickness){
 const front=[],side=[],samples=[],edges=new Map();
 const world=(p,depth)=>[p[0]*(D-depth)/D,p[1]*(D-depth)/D,depth];
 for(const poly of polygons){
  if(poly.length<3||Math.abs(signedArea(poly))<EPS)continue;
  for(let j=1;j<poly.length-1;j++){
   const tri=[poly[0],poly[j],poly[j+1]],f=tri.map(p=>world(p,z)),b=tri.map(p=>world(p,z-thickness));
   front.push(...f.flat());side.push(...b[2],...b[1],...b[0]);
   samples.push({target:tri[0],world:f[0]});
  }
  for(let j=0;j<poly.length;j++){
   const a=poly[j],b=poly[(j+1)%poly.length],ak=key(a),bk=key(b);if(ak===bk)continue;const k=[ak,bk].sort().join('|');
   if(edges.has(k))edges.delete(k);else edges.set(k,[a,b]);
  }
 }
 for(const [a,b] of edges.values()){
  const af=world(a,z),bf=world(b,z),ab=world(a,z-thickness),bb=world(b,z-thickness);
  side.push(...af,...ab,...bb,...af,...bb,...bf);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...front,...side],3));
 g.addGroup(0,front.length/3,0);g.addGroup(front.length/3,side.length/3,1);g.computeVertexNormals();
 return {geometry:g,samples};
}
export function makeSculpture(word,{depth=7,rows=3,cols=2,seed=0,width=8.9}={}){
 const chars=[...word],tracking=.037,total=chars.reduce((a,c)=>a+GLYPHS[c].advance+tracking,0)-tracking,s=width/total;
 let cursor=-total/2;const result=[];
 chars.forEach((char,letter)=>{
  const advance=GLYPHS[char].advance;
  const triangles=glyphTriangles(char).map(tri=>tri.map(([x,y])=>[(x+cursor)*s,(y-.36)*s]));
  const points=triangles.flat(),minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
   const x0=minX+(maxX-minX)*c/cols,x1=minX+(maxX-minX)*(c+1)/cols;
   const y0=minY+(maxY-minY)*r/rows,y1=minY+(maxY-minY)*(r+1)/rows;
   const polys=triangles.map(tri=>rectangle(tri,x0,y0,x1,y1)).filter(p=>p.length>=3&&Math.abs(signedArea(p))>EPS);
   if(!polys.length)continue;
   const i=letter*rows*cols+r*cols+c,n=(Math.sin((i+1)*127.1+seed*61.7)*43758.5453)%1;
   const z=((n+1)%1*2-1)*depth,thickness=.25+((i*7+seed)%9)*.045;
   const {geometry,samples}=fragmentGeometry(polys,z,thickness);
   result.push({geometry,samples,letter,char,z,depth:thickness});
  }
  cursor+=advance+tracking;
 });
 return result;
}
