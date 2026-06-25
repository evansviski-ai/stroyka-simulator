import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js?module";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js?module";

import { BLOCKS_BY_ID, EQUIPMENT_TYPES } from "./assets-registry.js";

const GRID_SIZE = 60; // видимая зона стройплощадки в клетках (упрощено относительно 1000x1000 ТЗ карты — стройплощадка компактнее)
const CELL = 2; // мировой размер клетки (совпадает с масштабом исходного main.js: snapped на шаг 2)

const gltfLoader = new GLTFLoader();
const gltfCache = new Map(); // url -> Promise<GLTF scene root>

function loadGLB(url) {
  if (!url) return Promise.resolve(null);
  if (gltfCache.has(url)) return gltfCache.get(url);
  const p = new Promise((resolve) => {
    gltfLoader.load(
      url,
      (gltf) => resolve(gltf.scene),
      undefined,
      (err) => {
        // GLB-геометрия может загрузиться отдельно от текстуры (colormap.png может быть недоступна) —
        // в таком случае возвращаем null и используем примитив-заглушку выше по стеку.
        console.warn("GLB load failed (geometry unavailable):", url);
        resolve(null);
      }
    );
  });
  gltfCache.set(url, p);
  return p;
}

function applyFlatColor(root, colorHex) {
  // Заменяем оригинальные Kenney-материалы (которые зависят от внешней colormap.png)
  // на простой однотонный материал — независимо от наличия текстуры.
  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.75, metalness: 0.05 });
  root.traverse((c) => {
    if (c.isMesh) {
      c.material = mat;
    }
  });
}

function makePlaceholderMesh(block) {
  const w = (block.size.w || 1) * CELL;
  const h = (block.size.h || 1) * CELL;
  const d = (block.size.d || 1) * CELL;
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({
    color: block.color || 0xcccccc,
    transparent: !!block.transparent,
    opacity: block.transparent ? 0.55 : 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2;
  return mesh;
}

export class StroykaScene {
  constructor(container) {
    this.container = container;
    this.objectsById = new Map(); // firebaseId -> THREE.Object3D
    this.equipmentById = new Map();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07111f);
    this.scene.fog = new THREE.Fog(0x07111f, 60, 220);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(16, 16, 16);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0, 0);
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 90;

    const ambient = new THREE.AmbientLight(0xffffff, 1.1);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(30, 50, 20);
    dir.castShadow = true;
    this.scene.add(dir);

    const grid = new THREE.GridHelper(GRID_SIZE * CELL, GRID_SIZE, 0x3b82f6, 0x1e293b);
    this.scene.add(grid);

    const groundGeo = new THREE.PlaneGeometry(GRID_SIZE * CELL, GRID_SIZE * CELL);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0d2030, roughness: 1 });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2();

    this._resizeHandler = () => this.handleResize();
    window.addEventListener("resize", this._resizeHandler);

    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  handleResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(this._animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  screenToGroundPoint(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const intersects = this.raycaster.intersectObject(this.groundMesh);
    if (!intersects.length) return null;
    return intersects[0].point;
  }

  snapToGrid(point) {
    return {
      x: Math.round(point.x / CELL) * CELL,
      z: Math.round(point.z / CELL) * CELL,
    };
  }

  /* ============ ОБЪЕКТЫ КАРТЫ (блоки) ============ */

  async spawnObject(id, data) {
    if (this.objectsById.has(id)) return;
    const block = BLOCKS_BY_ID[data.type];
    if (!block) return;

    let root;
    if (block.glb) {
      const tmpl = await loadGLB(block.glb);
      if (tmpl) {
        root = tmpl.clone(true);
        applyFlatColor(root, block.color || 0xcccccc);
      } else {
        root = makePlaceholderMesh(block);
      }
    } else {
      root = makePlaceholderMesh(block);
    }

    root.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });

    const group = new THREE.Group();
    group.add(root);
    group.position.set(data.x, (data.level || 0) * CELL, data.z);
    group.rotation.y = ((data.rotationY || 0) * Math.PI) / 180;
    group.userData.firebaseId = id;
    group.userData.blockId = data.type;

    this.scene.add(group);
    this.objectsById.set(id, group);
  }

  removeObject(id) {
    const obj = this.objectsById.get(id);
    if (!obj) return;
    this.scene.remove(obj);
    this.objectsById.delete(id);
  }

  syncObjects(dataMap) {
    const data = dataMap || {};
    for (const id of Array.from(this.objectsById.keys())) {
      if (!data[id]) this.removeObject(id);
    }
    for (const [id, obj] of Object.entries(data)) {
      this.spawnObject(id, obj);
    }
  }

  /* ============ СПЕЦТЕХНИКА ============ */

  async spawnEquipment(id, data) {
    if (this.equipmentById.has(id)) {
      this.updateEquipmentTransform(id, data);
      return;
    }
    const def = EQUIPMENT_TYPES[data.kind];
    if (!def) return;

    let root;
    if (def.glb) {
      const tmpl = await loadGLB(def.glb);
      if (tmpl) {
        root = tmpl.clone(true);
        applyFlatColor(root, def.color || 0xcccccc);
      }
    }
    if (!root) {
      const geo = new THREE.ConeGeometry(CELL * 0.6, CELL * 1.6, 6);
      const mat = new THREE.MeshStandardMaterial({ color: def.color });
      root = new THREE.Mesh(geo, mat);
      root.position.y = CELL * 0.8;
    }
    root.traverse((c) => {
      if (c.isMesh) c.castShadow = true;
    });

    const group = new THREE.Group();
    group.add(root);
    group.position.set(data.x || 0, 0, data.z || 0);
    group.userData.equipId = id;
    this.scene.add(group);
    this.equipmentById.set(id, group);
  }

  updateEquipmentTransform(id, data) {
    const group = this.equipmentById.get(id);
    if (!group) return;
    group.position.set(data.x || 0, 0, data.z || 0);
  }

  removeEquipment(id) {
    const obj = this.equipmentById.get(id);
    if (!obj) return;
    this.scene.remove(obj);
    this.equipmentById.delete(id);
  }

  syncEquipment(dataMap) {
    const data = dataMap || {};
    for (const id of Array.from(this.equipmentById.keys())) {
      if (!data[id]) this.removeEquipment(id);
    }
    for (const [id, obj] of Object.entries(data)) {
      this.spawnEquipment(id, obj);
    }
  }

  dispose() {
    window.removeEventListener("resize", this._resizeHandler);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export { CELL, GRID_SIZE };
