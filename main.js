
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.164/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b7ff);

const camera = new THREE.OrthographicCamera(
window.innerWidth / -60,
window.innerWidth / 60,
window.innerHeight / 60,
window.innerHeight / -60,
0.1,
5000
);

camera.position.set(120,120,120);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff,1.1));

const light = new THREE.DirectionalLight(0xffffff,1.5);
light.position.set(120,200,120);
scene.add(light);

const MAP_SIZE = 80;
const TILE = 2;

const terrain = [];
const objects = [];

const mats = {
grass:new THREE.MeshStandardMaterial({color:0x7CA84B}),
hill:new THREE.MeshStandardMaterial({color:0x8B6F4E}),
water:new THREE.MeshStandardMaterial({color:0x3FA9DA,transparent:true,opacity:0.8}),
mountain:new THREE.MeshStandardMaterial({color:0x9B9B9F})
};

for(let x=0;x<MAP_SIZE;x++){

terrain[x]=[];

for(let z=0;z<MAP_SIZE;z++){

let type='grass';
let h=0;

const d1=Math.sqrt((x-15)*(x-15)+(z-15)*(z-15));
if(d1<12){type='mountain';h=4+Math.random()*3;}

const d2=Math.sqrt((x-62)*(x-62)+(z-62)*(z-62));
if(d2<9){type='hill';h=2;}

if(Math.abs(z-(40+Math.sin(x/8)*7))<2){type='water';h=-0.2;}

const tile=new THREE.Mesh(
new THREE.BoxGeometry(TILE,0.5,TILE),
mats[type]
);

tile.position.set(x*TILE,h/2,z*TILE);
tile.scale.y=Math.max(0.2,h+0.5);

tile.userData={terrain:true,type,x,z};

scene.add(tile);

terrain[x][z]=tile;

}

}

function createPiece(type){

let geo;
let mat;

if(type==='cube'){
geo=new THREE.BoxGeometry(1.8,1.8,1.8);
mat=new THREE.MeshStandardMaterial({color:0xff7847});
}

if(type==='wall'){
geo=new THREE.BoxGeometry(2,2,0.4);
mat=new THREE.MeshStandardMaterial({color:0x8c92ff});
}

if(type==='window'){
geo=new THREE.BoxGeometry(1.8,1.4,0.3);
mat=new THREE.MeshStandardMaterial({color:0x5eead4,transparent:true,opacity:0.8});
}

if(type==='door'){
geo=new THREE.BoxGeometry(1.2,2,0.3);
mat=new THREE.MeshStandardMaterial({color:0x7c4a21});
}

if(type==='roof'){
geo=new THREE.ConeGeometry(1.7,1.3,4);
mat=new THREE.MeshStandardMaterial({color:0xffc93c});
}

const mesh=new THREE.Mesh(geo,mat);
return mesh;

}

let currentTool='cube';
let rotationY=0;

window.selectTool=function(t){
currentTool=t;
}

window.addEventListener('keydown',e=>{
if(e.key.toLowerCase()==='r'){
rotationY+=Math.PI/2;
}
});

const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();

renderer.domElement.addEventListener('click',e=>{

mouse.x=(e.clientX/window.innerWidth)*2-1;
mouse.y=-(e.clientY/window.innerHeight)*2+1;

raycaster.setFromCamera(mouse,camera);

const hits=raycaster.intersectObjects(scene.children);

if(!hits.length)return;

const obj=hits[0].object;

if(!obj.userData.terrain)return;

const tx=obj.userData.x;
const tz=obj.userData.z;

if(obj.userData.type==='water'||obj.userData.type==='mountain'){
return;
}

if(currentTool==='delete'){

for(let i=objects.length-1;i>=0;i--){

const o=objects[i];

if(o.userData.x===tx && o.userData.z===tz){
scene.remove(o);
objects.splice(i,1);
break;
}

}

saveWorld();
return;

}

let top=0;

objects.forEach(o=>{
if(o.userData.x===tx && o.userData.z===tz){
top=Math.max(top,o.userData.level+1);
}
});

const piece=createPiece(currentTool);

piece.position.set(tx*TILE,top*2+2,tz*TILE);
piece.rotation.y=rotationY;

piece.userData={
x:tx,
z:tz,
level:top,
type:currentTool,
rotation:rotationY
};

scene.add(piece);
objects.push(piece);

saveWorld();

});

function saveWorld(){

const data=objects.map(o=>({
x:o.userData.x,
z:o.userData.z,
level:o.userData.level,
type:o.userData.type,
rotation:o.userData.rotation
}));

localStorage.setItem('stroyka_save',JSON.stringify(data));

}

function loadWorld(){

const raw=localStorage.getItem('stroyka_save');
if(!raw)return;

const data=JSON.parse(raw);

data.forEach(d=>{

const piece=createPiece(d.type);

piece.position.set(d.x*TILE,d.level*2+2,d.z*TILE);
piece.rotation.y=d.rotation;

piece.userData=d;

scene.add(piece);
objects.push(piece);

});

}

loadWorld();

window.addEventListener('resize',()=>{

camera.left = window.innerWidth / -60;
camera.right = window.innerWidth / 60;
camera.top = window.innerHeight / 60;
camera.bottom = window.innerHeight / -60;

camera.updateProjectionMatrix();

renderer.setSize(window.innerWidth, window.innerHeight);

});

function animate(){
requestAnimationFrame(animate);
controls.update();
renderer.render(scene,camera);
}

animate();
