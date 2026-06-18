```javascript
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js';

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

camera.position.set(60, 60, 60);

const renderer = new THREE.WebGLRenderer({
  antialias:true
});

renderer.setSize(
  window.innerWidth - 320,
  window.innerHeight
);

document
  .getElementById('canvas-container')
  .appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 2);

light.position.set(50,100,50);

scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 1));

const gridSize = 40;

const tileSize = 4;

const world = [];

const terrainColors = {
  grass:0x7ca84b,
  hill:0x8b6f4e,
  mountain:0x777777,
  river:0x3fa9da
};

function createTile(type,x,z,height=0){

  const geo = new THREE.BoxGeometry(
    tileSize,
    tileSize + height,
    tileSize
  );

  const mat = new THREE.MeshStandardMaterial({
    color:terrainColors[type]
  });

  const mesh = new THREE.Mesh(geo,mat);

  mesh.position.set(
    x*tileSize,
    height/2,
    z*tileSize
  );

  mesh.userData = {
    terrain:type,
    gridX:x,
    gridZ:z
  };

  scene.add(mesh);

  return mesh;
}

for(let x=0;x<gridSize;x++){

  world[x]=[];

  for(let z=0;z<gridSize;z++){

    let type='grass';
    let h=0;

    if(x<6 && z<6){
      type='mountain';
      h=10;
    }

    if(x>25 && z>25){
      type='hill';
      h=4;
    }

    if(
      z===Math.floor(
        10 + Math.sin(x*0.3)*5
      )
    ){
      type='river';
      h=-1;
    }

    world[x][z]=createTile(type,x,z,h);
  }
}

const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

const placedBlocks = [];

let currentRole = null;

let currentTool = 'wall';

const roleData = {

  director:{
    map:false,
    tools:[]
  },

  finance:{
    map:false,
    tools:[]
  },

  workers:{
    map:true,
    tools:[
      'wall',
      'window',
      'door',
      'roof'
    ]
  },

  architect:{
    map:true,
    tools:[]
  },

  engineer:{
    map:true,
    tools:[]
  },

  pr:{
    map:false,
    tools:[]
  },

  sales:{
    map:false,
    tools:[]
  },

  utilities:{
    map:true,
    tools:[
      'pipe',
      'electricity'
    ]
  },

  hr:{
    map:false,
    tools:[]
  }
};

const roleButtons =
  document.querySelectorAll('.role-btn');

roleButtons.forEach(btn=>{

  btn.onclick=()=>{

    currentRole=btn.dataset.role;

    startRole(currentRole);
  };

});

function startRole(role){

  document
    .getElementById('role-select')
    .classList.add('hidden');

  document
    .getElementById('role-ui')
    .classList.remove('hidden');

  document
    .getElementById('role-title')
    .innerText='Роль: '+role;

  buildTools(role);

  buildHUD(role);

  if(!roleData[role].map){

    renderer.domElement.style.display='none';

  }else{

    renderer.domElement.style.display='block';
  }
}

function buildTools(role){

  const toolsDiv =
    document.getElementById('tools');

  toolsDiv.innerHTML='';

  roleData[role].tools.forEach(tool=>{

    const btn =
      document.createElement('button');

    btn.className='tool-btn';

    btn.innerText=tool;

    btn.onclick=()=>{

      currentTool=tool;

      document
        .querySelectorAll('.tool-btn')
        .forEach(b=>b.classList.remove('tool-active'));

      btn.classList.add('tool-active');
    };

    toolsDiv.appendChild(btn);
  });
}

function buildHUD(role){

  const hud=document.getElementById('hud');

  if(role==='finance'){

    hud.innerHTML=`
      <b>Бюджет:</b> 12 000 000 ₽<br>
      <b>Материалы:</b> 340 блоков
    `;

    return;
  }

  if(role==='director'){

    hud.innerHTML=`
      <b>KPI:</b><br>
      - Построить 15 домов<br>
      - Не выйти за бюджет
    `;

    return;
  }

  hud.innerHTML='Активная игровая сессия';
}

function createBlock(x,y,z,color){

  const geo = new THREE.BoxGeometry(
    tileSize,
    tileSize,
    tileSize
  );

  const mat = new THREE.MeshStandardMaterial({
    color
  });

  const mesh = new THREE.Mesh(geo,mat);

  mesh.position.set(x,y,z);

  scene.add(mesh);

  placedBlocks.push(mesh);

  saveWorld();
}

function toolColor(tool){

  switch(tool){

    case 'wall':
      return 0xd1d5db;

    case 'window':
      return 0x60a5fa;

    case 'door':
      return 0x92400e;

    case 'roof':
      return 0xb91c1c;

    case 'pipe':
      return 0x2563eb;

    case 'electricity':
      return 0xfacc15;

    default:
      return 0xffffff;
  }
}

renderer.domElement.addEventListener(
  'click',
  event=>{

    if(!currentRole) return;

    if(!roleData[currentRole].map) return;

    if(
      currentRole!=='workers' &&
      currentRole!=='utilities'
    ) return;

    mouse.x =
      ((event.clientX-320) /
      (window.innerWidth-320))*2-1;

    mouse.y =
      -(event.clientY /
      window.innerHeight)*2+1;

    raycaster.setFromCamera(mouse,camera);

    const intersects =
      raycaster.intersectObjects(scene.children);

    if(intersects.length>0){

      const p = intersects[0].point;

      const gx =
        Math.round(p.x/tileSize);

      const gz =
        Math.round(p.z/tileSize);

      const gy =
        tileSize/2;

      createBlock(
        gx*tileSize,
        gy+2,
        gz*tileSize,
        toolColor(currentTool)
      );
    }
  }
);

function saveWorld(){

  const data = placedBlocks.map(b=>({

    x:b.position.x,
    y:b.position.y,
    z:b.position.z,
    c:b.material.color.getHex()

  }));

  localStorage.setItem(
    'stroyka_world',
    JSON.stringify(data)
  );
}

function loadWorld(){

  const raw =
    localStorage.getItem('stroyka_world');

  if(!raw) return;

  const data=JSON.parse(raw);

  data.forEach(d=>{

    createBlock(
      d.x,
      d.y,
      d.z,
      d.c
    );
  });
}

loadWorld();

document
  .getElementById('reset-btn')
  .onclick=()=>{

    localStorage.removeItem(
      'stroyka_world'
    );

    location.reload();
  };

const keys={};

window.addEventListener(
  'keydown',
  e=>keys[e.key]=true
);

window.addEventListener(
  'keyup',
  e=>keys[e.key]=false
);

function updateCamera(){

  if(keys['w']) camera.position.z-=1;
  if(keys['s']) camera.position.z+=1;

  if(keys['a']) camera.position.x-=1;
  if(keys['d']) camera.position.x+=1;
}

function animate(){

  requestAnimationFrame(animate);

  updateCamera();

  camera.lookAt(0,0,0);

  renderer.render(scene,camera);
}

animate();

window.addEventListener(
  'resize',
  ()=>{

    renderer.setSize(
      window.innerWidth-320,
      window.innerHeight
    );

    camera.aspect =
      (window.innerWidth-320) /
      window.innerHeight;

    camera.updateProjectionMatrix();
  }
);
```
