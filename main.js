import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1630);

const camera = new THREE.OrthographicCamera(
  window.innerWidth / -40,
  window.innerWidth / 40,
  window.innerHeight / 40,
  window.innerHeight / -40,
  1,
  2000
);

camera.position.set(60, 60, 60);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(50, 100, 50);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const MAP_SIZE = 100;

const tileGeo = new THREE.BoxGeometry(1, 0.2, 1);

for(let x = 0; x < MAP_SIZE; x++) {
  for(let z = 0; z < MAP_SIZE; z++) {

    let color = 0x7CA84B;

    const rand = Math.random();

    if(rand > 0.96) color = 0x888888;
    if(rand > 0.90 && rand < 0.96) color = 0x8B6F4E;
    if(z > 45 && z < 55) color = 0x3FA9DA;

    const mat = new THREE.MeshLambertMaterial({
      color
    });

    const tile = new THREE.Mesh(tileGeo, mat);

    tile.position.set(x, 0, z);

    scene.add(tile);
  }
}

const objects = [];

const cubeGeo = new THREE.BoxGeometry(1,1,1);

let currentTool = 'cube';

document.querySelectorAll('button').forEach(btn => {
  btn.onclick = () => {
    currentTool = btn.innerText.toLowerCase();
  };
});

window.addEventListener('click', (e) => {

  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children);

  if(intersects.length > 0) {

    const point = intersects[0].point;

    const x = Math.floor(point.x);
    const z = Math.floor(point.z);

    let y = 0;

    objects.forEach(o => {
      if(o.x === x && o.z === z) {
        y++;
      }
    });

    let color = 0xffaa00;

    if(currentTool === 'стена') color = 0xb87333;
    if(currentTool === 'окно') color = 0x87ceeb;
    if(currentTool === 'дверь') color = 0x654321;
    if(currentTool === 'крыша') color = 0xaa0000;

    const mat = new THREE.MeshLambertMaterial({
      color
    });

    const cube = new THREE.Mesh(cubeGeo, mat);

    cube.position.set(x, y + 0.5, z);

    scene.add(cube);

    objects.push({
      x,
      y,
      z
    });

    localStorage.setItem(
      'buildmap',
      JSON.stringify(objects)
    );
  }
});

const saved = JSON.parse(
  localStorage.getItem('buildmap') || '[]'
);

saved.forEach(s => {

  const mat = new THREE.MeshLambertMaterial({
    color: 0xffaa00
  });

  const cube = new THREE.Mesh(cubeGeo, mat);

  cube.position.set(
    s.x,
    s.y + 0.5,
    s.z
  );

  scene.add(cube);

  objects.push(s);
});

window.addEventListener('keydown', e => {

  if(e.key === 'w') camera.position.z -= 2;
  if(e.key === 's') camera.position.z += 2;
  if(e.key === 'a') camera.position.x -= 2;
  if(e.key === 'd') camera.position.x += 2;

});

window.addEventListener('wheel', e => {

  camera.zoom += e.deltaY * -0.001;

  camera.zoom = Math.min(
    Math.max(camera.zoom, 0.5),
    4
  );

  camera.updateProjectionMatrix();

});

function animate() {

  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

animate();
